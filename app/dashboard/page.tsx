import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Map, Trash2, Clock, ChevronRight, LogOut } from "lucide-react";
import { deleteRoadmapAction } from "@/app/actions/roadmap";
import { revalidatePath } from "next/cache";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/auth");

  // Fetch roadmaps
  const { data: roadmaps } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Streak logic (Simple count of activity rows)
  const { count: streakCount } = await supabase
    .from("user_activity")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", user.id);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NOTE: The overlapping <header> was completely removed from here. 
        Your global <Header /> from RootLayout will now sit perfectly at the top! 
      */}

      <main className="max-w-5xl mx-auto p-6 pt-10">
        
        {/* User Stats & Actions Bar (Moved from the old header) */}
        <div className="flex justify-end items-center gap-4 mb-10 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-full">
            <span className="text-orange-500 text-base">🔥</span> {streakCount || 0} Day Streak
          </div>
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-full hover:bg-red-50 hover:border-red-100">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>

        {/* Dashboard Title & Action */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Your Roadmaps</h2>
            <p className="text-slate-500">Pick up where you left off</p>
          </div>
          <Link href="/" className="bg-[#ccff00] text-slate-900 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-[#ccff00]/20">
            <Plus className="h-5 w-5" /> New Roadmap
          </Link>
        </div>

        {!roadmaps || roadmaps.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed rounded-3xl bg-white border-slate-200">
            <Map className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No roadmaps yet</h3>
            <p className="text-slate-500 mb-6 max-w-xs mx-auto">Create your first AI-powered learning path to start tracking your progress.</p>
            <Link href="/" className="text-[#a6d600] font-bold hover:underline flex items-center justify-center gap-2">
              Generate Roadmap <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap) => (
              <div key={roadmap.id} className="group relative">
                {/* Delete Action */}
                <form 
                  action={async () => {
                    "use server";
                    await deleteRoadmapAction(roadmap.id);
                    revalidatePath("/dashboard");
                  }}
                  className="absolute top-4 right-4 z-20"
                >
                  <button className="p-2 bg-white/80 backdrop-blur-sm text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 border border-slate-100 shadow-sm">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>

                <Link href={`/roadmap/${roadmap.id}`} className="block h-full">
                  <div className="border border-slate-200 rounded-2xl p-6 bg-white transition-all group-hover:border-[#ccff00] group-hover:shadow-xl group-hover:shadow-[#ccff00]/5 h-full flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-xl mb-4 capitalize text-slate-900 group-hover:text-[#a6d600] transition-colors line-clamp-2">{roadmap.topic.replace(/-/g, ' ')}</h3>
                      
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span>Progress</span>
                        <span className="text-slate-900">{roadmap.progress_percentage || 0}%</span>
                      </div>
                      
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                        <div 
                          className="h-full bg-[#ccff00] transition-all duration-500" 
                          style={{ width: `${roadmap.progress_percentage || 0}%` }} 
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-4 border-t border-slate-50">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(roadmap.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}