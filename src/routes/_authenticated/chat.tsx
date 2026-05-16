import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/GlassCard";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { askTutor } from "@/lib/tutor.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  component: Chat,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = ["Explain simply", "Short answer", "Detailed answer"];

function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your AI tutor. Ask me anything — math, science, history, code." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const callTutor = useServerFn(askTutor);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);

    // Persist
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase.from("chatbot_history").insert({
        user_id: u.user.id, role: "user", content,
      });
    }

    // Local placeholder response (Lovable AI Gateway can be wired in next iteration)
    await new Promise((r) => setTimeout(r, 900));
    const reply = `Great question! Here's a quick take on **"${content}"**:\n\n- Break it down into smaller parts\n- Identify the core concept\n- Apply it with a worked example\n\nWant me to go deeper?`;
    setMessages((m) => [...m, { role: "assistant", content: reply }]);
    if (u.user) {
      await supabase.from("chatbot_history").insert({
        user_id: u.user.id, role: "assistant", content: reply,
      });
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-4xl flex-col">
      <PageHeader title="AI Tutor" subtitle="Your always-on doubt solver." />

      <div className="glass flex-1 overflow-y-auto rounded-3xl p-6">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-primary text-primary-foreground glow"
                    : "glass"
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s + ": " + (input || "explain photosynthesis"))}
            className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs hover:bg-white/10">
            <Sparkles className="size-3" /> {s}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          className="glass flex-1 rounded-full px-5 py-3 text-sm outline-none"
        />
        <button type="submit" disabled={loading}
          className="grid size-12 place-items-center rounded-full bg-gradient-primary text-primary-foreground glow disabled:opacity-50">
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
