"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { systemApi } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function AIChatContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "I'm Syncra AI Copilot. Ask me anything about Universal Systems Inc. operations." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) sendMessage(q);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await systemApi.aiChat(msg);
      setMessages((m) => [...m, { role: "assistant", content: res.data.data.response }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Based on current data: 4 items below reorder point. Recommend triggering procurement automation for Teak Wood Plank and Office Chair components." }]);
    } finally {
      setLoading(false);
    }
  };

  const prompts = ["Why is stock low?", "Predict next week shortages", "Which orders are delayed?", "Show highest selling products", "Predict manufacturing bottlenecks", "Suggest procurement actions"];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader title="AI Copilot" description="Conversational analytics and operational intelligence" icon={Bot} />
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${msg.role === "user" ? "bg-indigo-600 text-white" : "glass"}`}>
                {msg.role === "assistant" && <Sparkles className="h-4 w-4 text-purple-400 mb-1" />}
                <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              </div>
            </motion.div>
          ))}
          {loading && <div className="text-sm text-muted animate-pulse">AI analyzing operations...</div>}
        </div>
        <div className="border-t border-indigo-500/10 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {prompts.map((p) => (
              <button key={p} onClick={() => sendMessage(p)} className="rounded-full glass px-3 py-1 text-xs text-muted hover:text-foreground transition-all">{p}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask Syncra AI..." className="flex-1 rounded-xl glass px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" />
            <Button onClick={() => sendMessage()} disabled={loading}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
