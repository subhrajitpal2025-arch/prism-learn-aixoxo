import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/GlassCard";
import { useEffect, useState } from "react";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useT } from "@/i18n/LanguageContext";

export const Route = createFileRoute("/_authenticated/flashcards")({
  component: Flashcards,
});

type Card = { id: string; front: string; back: string };

function Flashcards() {
  const t = useT();
  const [cards, setCards] = useState<Card[]>([]);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const load = async () => {
    const { data } = await supabase
      .from("flashcards").select("id, front, back")
      .order("created_at", { ascending: false }).limit(50);
    setCards((data ?? []) as Card[]);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!front || !back) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("flashcards").insert({
      user_id: u.user.id, front, back, deck_name: "My deck",
    });
    setFront(""); setBack("");
    load();
  };

  const generate = async () => {
    if (!notes.trim()) return toast.error(t("fc.pasteFirst"));
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const lines = notes.split(/[\n.]/).map((l) => l.trim()).filter((l) => l.length > 10).slice(0, 8);
    const rows = lines.map((l, i) => ({
      user_id: u.user!.id,
      deck_name: "Auto deck",
      front: `Concept ${i + 1}`,
      back: l,
    }));
    if (rows.length) await supabase.from("flashcards").insert(rows);
    setNotes("");
    setLoading(false);
    toast.success(`${t("fc.created")} ${rows.length} ${t("fc.cards")}`);
    load();
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Flashcard Studio" subtitle="Generate. Flip. Remember." />

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h3 className="mb-3 text-sm font-medium">Generate from notes</h3>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5}
            placeholder="Paste lecture notes…"
            className="glass w-full resize-none rounded-2xl p-3 text-sm outline-none" />
          <button onClick={generate} disabled={loading}
            className="mt-3 flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground glow disabled:opacity-50">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate
          </button>
        </GlassCard>

        <GlassCard delay={0.1}>
          <h3 className="mb-3 text-sm font-medium">Add a card</h3>
          <input value={front} onChange={(e) => setFront(e.target.value)} placeholder="Front"
            className="glass mb-2 w-full rounded-2xl px-3 py-2.5 text-sm outline-none" />
          <input value={back} onChange={(e) => setBack(e.target.value)} placeholder="Back"
            className="glass mb-3 w-full rounded-2xl px-3 py-2.5 text-sm outline-none" />
          <button onClick={add} className="flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 text-sm text-primary-foreground glow">
            <Plus className="size-4" /> Add card
          </button>
        </GlassCard>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-medium text-muted-foreground">{t("fc.deck")} ({cards.length})</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setFlipped((f) => ({ ...f, [c.id]: !f[c.id] }))}
            className="relative h-44 w-full"
            style={{ perspective: 1000 }}
          >
            <motion.div
              animate={{ rotateY: flipped[c.id] ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              className="relative h-full w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="glass absolute inset-0 grid place-items-center rounded-3xl p-4 text-center text-sm" style={{ backfaceVisibility: "hidden" }}>
                {c.front}
              </div>
              <div className="glass absolute inset-0 grid place-items-center rounded-3xl bg-gradient-primary/10 p-4 text-center text-sm" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                {c.back}
              </div>
            </motion.div>
          </motion.button>
        ))}
        {cards.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground">{t("fc.empty")}</p>
        )}
      </div>
    </div>
  );
}
