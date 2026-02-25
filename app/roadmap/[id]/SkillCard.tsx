"use client";

import { useState } from "react";
import { CheckCircle2, PlayCircle, BookOpen, ExternalLink } from "lucide-react";

export default function SkillCard({ skill }: { skill: any }) {
  const [isCompleted, setIsCompleted] = useState(false);

  const toggleComplete = () => {
    const newState = !isCompleted;
    setIsCompleted(newState);

    // Dispatch custom event to update the Progress Bar
    window.dispatchEvent(new CustomEvent("skill-toggled", { 
      detail: { completed: newState } 
    }));
  };

  return (
    <div 
      className={`bg-white border rounded-xl p-5 shadow-sm transition-all duration-300 ${
        isCompleted ? "border-green-200 bg-green-50/30 opacity-75" : "hover:shadow-md"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className={`font-semibold text-lg ${isCompleted ? "line-through text-slate-500" : "text-slate-900"}`}>
          {skill.title}
        </h4>
        <button 
          onClick={toggleComplete}
          className={`transition-colors p-1 rounded-full hover:bg-slate-100 ${
            isCompleted ? "text-green-500" : "text-slate-300 hover:text-green-400"
          }`}
          title="Mark as completed"
        >
          <CheckCircle2 className="h-7 w-7" />
        </button>
      </div>
      
      <p className="text-sm text-slate-600 mb-5">
        {skill.description}
      </p>
      
      {/* Resources & Video Players */}
      {skill.resources && skill.resources.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          {skill.resources.map((resource: any, rIndex: number) => {
            const isYouTubeEmbed = resource.url?.includes("youtube.com/embed");

            return isYouTubeEmbed ? (
              <div key={rIndex} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <PlayCircle className="h-4 w-4 text-red-500" />
                  <span>Suggested Video</span>
                </div>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-black">
                  <iframe
                    src={resource.url}
                    title={resource.title || "YouTube video player"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                  />
                </div>
              </div>
            ) : (
              <a 
                key={rIndex} 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700 group"
              >
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="flex-grow line-clamp-1">{resource.title}</span>
                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}