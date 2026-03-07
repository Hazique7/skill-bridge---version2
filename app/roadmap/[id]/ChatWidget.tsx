"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { sendChatMessage } from "@/app/actions/chat";
// 1. IMPORT YOUR NEW COMPONENT
import ChatMessage from "../../components/ChatMessage"; 

export default function ChatWidget({ roadmapContext }: { roadmapContext: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hi! I'm your AI tutor. Ask me anything about this roadmap!" }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    const { reply, error } = await sendChatMessage(roadmapContext, userMessage, messages);

    setIsLoading(false);
    
    if (error) {
      setMessages([...newMessages, { role: "assistant", content: `❌ ${error}` }]);
    } else if (reply) {
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-16 w-16 bg-slate-900 text-[#ccff00] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 ${isOpen ? "hidden" : "flex"}`}
      >
        <MessageCircle className="h-8 w-8" />
      </button>

      {/* Chat Window Panel */}
      <div 
        className={`fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-50 transition-all duration-300 transform origin-bottom-right ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}`}
      >
        {/* Chat Header */}
        <div className="bg-slate-900 text-white p-4 rounded-t-3xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#ccff00]" />
            <h3 className="font-bold">AI Roadmap Tutor</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              
              {msg.role === "assistant" && (
                <div className="h-8 w-8 bg-[#ccff00]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-slate-700" />
                </div>
              )}

              <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                msg.role === "user" 
                  ? "bg-[#ccff00] text-slate-900 font-medium rounded-tr-sm shadow-sm" 
                  : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                  
              }`}>
                {/* 2. REPLACED PLAIN TEXT WITH CHATMESSGE COMPONENT */}
                <ChatMessage message={msg} />
              </div>

            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in">
              <div className="h-8 w-8 bg-[#ccff00]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Loader2 className="h-4 w-4 text-slate-700 animate-spin" />
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Box */}
        <div className="p-4 bg-white border-t border-slate-100 rounded-b-3xl">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this roadmap..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-[#ccff00] focus:ring-2 focus:ring-[#ccff00]/20 text-sm"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#ccff00] text-slate-900 p-2.5 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}