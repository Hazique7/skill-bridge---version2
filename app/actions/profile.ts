"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Notice we added `prevState` as the first argument
export async function updateProfileAction(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Not authenticated" };

  const displayName = formData.get("display_name") as string;
  const currentLevel = formData.get("current_level") as string;
  const weeklyHours = parseInt(formData.get("weekly_hours") as string, 10);

  // Using upsert to ensure it creates the row if it doesn't exist yet
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      display_name: displayName,
      current_level: currentLevel,
      weekly_hours: weeklyHours,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  
  // Return a success flag!
  return { success: true, message: "Profile updated successfully!" };
}