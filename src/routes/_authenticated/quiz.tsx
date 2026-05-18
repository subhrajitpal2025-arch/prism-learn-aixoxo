import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/GlassCard";
import { useState } from "react";
import { Trophy, Zap, Clock, Sparkles, Loader2, RotateCw, BookOpen, PieChart as PieIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateQuiz, type QuizQuestion } from "@/lib/quiz.functions";
import { useT } from "@/i18n/LanguageContext";

export const Route = createFileRoute("/_authenticated/quiz")({
  component: QuizArena,
});

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "History", "Geography", "English"];
const EXAMS = ["None", "JEE", "NEET", "SAT", "GRE", "GATE", "UPSC", "GCSE", "A-Levels"];
const DIFFICULTIES = ["easy", "medium", "hard", "mixed"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

type Stage = "setup" | "playing" | "done";

function QuizArena() {
  const gen = useServerFn(generateQuiz);
  const t = useT();

  const [stage, setStage] = useState<Stage>("setup");
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState("");
  const [exam, setExam] = useState("None");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const start = async () => {
    if (!topic.trim()) {
      toast.error(t("quiz.enterTopic"));
      return;
    }
    setLoading(true);
    try {
      const result = await gen({
        data: { subject, topic: topic.trim(), exam: exam === "None" ? "" : exam, difficulty, count },
      });
      if (result.error || !result.questions.length) {
        toast.error(result.error ?? t("quiz.couldntGen"));
        return;
      }
      setQuestions(result.questions);
      setIdx(0);
      setScore(0);
      setPicked(null);
      setStage("playing");
    } finally {
      setLoading(false);
    }
  };

  const q = questions[idx];

  const choose = (i: number) => {
    if (picked !== null || !q) return;
    setPicked(i);
    const earned = i === q.a ? 100 : 0;
    if (earned) setScore((s) => s + earned);
    setTimeout(async () => {
      if (idx + 1 >= questions.length) {
        const finalScore = score + earned;
        setStage("done");
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          await supabase.from("quizzes").insert({
            user_id: data.user.id,
            title: `${subject} · ${topic}`,
            topic,
            score: finalScore,
            xp_earned: finalScore,
            completed_at: new Date().toISOString(),
          });
          toast.success(`+${finalScore} XP`);
        }
      } else {
        setIdx(idx + 1);
        setPicked(null);
      }
    }, 800);
  };

  const reset = () => {
    setStage("setup");
    setQuestions([]);
    setIdx(0);
    setScore(0);
    setPicked(null);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t("quiz.title")} subtitle={t("quiz.subtitle")} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Setup card — always visible during setup */}
          {stage === "setup" && (
            <GlassCard>
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="size-4 text-accent" />
                <h3 className="text-sm font-medium">{t("quiz.configure")}</h3>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label={t("quiz.subject")}>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s} className="bg-background">{s}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Exam (optional)">
                  <select
                    value={exam}
                    onChange={(e) => setExam(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  >
                    {EXAMS.map((s) => (
                      <option key={s} value={s} className="bg-background">{s}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Topic" className="md:col-span-2">
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Newton's laws of motion, Trigonometric identities…"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </Field>

                <Field label="Difficulty">
                  <div className="flex flex-wrap gap-1.5">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`rounded-full px-3 py-1 text-xs capitalize transition ${
                          difficulty === d
                            ? "bg-gradient-primary text-primary-foreground glow"
                            : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label={`Questions: ${count}`}>
                  <input
                    type="range"
                    min={3}
                    max={20}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </Field>
              </div>

              <button
                onClick={start}
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 glow disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {loading ? "Generating quiz…" : "Generate quiz with AI"}
              </button>
            </GlassCard>
          )}

          {stage === "playing" && q && (
            <GlassCard>
              <div className="mb-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Q{idx + 1} / {questions.length}</span>
                <span className="flex items-center gap-1 text-accent"><Zap className="size-3" /> {score} XP</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Clock className="size-3" /> {difficulty}</span>
              </div>

              {/* Progress bar */}
              <div className="mb-5 h-1 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full bg-gradient-primary"
                  initial={false}
                  animate={{ width: `${((idx) / questions.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl md:text-2xl font-semibold">{q.q}</h2>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {q.opts.map((o, i) => {
                      const isPicked = picked === i;
                      const isCorrect = picked !== null && i === q.a;
                      const isWrong = isPicked && i !== q.a;
                      return (
                        <button
                          key={i}
                          onClick={() => choose(i)}
                          className={`glass rounded-2xl px-4 py-4 text-left text-sm transition-colors hover:bg-white/10 ${
                            isCorrect ? "ring-2 ring-emerald-400 glow" : isWrong ? "ring-2 ring-red-400" : ""
                          }`}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                  {picked !== null && q.explanation && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-2xl bg-white/5 p-3 text-xs text-muted-foreground"
                    >
                      <span className="text-foreground font-medium">Why: </span>{q.explanation}
                    </motion.p>
                  )}
                </motion.div>
              </AnimatePresence>
            </GlassCard>
          )}

          {stage === "done" && (
            <GlassCard>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-10 text-center">
                <Trophy className="mx-auto size-16 text-accent glow" />
                <h2 className="mt-4 text-3xl font-semibold text-gradient">+{score} XP</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {subject} · {topic} {exam !== "None" && `· ${exam}`}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={reset}
                    className="flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow"
                  >
                    <RotateCw className="size-4" /> New quiz
                  </button>
                </div>
              </motion.div>
            </GlassCard>
          )}
        </div>

        <GlassCard delay={0.1}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <PieIcon className="size-4 text-accent" /> Performance Analysis
          </h3>

          {stage === "done" && questions.length > 0 ? (
            (() => {
              const correct = Math.round(score / 100);
              const wrong = questions.length - correct;
              const accuracy = Math.round((correct / questions.length) * 100);
              const data = [
                { name: "Correct", value: correct, color: "hsl(160 84% 55%)" },
                { name: "Incorrect", value: wrong, color: "hsl(0 84% 65%)" },
              ];
              return (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="relative h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data}
                          dataKey="value"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {data.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "rgba(20,20,30,0.85)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            backdropFilter: "blur(12px)",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-semibold text-gradient">{accuracy}%</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Accuracy</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="glass rounded-2xl p-3">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-400" />
                        <span className="text-muted-foreground">Correct</span>
                      </div>
                      <div className="mt-1 text-lg font-semibold">{correct}</div>
                    </div>
                    <div className="glass rounded-2xl p-3">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-red-400" />
                        <span className="text-muted-foreground">Incorrect</span>
                      </div>
                      <div className="mt-1 text-lg font-semibold">{wrong}</div>
                    </div>
                    <div className="glass col-span-2 rounded-2xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">XP earned</span>
                        <span className="flex items-center gap-1 font-semibold text-accent">
                          <Zap className="size-3" /> {score}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()
          ) : (
            <div className="flex h-52 flex-col items-center justify-center text-center">
              <div className="grid size-16 place-items-center rounded-full bg-white/5">
                <PieIcon className="size-7 text-muted-foreground" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {stage === "playing" ? "Finish the quiz to unlock your analysis." : "Your performance breakdown appears here after each quiz."}
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`glass flex flex-col gap-1.5 rounded-2xl px-4 py-3 ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
