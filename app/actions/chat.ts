"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendChatMessage(
  roadmapContext: string, 
  message: string, 
  history: { role: string; content: string }[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "You must be logged in to chat." };
  }

  // 1. Use a System Message to set the tutor's behavior and roadmap context
  const systemPrompt = `
    You are an expert AI programming tutor and mentor for the Skill-Bridge platform. 
    The student is currently studying the following learning roadmap:
    
    ROADMAP CONTEXT:
    ${roadmapContext}
    
    INSTRUCTIONS:
    - Answer the student's questions strictly based on the roadmap provided.
    - If they ask for more resources, suggest high-quality, relevant concepts.
    - Keep your answers concise, encouraging, and highly educational.
    - Use markdown formatting (bolding, code blocks, bullet points) to make it readable.
  `;

  // 2. Build the proper message array that LLMs are trained to understand
  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...history, // Spread the previous chat history here
    { role: "user", content: message } // Add the new question at the end
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Skill-Bridge Chat",
      },
      body: JSON.stringify({
        // Specify an actual free model on OpenRouter, e.g., gemini-2.5-pro:free or llama-3
        model: "liquid/lfm-2.5-1.2b-thinking:free", 
        messages: formattedMessages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🚨 CHAT API RAW ERROR:", response.status, errorText);
      throw new Error(`API rejected the request: ${response.status}`);
    }

    const result = await response.json();
    return { reply: result.choices?.[0]?.message?.content || "I couldn't process that." };
    
  } catch (error: any) {
    console.error("Chat Error:", error);
    return { error: "Failed to connect to the AI tutor. Please try again." };
  }
}