import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeClient from "./HomeClient";

export default async function Home({ 
  searchParams 
}: { 
  // In Next.js 15+, searchParams is a Promise!
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const supabase = await createClient();
  
  // 1. You MUST await the searchParams to read the URL
  const resolvedParams = await searchParams;
  const code = resolvedParams?.code;

  // ==========================================================
  // 2. THE TRAP: Catch the Supabase auth code
  // ==========================================================
  if (typeof code === 'string') {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Success! Instantly redirect them to the dashboard
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

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();
      
    if (profile) remainingCredits = profile.credits;
  }

  return <HomeClient remainingCredits={remainingCredits} />;
}