"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleSkillComplete(skillId: string, currentState: boolean, roadmapId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 1. Toggle the skill
  await supabase
    .from("skills")
    .update({ is_completed: !currentState })
    .eq("id", skillId);

  // 2. Recalculate Progress
  const { data: phases } = await supabase.from("phases").select("id").eq("roadmap_id", roadmapId);
  const phaseIds = phases?.map((p) => p.id) || [];

  const { count: totalSkills } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true })
    .in("phase_id", phaseIds);

  const { count: completedSkills } = await supabase
    .from("skills")
    .select("*", { count: "exact", head: true })
    .in("phase_id", phaseIds)
    .eq("is_completed", true);

  const newProgress = totalSkills ? Math.round((completedSkills! / totalSkills!) * 100) : 0;

  await supabase.from("roadmaps").update({ progress_percentage: newProgress }).eq("id", roadmapId);

  // 3. Activity Logging (For the Lean Streak Feature)
  if (!currentState) { 
    const today = new Date().toISOString().split('T')[0];
    // Uses upsert to act exactly like ON CONFLICT DO NOTHING for primary key (user_id, activity_date)
    await supabase.from("user_activity").upsert(
      { user_id: user.id, activity_date: today },
      { onConflict: 'user_id, activity_date', ignoreDuplicates: true }
    );
  }

  revalidatePath(`/roadmap/${roadmapId}`);
}