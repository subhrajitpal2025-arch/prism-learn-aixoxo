import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/GlassCard";
import { useState } from "react";
import { Trophy, Zap, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/quiz")({
  component: QuizArena,
});

const SAMPLE = [
  { q: "Speed of light (m/s)?", opts: ["3×10⁸", "3×10⁶", "3×10¹⁰", "1.5×10⁸"], a: 0 },
  { q: "Derivative of sin(x)?", opts: ["cos(x)", "-cos(x)", "tan(x)", "-sin(x)"], a: 0 },
  { q: "Capital of Australia?", opts: ["Sydney", "Canberra", "Melbourne", "Perth"], a: 1 },
  { q: "H₂O is?", opts: ["Salt", "Acid", "Water", "Base"], a: 2 },
  { q: "π ≈ ?", opts: ["3.14", "2.72", "1.61", "9.81"], a: 0 },
];

const LEADERBOARD = [
  { name: "NovaAI", xp: 12480 }, { name: "QuasarQ", xp: 11200 }, { name: "OrbitX", xp: 9320 },
  { name: "You", xp: 8870 }, { name: "Pixel", xp: 7700 },
];

function QuizArena() {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const q = SAMPLE[idx];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.a) setScore((s) => s + 100);
    setTimeout(async () => {
      if (idx + 1 >= SAMPLE.length) {
        setDone(true);
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          await supabase.from("quizzes").insert({
            user_id: data.user.id, title: "Daily Arena",
            score, xp_earned: score, completed_at: new Date().toISOString(),
          });
          toast.success(`+${score} XP`);
        }
      } else {
        setIdx(idx + 1);
        setPicked(null);
      }
    }, 800);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Quiz Arena" subtitle="Battle the AI. Climb the ranks." />

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Q{idx + 1} / {SAMPLE.length}</span>
            <span className="flex items-center gap-1 text-accent"><Zap className="size-3" /> {score} XP</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Clock className="size-3" /> 0:30</span>
          </div>

          {!done ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-2xl font-semibold">{q.q}</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {q.opts.map((o, i) => {
                    const isPicked = picked === i;
                    const isCorrect = picked !== null && i === q.a;
                    const isWrong = isPicked && i !== q.a;
                    return (
                      <button key={i} onClick={() => choose(i)}
                        className={`glass rounded-2xl px-4 py-4 text-left text-sm transition-all hover:bg-white/10 ${
                          isCorrect ? "ring-2 ring-emerald-400 glow" : isWrong ? "ring-2 ring-red-400" : ""
                        }`}>
                        {o}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-12 text-center">
              <Trophy className="mx-auto size-16 text-accent glow" />
              <h2 className="mt-4 text-3xl font-semibold text-gradient">+{score} XP</h2>
              <p className="mt-2 text-sm text-muted-foreground">Outstanding round.</p>
              <button onClick={() => { setIdx(0); setScore(0); setPicked(null); setDone(false); }}
                className="mt-6 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow">
                Play again
              </button>
            </motion.div>
          )}
        </GlassCard>

        <GlassCard delay={0.1}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Trophy className="size-4 text-accent" /> Leaderboard
          </h3>
          <ol className="space-y-2 text-sm">
            {LEADERBOARD.map((p, i) => (
              <li key={p.name} className={`glass flex items-center justify-between rounded-2xl p-3 ${p.name === "You" ? "ring-1 ring-primary/50" : ""}`}>
                <span className="flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-white/10 text-xs">{i + 1}</span>
                  {p.name}
                </span>
                <span className="text-xs text-muted-foreground">{p.xp.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        </GlassCard>
      </div>
    </div>
  );
}
