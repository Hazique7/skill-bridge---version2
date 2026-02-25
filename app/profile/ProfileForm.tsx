"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { User, Clock, BarChart, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updateProfileAction } from "@/app/actions/profile";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <div className="pt-4 flex justify-end">
      <button 
        type="submit" 
        disabled={pending}
        className="bg-[#ccff00] text-slate-900 px-8 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#ccff00]/20 disabled:opacity-50 flex items-center gap-2"
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
      </button>
    </div>
  );
}

export default function ProfileForm({ initialData }: { initialData: any }) {
  const [state, formAction] = useActionState(updateProfileAction, null);
  const [showSuccess, setShowSuccess] = useState(false);

  // 1. Create local state for your form fields
  const [displayName, setDisplayName] = useState(initialData?.display_name || "");
  const [currentLevel, setCurrentLevel] = useState(initialData?.current_level || "Beginner");
  const [weeklyHours, setWeeklyHours] = useState(initialData?.weekly_hours || 5);

  // 2. Automatically update the UI when fresh data arrives from the server
  useEffect(() => {
    if (initialData) {
      setDisplayName(initialData.display_name || "");
      setCurrentLevel(initialData.current_level || "Beginner");
      setWeeklyHours(initialData.weekly_hours || 5);
    }
  }, [initialData]);

  // Show success message for 3 seconds
  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      
      {showSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <p className="font-bold text-sm">{state?.message}</p>
        </div>
      )}

      {state?.error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{state.error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2 uppercase tracking-tight">
          <User className="h-4 w-4 text-slate-400" /> Display Name
        </label>
        {/* 3. Switched from defaultValue to value + onChange */}
        <input 
          type="text" 
          name="display_name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How should we call you?"
          className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-base outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/10 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2 uppercase tracking-tight">
            <BarChart className="h-4 w-4 text-slate-400" /> Current Level
          </label>
          {/* 3. Switched from defaultValue to value + onChange */}
          <select 
            name="current_level"
            value={currentLevel}
            onChange={(e) => setCurrentLevel(e.target.value)}
            className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-base outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/10 transition-all appearance-none"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2 uppercase tracking-tight">
            <Clock className="h-4 w-4 text-slate-400" /> Weekly Hours Available
          </label>
          {/* 3. Switched from defaultValue to value + onChange */}
          <input 
            type="number" 
            name="weekly_hours"
            min="1"
            max="168"
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(parseInt(e.target.value) || 0)}
            className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-base outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/10 transition-all"
          />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}