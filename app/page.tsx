import { createClient } from "@/lib/supabase/server";
import HomeClient from "./HomeClient";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let remainingCredits = 3;

  // Fetch their current credits from the database
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();
      
    if (profile) remainingCredits = profile.credits;
  }

  // Render your exact UI!
  return <HomeClient remainingCredits={remainingCredits} />;
}