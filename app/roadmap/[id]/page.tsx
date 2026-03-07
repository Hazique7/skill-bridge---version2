import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import SkillCard from "./SkillCard";
import ProgressBar from "./ProgressBar";
import ChatWidget from "./ChatWidget";
import { Trash2, ChevronLeft } from "lucide-react";
import { deleteRoadmapAction } from "@/app/actions/roadmap";
import Link from "next/link";

export default async function RoadmapPage(props: { params: Promise<{ id: string }> }) {
  // Next 15+ strictly requires params to be awaited this way
  const params = await props.params;
  const roadmapId = params.id;

  const supabase = await createClient();

  const { data: roadmap, error } = await supabase
    .from("roadmaps")
    .select(`
      *,
      phases (
        *,
        skills (*)
      )
    `)
    .eq("id", roadmapId)
    .single();

  if (error || !roadmap) {
    notFound();
  }

  const sortedPhases = roadmap.phases?.sort((a: any, b: any) => a.phase_order - b.phase_order) || [];
  const totalSkills = roadmap.phases.reduce((acc: number, phase: any) => acc + (phase.skills?.length || 0), 0);

  return (
    <main className="min-h-screen bg-slate-50 pb-20 relative">
      <ProgressBar totalSkills={totalSkills} />

      <div className="p-6 md:p-12 lg:p-24 pt-8">
        <div className="max-w-4xl mx-auto">
          
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-sm mb-8 transition-colors group">
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 rounded-full bg-[#ccff00]/20 text-slate-800 text-sm font-bold mb-2">
                Skill-Bridge Roadmap
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight capitalize text-slate-900">
                {roadmap.topic.replace(/-/g, ' ')}
              </h1>
              <p className="text-lg text-slate-600 font-medium">
                Your structured learning path is ready. Watch the curated videos and mark skills as complete.
              </p>
            </div>

            <form action={async () => {
              "use server";
              await deleteRoadmapAction(roadmapId);
              redirect("/dashboard");
            }}>
              <button className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </form>
          </div>

          <div className="space-y-12">
            {sortedPhases.map((phase: any) => (
              <div key={phase.id} className="relative">
                <div className="mb-6 flex items-center gap-4">
                  <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-900 text-[#ccff00] font-black shadow-lg shadow-slate-900/20">
                    {phase.phase_order}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900">{phase.title}</h2>
                </div>
                
                {phase.capstone_title && (
                  <div className="mt-4 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm ml-14 mb-8">
                    <h3 className="font-bold text-xs text-[#a6d600] uppercase tracking-widest mb-1">Phase Project</h3>
                    <p className="font-black text-slate-900 text-xl">{phase.capstone_title}</p>
                    <p className="text-slate-500 mt-2 font-medium">{phase.capstone_description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-14">
                  {phase.skills?.map((skill: any) => (
                    <SkillCard key={skill.id} skill={skill} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ChatWidget 
        roadmapContext={JSON.stringify({
          topic: roadmap.topic,
          phases: sortedPhases
        })} 
      />
    </main>
  );
}