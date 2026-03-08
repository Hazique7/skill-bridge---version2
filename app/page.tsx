import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeClient from "./HomeClient";

// 1. We added searchParams to the page props
export default async function Home({ 
  searchParams 
}: { 
  searchParams: { code?: string } 
}) {
  const supabase = await createClient();

  // ==========================================================
  // 2. THE TRAP: Catch the Supabase auth code on the homepage
  // ==========================================================
  if (searchParams?.code) {
    // Exchange the secret code for a secure login session
    const { error } = await supabase.auth.exchangeCodeForSession(searchParams.code);
    
    if (!error) {
      // If it works, instantly redirect them to the dashboard!
      redirect("/dashboard");
    } else {
      console.error("Auth Trap Error:", error.message);
    }
  }

  // ==========================================================
  // 3. Normal Homepage Logic (Runs if there is no code)
  // ==========================================================
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