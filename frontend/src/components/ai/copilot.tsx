"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores";
import { systemApi } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AICopilot() {
  const { aiCopilotOpen, toggleAiCopilot } = useUIStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi — I'm the Syncra helper. Ask about stock levels, delayed orders, or what to purchase next." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await systemApi.aiChat(msg);
      setMessages((m) => [...m, { role: "assistant", content: res.data.data.response }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Backend offline — try: 'Why is stock low?' or check Inventory → Alerts." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!aiCopilotOpen) return null;

  return (
    <div className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col bg-[var(--surface)] border-l border-[var(--border)] shadow-lg">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div>
          <p className="text-sm font-bold">ERP Assistant</p>
          <p className="text-[10px] text-[var(--muted)]">Ask about inventory & ops</p>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleAiCopilot}><X className="h-4 w-4" /></Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
        {messages.map((msg, i) => (
          <div key={i} className={`${msg.role === "user" ? "ml-8" : "mr-4"}`}>
            <div className={`p-3 rounded text-[13px] ${
              msg.role === "user"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--background)] border border-[var(--border)]"
            }`}>
              <p className="text-[10px] font-bold uppercase mb-1 opacity-60">{msg.role === "user" ? "You" : "Assistant"}</p>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && <p className="text-xs text-[var(--muted)]">Thinking…</p>}
      </div>

      <div className="border-t border-[var(--border)] p-3 space-y-2">
        <div className="flex flex-wrap gap-1">
          {["Why is stock low?", "Delayed orders?", "Procurement tips"].map((s) => (
            <button key={s} onClick={() => send(s)} className="text-[10px] px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--surface-2)]">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a question…"
            className="flex-1 h-9 px-3 text-sm rounded border border-[var(--border)] bg-[var(--background)]"
          />
          <Button size="icon" onClick={() => send()} disabled={loading}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
