"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight, Zap, Mail, ArrowLeft } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // New state for email confirmation
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { display_name: displayName }
          }
        });
        if (error) throw error;
        
        // Flip to success message instead of redirecting immediately
        setShowSuccessMessage(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col lg:flex-row bg-white overflow-y-auto">
      
      {/* LEFT PANEL: Branding & Value Prop */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#e4f6dd] p-12 relative overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#ccff00] rounded-full blur-[120px] opacity-20"></div>

        <div className="flex items-center gap-2 relative z-10">
          <div className="bg-[#ccff00] p-2 rounded-lg shadow-sm">
            <Zap className="h-6 w-6 text-slate-900 fill-slate-900" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">Skill-Bridge</span>
        </div>

        <div className="max-w-md relative z-10">
          <h1 className="text-6xl font-black leading-[1.1] text-slate-900 mb-4">
            Transform Your <br />
            <span className="text-[#a6d600]">Learning Journey</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium leading-relaxed">
            AI-powered roadmaps that turn any learning goal into a clear, actionable path. Track progress, chat with your content, and master skills faster.
          </p>
        </div>

        <div className="flex gap-12 relative z-10">
          <div>
            <p className="text-3xl font-black text-slate-900">1000+</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Roadmaps Created</p>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">50K+</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Skills Tracked</p>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">95%</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Success Rate</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: The Form or Success Message */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-slate-50/50">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          
          {showSuccessMessage ? (
            /* EMAIL CONFIRMATION UI */
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-[#ccff00]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-10 w-10 text-slate-900" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Check your email</h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                We've sent a confirmation link to <span className="font-bold text-slate-900">{email}</span>. 
                Please verify your identity to start building your roadmaps.
              </p>
              <button 
                onClick={() => {
                  setShowSuccessMessage(false);
                  setIsLogin(true);
                }}
                className="inline-flex items-center gap-2 text-[#a6d600] font-black hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </button>
            </div>
          ) : (
            /* STANDARD AUTH FORM */
            <>
              <div className="text-center mb-10">
                <h2 className="text-4xl font-black text-slate-900 mb-3">
                  {isLogin ? "Sign In" : "Create Account"}
                </h2>
                <p className="text-slate-500 font-medium text-lg">
                  {isLogin ? "Welcome back! Enter your details." : "Start building your personalized roadmaps"}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></div>
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-tight">Display Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Hazique Ahmed Khan"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full h-14 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-base outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/10 transition-all placeholder:text-slate-300"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-tight">Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-base outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/10 transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-tight">Password</label>
                  <input 
                    type="password" 
                    required 
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-base outline-none focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/10 transition-all placeholder:text-slate-300"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center h-14 bg-[#ccff00] text-slate-900 font-black text-lg rounded-xl shadow-lg shadow-[#ccff00]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      {isLogin ? "Sign In" : "Create Account"} <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-slate-500 font-medium">
                {isLogin ? "Already have an account? " : "Back to "}
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }} 
                  className="text-[#a6d600] font-black hover:underline underline-offset-4"
                >
                  {isLogin ? "Sign-Up" : "Sign-In"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}