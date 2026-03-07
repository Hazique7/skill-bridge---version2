"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function generateRoadmapAction(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  // ==========================================================
  // 1. DEDUCT CREDIT FIRST
  // ==========================================================
  const { data: hasCredits, error: rpcError } = await supabase.rpc('decrement_user_credit');

  if (rpcError || !hasCredits) {
    return { 
      error: "You've used all 3 of your daily credits. Your credits will automatically reset 24 hours after your first generation." 
    };
  }

  // 2. FETCH THE USER'S PROFILE TO GET THEIR SETTINGS
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_level, weekly_hours")
    .eq("id", user.id)
    .single();

  const userLevel = profile?.current_level || "Beginner";
  const userHours = profile?.weekly_hours || 5;

  // ==========================================================
  // FIX #3: OPTIONAL TOPIC IF PDF UPLOADED
  // ==========================================================
  let rawTopic = formData.get("topic") as string || "";
  const file = formData.get("file") as File | null;

  // Ensure they provided AT LEAST a topic OR a file
  if (!rawTopic.trim() && (!file || file.size === 0)) {
    // If we fail here, refund the credit instantly
    await supabase.rpc('refund_user_credit');
    return { error: "Please provide a topic to learn or upload a PDF document." };
  }

  // If they uploaded a file but left the text box empty, give it a default name
  const topic = rawTopic.trim() || "Uploaded Document Analysis";
  const normalizedTopic = topic.toLowerCase().replace(/\s+/g, "-");

  const cacheKey = `${normalizedTopic}-${userLevel.toLowerCase()}-${userHours}h`;

  let pdfParts: any[] = [];
  let extraContext = "";
  let finalRoadmapId: string | null = null;

  // ==========================================================
  // 3. THE MASTER TRY-CATCH BLOCK (With Auto-Refund)
  // ==========================================================
  try {
    if (file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("PDF exceeds 5MB limit.");
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      pdfParts = [{
        type: "image_url",
        image_url: {
          url: `data:application/pdf;base64,${buffer.toString("base64")}`
        }
      }];

      extraContext = "Base the roadmap heavily on the attached PDF document.";
    }

    let roadmapJson;
    let queryEmbedding: number[] | null = null;

    const semanticSearchPhrase = `${topic} roadmap for a ${userLevel} studying ${userHours} hours a week`;

    // ==========================================================
    // 4. SEMANTIC CACHE CHECK (Via Hugging Face)
    // ==========================================================
    if (pdfParts.length === 0) {
      try {
        const hfResponse = await fetch(
          "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction",
          {
            headers: { 
              "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({ inputs: semanticSearchPhrase }),
          }
        );

        if (!hfResponse.ok) {
          throw new Error(`Hugging Face API failed: ${hfResponse.statusText}`);
        }

        const embeddingData = await hfResponse.json();
        queryEmbedding = Array.isArray(embeddingData[0]) ? embeddingData[0] : embeddingData;

        const { data: cached, error: rpcError } = await supabase.rpc('match_roadmaps', {
          query_embedding: queryEmbedding,
          match_threshold: 0.70,
          match_count: 1
        });

        if (rpcError) {
          console.error("🚨 SUPABASE RPC ERROR:", rpcError);
        }

        if (cached && cached.length > 0) {
          console.log("🔥 Semantic Cache Hit! Similarity Score:", cached[0].similarity);
          roadmapJson = typeof cached[0].roadmap_json === 'string' 
            ? JSON.parse(cached[0].roadmap_json) 
            : cached[0].roadmap_json;
        } else {
          console.log("🥶 Cache Miss: No similar roadmaps found.");
        }
        
      } catch (embedError) {
        console.error("⚠️ Hugging Face embedding failed:", embedError);
      }
    }

    // ==========================================================
    // 5. GENERATE FRESH ROADMAP (If no cache hit)
    // ==========================================================
    if (!roadmapJson) {
      console.log("Generating fresh roadmap via AI...");
      const prompt = `
        Create a highly structured learning roadmap for: "${topic}".
        
        CRITICAL TARGET AUDIENCE PROFILE:
        - Current Skill Level: ${userLevel}
        - Time Commitment: ${userHours} hours per week.
        
        You MUST tailor the complexity of the skills, the pacing of the phases, and the types of recommended YouTube videos specifically for a ${userLevel} who can only study ${userHours} hours a week. Do not give advanced concepts to beginners, and do not give basic introductions to advanced users.
        
        ${extraContext}
        
        Output MUST be strict JSON matching this structure exactly:
        {
          "topic": "Cleaned up topic name",
          "phases": [
            {
              "title": "Phase Name (Tailored for ${userLevel})",
              "phase_order": 1,
              "capstone_title": "Project Name",
              "capstone_description": "Project details",
              "skills": [
                {
                  "title": "Skill Name",
                  "description": "Short explanation",
                  "resources": [
                    {
                      "title": "Video Title",
                      "search_query": "highly specific youtube search query tailored for ${userLevel} tutorials"
                    }
                  ]
                }
              ]
            }
          ]
        }
        Include exactly 3 phases. Limit to 3-5 skills per phase.
        CRITICAL: Escape all double quotes using \\"
        Output ONLY raw JSON.
      `;

      // ==========================================================
      // FIX #2: AI FALLBACK SYSTEM
      // ==========================================================
      const aiModelsToTry = [
        "google/gemma-3-4b-it:free",         // 3rd choice: Original model
        "google/gemma-3-27b-it:free",     // 1st choice: Fast & high limits
        "qwen/qwen3-next-80b-a3b-instruct:free" // 2nd choice: Reliable fallback
      ];

      let rawText = "";

      for (const modelId of aiModelsToTry) {
        try {
          console.log(`🤖 Trying AI Model: ${modelId}...`);
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "http://localhost:3000",
              "X-Title": "Skill-Bridge",
            },
            body: JSON.stringify({
              model: modelId, 
              messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...pdfParts] }]
            })
          });

          if (!response.ok) {
            console.warn(`⚠️ Model ${modelId} failed (${response.status}). Swapping to fallback...`);
            continue; // This skips to the next model in the array
          }

          const result = await response.json();
          rawText = result.choices?.[0]?.message?.content || "";
          
          if (rawText) {
            console.log(`✅ Success with ${modelId}!`);
            break; // We got the data, exit the loop!
          }

        } catch (error) {
          console.warn(`⚠️ Network error with ${modelId}, trying next...`);
          continue;
        }
      }

      if (!rawText) {
        throw new Error("All AI models are currently busy. Please try again in a few minutes.");
      }

      const cleanedText = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/[\u0000-\u001F]+/g, " ")
        .trim();

      try {
        roadmapJson = JSON.parse(cleanedText);
      } catch {
        console.error("MALFORMED JSON FROM AI:", rawText); 
        throw new Error("The AI returned malformed data. Please try again.");
      }

      // ==========================================================
      // FIX #1: YOUTUBE EMBEDDABLE ONLY
      // ==========================================================
      if (process.env.YOUTUBE_API_KEY) {
        const fetchYoutubeVideo = async (query: string) => {
          try {
            // Added &videoEmbeddable=true so it doesn't fetch locked videos
            const ytRes = await fetch(
              `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query)}&type=video&videoEmbeddable=true&key=${process.env.YOUTUBE_API_KEY}`
            );
            const ytData = await ytRes.json();

            if (ytData.items?.length > 0) {
              return `https://www.youtube.com/embed/${ytData.items[0].id.videoId}`;
            }
          } catch {
            console.error("YouTube fetch error");
          }
          return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        };

        for (const phase of roadmapJson.phases) {
          for (const skill of phase.skills) {
            if (skill.resources) {
              await Promise.all(
                skill.resources.map(async (res: any) => {
                  if (res.search_query) {
                    res.url = await fetchYoutubeVideo(res.search_query);
                    delete res.search_query;
                  }
                })
              );
            }
          }
        }
      }

      // 6. SAVE TO CACHE WITH EMBEDDING
      if (pdfParts.length === 0 && queryEmbedding) {
        await supabase.from("roadmap_cache").insert({
          topic_hash: cacheKey,
          roadmap_json: roadmapJson,
          embedding: queryEmbedding
        });
      }
    }

    // Save to DB
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .insert({
        user_id: user.id,
        topic: roadmapJson.topic
      })
      .select()
      .single();

    if (roadmapError) {
      throw new Error(`Database Error: ${roadmapError.message}`);
    }

    // Insert Phases + Skills
    for (const phase of roadmapJson.phases) {
      const { data: phaseData } = await supabase
        .from("phases")
        .insert({
          roadmap_id: roadmap.id,
          title: phase.title,
          phase_order: phase.phase_order,
          capstone_title: phase.capstone_title,
          capstone_description: phase.capstone_description,
        })
        .select()
        .single();

      if (phaseData && phase.skills) {
        const skillsToInsert = phase.skills.map((skill: any) => ({
          phase_id: phaseData.id,
          title: skill.title,
          description: skill.description,
          resources: skill.resources || [],
        }));

        await supabase.from("skills").insert(skillsToInsert);
      }
    }
    
    finalRoadmapId = roadmap.id;

  } catch (err: any) {
    // 4. AUTOMATIC REFUND ON ERROR
    await supabase.rpc('refund_user_credit');
    console.error("🚀 GENERATION CRASHED:", err);
    return { error: err.message || "An unexpected error occurred. Your credit has been refunded." };
  }

  if (finalRoadmapId) {
    redirect(`/roadmap/${finalRoadmapId}`);
  }
}

export async function deleteRoadmapAction(roadmapId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("roadmaps")
    .delete()
    .eq("id", roadmapId);

  if (error) {
    throw new Error("Failed to delete roadmap.");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

