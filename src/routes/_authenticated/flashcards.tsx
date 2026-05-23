import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/GlassCard";
import { useEffect, useState } from "react";
import { Plus, Sparkles, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useT } from "@/i18n/LanguageContext";
import { generateFlashcards } from "@/lib/flashcards.functions";

export const Route = createFileRoute("/_authenticated/flashcards")({
  component: Flashcards,
});

type Card = { id: string; front: string; back: string };

// Vibrant hue palette for card glows (oklch hue values)
const HUES = [290, 200, 330, 150, 30, 260, 100, 350];

function Flashcards() {
  const t = useT();
  const [cards, setCards] = useState<Card[]>([]);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const genFn = useServerFn(generateFlashcards);

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
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoading(false); return; }
      const result = await genFn({ data: { notes, count: 8 } });
      if (result.error) {
        toast.error(result.error);
      } else if (result.cards.length === 0) {
        toast.error("No cards generated. Try richer notes.");
      } else {
        const rows = result.cards.map((c) => ({
          user_id: u.user!.id,
          deck_name: "AI deck",
          front: c.front,
          back: c.back,
        }));
        await supabase.from("flashcards").insert(rows);
        setNotes("");
        toast.success(`${t("fc.created")} ${rows.length} ${t("fc.cards")}`);
        load();
      }
    } catch (e) {
      console.error(e);
      toast.error("Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    if (cards.length === 0) return;
    if (!window.confirm("Delete all flashcards? This cannot be undone.")) return;
    setClearing(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase.from("flashcards").delete().eq("user_id", u.user.id);
      if (error) throw error;
      setCards([]);
      setFlipped({});
      toast.success("All flashcards cleared");
    } catch (e) {
      console.error(e);
      toast.error("Could not clear cards");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Flashcard Studio" subtitle="Generate. Flip. Remember." />

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h3 className="mb-3 text-sm font-medium">Generate from notes (AI)</h3>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5}
            placeholder="Paste lecture notes, a chapter, or a topic summary…"
            className="glass w-full resize-none rounded-2xl p-3 text-sm outline-none" />
          <button onClick={generate} disabled={loading}
            className="mt-3 flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground glow disabled:opacity-50">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate with AI
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

      <div className="mb-3 mt-8 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("fc.deck")} ({cards.length})
        </h2>
        {cards.length > 0 && (
          <button
            onClick={clearAll}
            disabled={clearing}
            className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.45)] transition hover:bg-red-500 hover:shadow-[0_0_28px_rgba(239,68,68,0.7)] disabled:opacity-50"
          >
            {clearing ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Clear all
          </button>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => {
          const hue = HUES[i % HUES.length];
          const glow = `0 0 24px oklch(0.72 0.22 ${hue} / 0.55), 0 0 60px oklch(0.72 0.22 ${hue} / 0.25)`;
          const border = `1px solid oklch(0.85 0.18 ${hue} / 0.45)`;
          const tint = `linear-gradient(135deg, oklch(0.72 0.2 ${hue} / 0.18), oklch(0.72 0.2 ${(hue + 60) % 360} / 0.10))`;
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setFlipped((f) => ({ ...f, [c.id]: !f[c.id] }))}
              className="relative h-48 w-full"
              style={{ perspective: 1000 }}
            >
              <motion.div
                animate={{ rotateY: flipped[c.id] ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="glass absolute inset-0 grid place-items-center rounded-3xl p-4 text-center text-sm font-medium"
                  style={{
                    backfaceVisibility: "hidden",
                    backgroundImage: tint,
                    border,
                    boxShadow: glow,
                  }}
                >
                  {c.front}
                </div>
                <div
                  className="glass absolute inset-0 grid place-items-center rounded-3xl p-4 text-center text-sm"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    backgroundImage: tint,
                    border,
                    boxShadow: glow,
                  }}
                >
                  {c.back}
                </div>
              </motion.div>
            </motion.button>
          );
        })}
        {cards.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground">{t("fc.empty")}</p>
        )}
      </div>
    </div>
  );
}
