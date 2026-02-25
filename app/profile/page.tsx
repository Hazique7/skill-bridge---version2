import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, Settings } from "lucide-react";
import ProfileForm from "./ProfileForm"; // Import the new client component

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Fetch the custom profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white p-6 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="bg-[#ccff00] p-1.5 rounded-lg">
              <Settings className="h-6 w-6 text-slate-900" /> 
            </div>
            Profile Settings
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 mt-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          
          <div className="flex items-center gap-5 mb-10 pb-8 border-b border-slate-100">
            <div className="h-20 w-20 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-inner">
              <User className="h-10 w-10 text-slate-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">
                {profile?.display_name || "Skill-Bridge User"}
              </h2>
              <p className="text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-md inline-block text-sm">
                {user.email}
              </p>
            </div>
          </div>

          {/* Render our interactive form and pass the fetched data */}
          <ProfileForm initialData={profile} />
          
        </div>
      </main>
    </div>
  );
}