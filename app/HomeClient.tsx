"use client";

import { useState, useEffect, useActionState } from "react";
import { generateRoadmapAction } from "@/app/actions/roadmap";
import { Sparkles, Upload, FileText, Check, AlertCircle } from "lucide-react";

const LOADING_STEPS = [
  "Analyzing input",
  "Identifying key skills",
  "Structuring phases",
  "Curating resources"
];

function FormContent({
  fileName,
  onFileChange,
  error,
  isPending,
  remainingCredits // ✅ Added credits prop
}: {
  fileName: string | null;
  onFileChange: (e: any) => void;
  error: string | undefined;
  isPending: boolean;
  remainingCredits: number;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const outOfCredits = remainingCredits <= 0; // ✅ Logic check

  useEffect(() => {
    if (!isPending) {
      setActiveStep(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveStep((prev) =>
        prev < LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isPending]);

  // ✅ Loading UI (Untouched)
  if (isPending) {
    return (
      <div className="py-12 flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#ccff00] blur-[30px] opacity-60 rounded-full"></div>
          <div className="relative h-20 w-20 bg-[#ccff00] rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="h-10 w-10 text-slate-900" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2 text-slate-900">
          Generating Your Roadmap
        </h2>
        <p className="text-muted-foreground mb-12">
          Creating your personalized roadmap...
        </p>

        <div className="space-y-4 w-full max-w-sm">
          {LOADING_STEPS.map((step, index) => {
            const isCompleted = index < activeStep;
            const isActive = index === activeStep;
            const isFuture = index > activeStep;

            return (
              <div key={step} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <div className="h-6 w-6 rounded-full bg-[#ccff00] flex items-center justify-center">
                      <Check className="h-4 w-4 text-slate-900" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-500">
                      {index + 1}
                    </div>
                  )}
                </div>

                <div className="flex-grow flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      isFuture ? "text-slate-400" : "text-slate-700"
                    }`}
                  >
                    {step}
                  </span>

                  {isActive && (
                    <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#ccff00] w-1/2 animate-pulse rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ✅ Normal Form UI
  return (
    <>
      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            What do you want to learn?
          </label>
          <input
            name="topic"
            type="text"
            placeholder="e.g., Python Data Science, React Native..."
            className="w-full flex h-12 rounded-lg border bg-background px-4 py-2 text-base outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="relative border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 text-center hover:bg-muted/5 transition-colors">
          <input
            type="file"
            name="file"
            accept="application/pdf"
            onChange={onFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {fileName ? (
            <div className="flex flex-col items-center pointer-events-none">
              <FileText className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-medium text-primary line-clamp-1 px-4">
                {fileName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click to change file
              </p>
            </div>
          ) : (
            <div className="pointer-events-none">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">
                Optional: Upload a Syllabus (PDF)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max 5MB. We'll extract text and build a roadmap.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Updated Button with disable logic */}
      <button
        type="submit"
        disabled={outOfCredits}
        className="w-full h-14 mt-6 text-lg font-semibold bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className="h-5 w-5" />
        Generate Roadmap
      </button>

      {/* ✅ Credit Warning Text */}
      <div className="mt-4 text-center">
        {outOfCredits ? (
          <p className="text-sm font-bold text-red-500">
            ⚡ You are out of credits. Please wait 24 hours.
          </p>
        ) : (
          <p className="text-sm font-medium text-slate-500">
            ⚡ {remainingCredits} / 3 Daily Credits
          </p>
        )}
      </div>
    </>
  );
}

export default function HomeClient({ remainingCredits }: { remainingCredits: number }) {
  const [fileName, setFileName] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(
    generateRoadmapAction,
    null
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-slate-900">
          Structure Your Learning.
        </h1>
        <p className="text-lg text-slate-600">
          Enter a topic or upload a syllabus. We'll generate a measurable,
          step-by-step roadmap.
        </p>
      </div>

      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[400px]">
        <form action={formAction}>
          <FormContent
            fileName={fileName}
            onFileChange={handleFileChange}
            error={state?.error}
            isPending={isPending}
            remainingCredits={remainingCredits} // ✅ Pass it down
          />
        </form>
      </div>
    </div>
  );
}