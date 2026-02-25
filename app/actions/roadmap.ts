"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function generateRoadmapAction(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  // 1. FETCH THE USER'S PROFILE TO GET THEIR SETTINGS
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_level, weekly_hours")
    .eq("id", user.id)
    .single();

  // Set defaults just in case they haven't saved a profile yet
  const userLevel = profile?.current_level || "Beginner";
  const userHours = profile?.weekly_hours || 5;

  const topic = formData.get("topic") as string;
  const file = formData.get("file") as File | null;
  const normalizedTopic = topic.toLowerCase().trim().replace(/\s+/g, "-");

  // 2. CREATE A UNIQUE CACHE KEY BASED ON LEVEL AND HOURS
  const cacheKey = `${normalizedTopic}-${userLevel.toLowerCase()}-${userHours}h`;

  let pdfParts: any[] = [];
  let extraContext = "";
  
  // Safely declare the ID outside the try block
  let finalRoadmapId: string | null = null;

  try {
    if (file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return { error: "PDF exceeds 5MB limit." };
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

    // Check cache using the NEW personalized cache key
    if (pdfParts.length === 0) {
      const { data: cached } = await supabase
        .from("roadmap_cache")
        .select("roadmap_json")
        .eq("topic_hash", cacheKey)
        .single();

      if (cached) roadmapJson = cached.roadmap_json;
    }

    // Generate via AI if not cached
    if (!roadmapJson) {
      // 3. INJECT THE PROFILE DATA INTO THE AI PROMPT
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

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemma-3-4b-it:free",
          messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...pdfParts] }],
          plugins: [{ id: "file-parser", pdf: { engine: "pdf-text" } }]
        })
      });

      if (!response.ok) {
        return { error: "AI generation failed. Please try again." };
      }

      const result = await response.json();
      const rawText = result.choices?.[0]?.message?.content || "";
      const cleanedText = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/[\u0000-\u001F]+/g, " ")
        .trim();

      try {
        roadmapJson = JSON.parse(cleanedText);
      } catch {
        return { error: "AI generated malformed JSON. Please try again." };
      }

      // YouTube API Enhancement
      if (process.env.YOUTUBE_API_KEY) {
        const fetchYoutubeVideo = async (query: string) => {
          try {
            const ytRes = await fetch(
              `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query)}&type=video&key=${process.env.YOUTUBE_API_KEY}`
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

      // ONLY Cache if we just generated it AND there is no PDF
      if (pdfParts.length === 0) {
        await supabase.from("roadmap_cache").insert({
          topic_hash: cacheKey,
          roadmap_json: roadmapJson
        });
      }
    }

    // ===== SAVE TO DATABASE =====
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .insert({
        user_id: user.id,
        topic: roadmapJson.topic
      })
      .select()
      .single();

    if (roadmapError) {
      if (roadmapError.message.includes("Maximum 3 roadmaps")) {
        return {
          error: "You've reached the free tier limit of 3 roadmaps per 24 hours. Please try again tomorrow!"
        };
      }
      return {
        error: roadmapError.message || "Failed to create roadmap."
      };
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
    
    // Safely assign the ID to our scoped variable
    finalRoadmapId = roadmap.id;

  } catch (err: any) {
    return { error: err.message || "Something went wrong." };
  }

  // Redirect safely outside the try/catch
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

  // Revalidate the cache first so the deleted item vanishes immediately
  revalidatePath("/dashboard");
  redirect("/dashboard");
}