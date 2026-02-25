"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, ExternalLink, BookOpen } from "lucide-react";
import { toggleSkillComplete } from "@/app/actions/progress";

export default function JourneyMap({ phases, roadmapId }: { phases: any[]; roadmapId: string }) {
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = (skillId: string, currentState: boolean) => {
    setLoadingId(skillId);
    startTransition(async () => {
      await toggleSkillComplete(skillId, currentState, roadmapId);
      setLoadingId(null);
    });
  };

  return (
    <div className="space-y-12">
      {phases.map((phase, index) => (
        <div key={phase.id} className="relative bg-card rounded-2xl border p-6 shadow-sm">
          <div className="mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="bg-primary/20 text-primary h-8 w-8 flex items-center justify-center rounded-full text-sm">
                {index + 1}
              </span>
              {phase.title}
            </h2>
            {phase.capstone_title && (
              <div className="mt-4 bg-muted/50 p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2 mb-1">
                  Capstone: {phase.capstone_title}
                </h4>
                <p className="text-sm text-muted-foreground">{phase.capstone_description}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phase.skills.sort((a: any, b: any) => a.title.localeCompare(b.title)).map((skill: any) => (
              <div 
                key={skill.id} 
                onClick={() => handleToggle(skill.id, skill.is_completed)}
                className={`
                  relative flex flex-col justify-between p-5 rounded-xl border-2 cursor-pointer transition-all duration-300
                  hover:-translate-y-1 hover:shadow-md
                  ${skill.is_completed ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}
                `}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`font-semibold pr-4 ${skill.is_completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {skill.title}
                    </h3>
                    <div className={`
                      flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors
                      ${skill.is_completed ? "bg-primary border-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "border-muted-foreground/30"}
                    `}>
                      {loadingId === skill.id ? (
                        <Loader2 className="h-3 w-3 animate-spin text-foreground" />
                      ) : skill.is_completed ? (
                        <Check className="h-4 w-4 text-primary-foreground stroke-[3]" />
                      ) : null}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {skill.description}
                  </p>
                </div>

                {/* Render JSONB Resources */}
                {skill.resources && skill.resources.length > 0 && (
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2">
                      <BookOpen className="h-3 w-3" /> Resources
                    </div>
                    <div className="space-y-1">
                      {skill.resources.map((res: any, i: number) => (
                        <a 
                          key={i} 
                          href={res.url} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()} 
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate">{res.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}