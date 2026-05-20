import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/GlassCard";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2, Paperclip, X, ListOrdered, FileText, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { askTutor } from "@/lib/tutor.functions";
import { toast } from "sonner";
import { useT } from "@/i18n/LanguageContext";

export const Route = createFileRoute("/_authenticated/chat")({
  component: Chat,
});

type Attachment = { name: string; mimeType: string; data: string; preview?: string };
type Msg = {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
};

const SUGGESTION_KEYS = ["chat.sug.explain", "chat.sug.short", "chat.sug.detailed"] as const;
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? "");
      const idx = s.indexOf(",");
      resolve(idx >= 0 ? s.slice(idx + 1) : s);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function Chat() {
  const t = useT();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: t("chat.greeting") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepMode, setStepMode] = useState(false);
  const [pending, setPending] = useState<Attachment[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const callTutor = useServerFn(askTutor);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const out: Attachment[] = [];
    for (const f of Array.from(files).slice(0, 5)) {
      if (f.size > MAX_FILE_BYTES) {
        toast.error(`${f.name} is too large (max 8 MB).`);
        continue;
      }
      try {
        const data = await fileToBase64(f);
        const preview = f.type.startsWith("image/") ? `data:${f.type};base64,${data}` : undefined;
        out.push({ name: f.name, mimeType: f.type || "application/octet-stream", data, preview });
      } catch {
        toast.error(`Could not read ${f.name}`);
      }
    }
    if (out.length) setPending((p) => [...p, ...out].slice(0, 5));
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = async (text?: string, forceStep?: boolean) => {
    const content = (text ?? input).trim();
    if ((!content && pending.length === 0) || loading) return;
    const attachments = pending;
    const userMsg: Msg = { role: "user", content: content || "(See attached file)", attachments };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPending([]);
    setLoading(true);

    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase.from("chatbot_history").insert({
        user_id: u.user.id, role: "user", content: userMsg.content,
      });
    }

    try {
      const payloadMessages = next.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments?.map((a) => ({ mimeType: a.mimeType, data: a.data })),
      }));
      const res = await callTutor({
        data: {
          messages: payloadMessages,
          mode: (forceStep ?? stepMode) ? "stepByStep" : "default",
        },
      });
      if (res.error) {
        toast.error(res.error);
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${res.error}` }]);
      } else {
        const reply = res.reply;
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
        if (u.user) {
          await supabase.from("chatbot_history").insert({
            user_id: u.user.id, role: "assistant", content: reply,
          });
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-4xl flex-col">
      <PageHeader title={t("chat.title")} subtitle={t("chat.subtitle")} />

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
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {m.attachments.map((a, idx) =>
                      a.preview ? (
                        <img key={idx} src={a.preview} alt={a.name}
                          className="h-24 w-24 rounded-lg object-cover border border-white/20" />
                      ) : (
                        <div key={idx} className="flex items-center gap-2 rounded-lg bg-black/20 px-2 py-1 text-xs">
                          <FileText className="size-3.5" /> {a.name}
                        </div>
                      )
                    )}
                  </div>
                )}
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> {t("chat.thinking")}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTION_KEYS.map((k) => {
          const label = t(k);
          return (
            <button key={k} onClick={() => send(label + ": " + (input || "explain photosynthesis"))}
              className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs hover:bg-white/10">
              <Sparkles className="size-3" /> {label}
            </button>
          );
        })}
        <button
          onClick={() => {
            setStepMode((s) => !s);
            toast.success(!stepMode ? "Step-by-step mode ON" : "Step-by-step mode OFF");
          }}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
            stepMode
              ? "bg-gradient-primary text-primary-foreground glow"
              : "glass hover:bg-white/10"
          }`}
          title="Make the tutor explain things one step at a time"
        >
          <ListOrdered className="size-3" /> Step by step
        </button>
      </div>

      {pending.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {pending.map((a, i) => (
            <div key={i} className="glass relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
              {a.preview ? (
                <img src={a.preview} alt={a.name} className="size-8 rounded object-cover" />
              ) : (
                <FileText className="size-4" />
              )}
              <span className="max-w-[160px] truncate">{a.name}</span>
              <button
                onClick={() => setPending((p) => p.filter((_, j) => j !== i))}
                className="grid size-5 place-items-center rounded-full hover:bg-white/10"
                aria-label="Remove attachment"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-3 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onPickFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="glass grid size-12 place-items-center rounded-full hover:bg-white/10"
          title="Attach image or PDF"
          aria-label="Attach file"
        >
          <Paperclip className="size-4" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={pending.length ? "Add a question about your file…" : t("chat.placeholder")}
          className="glass flex-1 rounded-full px-5 py-3 text-sm outline-none"
        />
        <button type="submit" disabled={loading}
          className="grid size-12 place-items-center rounded-full bg-gradient-primary text-primary-foreground glow disabled:opacity-50">
          <Send className="size-4" />
        </button>
      </form>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        <ImageIcon className="inline size-3 -mt-0.5" /> Upload images or PDFs (up to 5 files, 8 MB each)
      </p>
    </div>
  );
}
