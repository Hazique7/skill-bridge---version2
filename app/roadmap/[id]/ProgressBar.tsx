"use client";

import { useEffect, useState } from "react";

export default function ProgressBar({ totalSkills }: { totalSkills: number }) {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    // Listen for custom events from SkillCards
    const handleUpdate = (e: any) => {
      const { completed } = e.detail;
      setCompletedCount((prev) => completed ? prev + 1 : prev - 1);
    };

    window.addEventListener("skill-toggled", handleUpdate);
    return () => window.removeEventListener("skill-toggled", handleUpdate);
  }, []);

  const progressPercentage = totalSkills > 0 ? (completedCount / totalSkills) * 100 : 0;

  return (
    <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 mb-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-slate-700">Your Progress</span>
          <span className="text-sm font-black text-[#a6d600]">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#ccff00] transition-all duration-500 ease-out shadow-[0_0_10px_#ccff00]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}