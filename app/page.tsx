export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HomeClient from "./HomeClient";

export default async function Home(props: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const searchParams = await props.searchParams;
  const code = searchParams?.code;

  // ==========================================================
  // THE NEW TRAP: Bounce the code to the API route!
  // ==========================================================
  if (typeof code === 'string') {
    // This sends the code to your Route Handler, which is allowed to set the browser cookies
    redirect(`/auth/callback?code=${code}`);
  }

  // ==========================================================
  // Normal Homepage Logic (Runs if there is no code)
  // ==========================================================
  const supabase = await createClient();
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