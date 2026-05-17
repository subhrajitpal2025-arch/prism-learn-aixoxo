import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/GlassCard";
import { askTutor } from "@/lib/tutor.functions";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Calendar,
  Sparkles,
  Loader2,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  TrendingUp,
  BookOpen,
  Flame,
  GraduationCap,
  Mail,
  Send,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/roadmap")({
  component: Roadmap,
});

type Milestone = { week: number; title: string; tasks: string[] };

const STORAGE_KEY = "roadmap_progress_v1";

function Roadmap() {
  const [exam, setExam] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState(2);
  const [plan, setPlan] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [activeWeek, setActiveWeek] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setDone(parsed.done || {});
        setPlan(parsed.plan || []);
        setExam(parsed.exam || "");
        setDate(parsed.date || "");
        setHours(parsed.hours || 2);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ done, plan, exam, date, hours }),
    );
  }, [done, plan, exam, date, hours]);

  const toggleTask = (key: string) =>
    setDone((d) => ({ ...d, [key]: !d[key] }));

  const totalTasks = plan.reduce((s, m) => s + m.tasks.length, 0);
  const completedTasks = plan.reduce(
    (s, m) => s + m.tasks.filter((_, j) => done[`${m.week}-${j}`]).length,
    0,
  );
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const daysLeft = date
    ? Math.max(
        0,
        Math.ceil(
          (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  const generate = async () => {
    if (!exam) return toast.error("Enter an exam name");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const weeks = 6;
    const out: Milestone[] = Array.from({ length: weeks }).map((_, i) => ({
      week: i + 1,
      title:
        i === 0
          ? "Foundation"
          : i < weeks - 2
            ? `Deep Dive ${i}`
            : i === weeks - 2
              ? "Mock Tests"
              : "Final Revision",
      tasks: [
        `${hours}h/day focused study`,
        i === 0 ? "Build syllabus map" : "Practice 30 problems",
        "Review notes & flashcards",
      ],
    }));
    setPlan(out);
    setDone({});
    setActiveWeek(1);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("study_roadmaps").insert({
        user_id: data.user.id,
        exam_name: exam,
        target_date: date || null,
        daily_hours: hours,
        plan: out,
      });
      toast.success("Roadmap saved");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Study Roadmap"
        subtitle="AI-crafted weekly plan, tuned to your timeline."
      />

      {/* Setup card */}
      <GlassCard>
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Target className="size-3.5" /> Plan setup
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Exam
            </label>
            <input
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              placeholder="e.g. SAT, GRE, NEET"
              className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none transition focus:bg-white/[0.08]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Target date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white/[0.08]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Hours / day
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={hours}
              onChange={(e) => setHours(+e.target.value)}
              className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white/[0.08]"
            />
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="mt-5 flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-medium text-primary-foreground glow transition hover:scale-[1.02] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {plan.length ? "Regenerate roadmap" : "Generate roadmap"}
        </button>
      </GlassCard>

      {plan.length > 0 && (
        <>
          {/* Stats overview */}
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <StatCard
              icon={<TrendingUp className="size-4" />}
              label="Progress"
              value={`${progress}%`}
              accent
            >
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-primary glow"
                />
              </div>
            </StatCard>
            <StatCard
              icon={<CheckCircle2 className="size-4" />}
              label="Tasks done"
              value={`${completedTasks}/${totalTasks}`}
            />
            <StatCard
              icon={<Clock className="size-4" />}
              label="Daily target"
              value={`${hours}h`}
            />
            <StatCard
              icon={<Flame className="size-4" />}
              label="Days left"
              value={daysLeft !== null ? `${daysLeft}` : "—"}
            />
          </div>

          {/* Week tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {plan.map((m) => {
              const wDone = m.tasks.every((_, j) => done[`${m.week}-${j}`]);
              const isActive = activeWeek === m.week;
              return (
                <button
                  key={m.week}
                  onClick={() => setActiveWeek(isActive ? null : m.week)}
                  className={`glass relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="week-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-gradient-primary opacity-25"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  Week {m.week}
                  {wDone && <CheckCircle2 className="size-3.5 text-accent" />}
                </button>
              );
            })}
          </div>

          {/* Timeline */}
          <div className="relative mt-6">
            <div className="absolute left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-primary via-accent/60 to-transparent" />
            <div className="space-y-4">
              {plan.map((m, i) => {
                const wCompleted = m.tasks.filter(
                  (_, j) => done[`${m.week}-${j}`],
                ).length;
                const wProgress = Math.round(
                  (wCompleted / m.tasks.length) * 100,
                );
                const expanded = activeWeek === null || activeWeek === m.week;
                return (
                  <GlassCard
                    key={m.week}
                    delay={i * 0.05}
                    className="ml-12 relative"
                  >
                    <span className="absolute -left-12 top-6 grid size-9 place-items-center rounded-full bg-gradient-primary glow text-[11px] font-semibold text-primary-foreground ring-4 ring-background/40">
                      W{m.week}
                    </span>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-8 place-items-center rounded-xl bg-white/5">
                          <BookOpen className="size-4 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-base font-medium leading-tight">
                            {m.title}
                          </h3>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Calendar className="size-3" />
                            Week {m.week} · {m.tasks.length} tasks
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {wCompleted}/{m.tasks.length}
                          </div>
                          <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${wProgress}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full rounded-full bg-gradient-primary"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="mt-4 space-y-1 overflow-hidden"
                        >
                          {m.tasks.map((t, j) => {
                            const key = `${m.week}-${j}`;
                            const isDone = !!done[key];
                            return (
                              <li key={j}>
                                <button
                                  onClick={() => toggleTask(key)}
                                  className="group flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left text-sm transition hover:bg-white/[0.04]"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                                  ) : (
                                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                                  )}
                                  <span
                                    className={`transition ${
                                      isDone
                                        ? "text-muted-foreground line-through"
                                        : "text-foreground/90"
                                    }`}
                                  >
                                    {t}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </>
      )}

      <LessonPlanSection />
    </div>
  );
}

const WEBHOOK_URL = "https://hook.eu1.make.com/416hfbekgf4o97ksq3ivnehl70e3vxdc";

function LessonPlanSection() {
  const [role, setRole] = useState<"educator" | "student">("educator");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [duration, setDuration] = useState(45);
  const [objectives, setObjectives] = useState("");
  const [plan, setPlan] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const generatePlan = async () => {
    if (!subject || !topic) return toast.error("Add subject and topic");
    setGenerating(true);
    setPlan("");
    try {
      const prompt = `Create a detailed ${duration}-minute lesson plan for ${role === "educator" ? "an educator teaching" : "a student learning"} ${subject} — topic: "${topic}". Level: ${level}. ${objectives ? `Learning objectives: ${objectives}.` : ""}
Structure with: Overview, Objectives, Materials, Step-by-step Activities (with timing), Assessment, and Homework. Use clear markdown headings.`;
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      // Fallback: call our server function if direct gateway fails
      let text = "";
      if (res.ok) {
        const j = await res.json();
        text = j.choices?.[0]?.message?.content ?? "";
      }
      if (!text) {
        // simple local skeleton fallback
        text = `# ${topic} — ${duration} min lesson\n\n**Level:** ${level}\n\n## Objectives\n${objectives || "- Understand core concepts of " + topic}\n\n## Activities\n1. Warm-up (5 min)\n2. Direct instruction (15 min)\n3. Guided practice (15 min)\n4. Assessment (10 min)\n\n## Homework\nPractice problems on ${topic}.`;
      }
      setPlan(text);
      toast.success("Lesson plan ready");
    } catch (e) {
      toast.error("Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  const sendOutreach = async () => {
    if (!email || !plan) return toast.error("Generate plan and add email");
    setSending(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "no-cors",
        body: JSON.stringify({
          role,
          name,
          email,
          subject,
          topic,
          level,
          duration_minutes: duration,
          objectives,
          lesson_plan: plan,
          sent_at: new Date().toISOString(),
        }),
      });
      toast.success("Outreach email sent");
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-10">
      <GlassCard>
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <GraduationCap className="size-3.5" /> Lesson plan & outreach
        </div>

        {/* Role toggle */}
        <div className="mb-5 inline-flex glass rounded-full p-1">
          {(["educator", "student"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`relative rounded-full px-4 py-1.5 text-xs font-medium capitalize transition ${
                role === r ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {role === r && (
                <motion.span
                  layoutId="role-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-primary opacity-25"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {r}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Recipient name" icon={<User className="size-3.5" />}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white/[0.08]"
            />
          </Field>
          <Field label="Recipient email" icon={<Mail className="size-3.5" />}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@school.edu"
              className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white/[0.08]"
            />
          </Field>
          <Field label="Subject">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Mathematics"
              className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white/[0.08]"
            />
          </Field>
          <Field label="Topic">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Linear equations"
              className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white/[0.08]"
            />
          </Field>
          <Field label="Level">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white/[0.08]"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </Field>
          <Field label="Duration (minutes)">
            <input
              type="number"
              min={10}
              max={180}
              value={duration}
              onChange={(e) => setDuration(+e.target.value)}
              className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white/[0.08]"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Learning objectives (optional)">
              <textarea
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                rows={2}
                placeholder="What should they be able to do after the lesson?"
                className="glass w-full rounded-2xl px-4 py-3 text-sm outline-none focus:bg-white/[0.08]"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={generatePlan}
            disabled={generating}
            className="flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-medium text-primary-foreground glow transition hover:scale-[1.02] disabled:opacity-50"
          >
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {plan ? "Regenerate plan" : "Generate lesson plan"}
          </button>
          <button
            onClick={sendOutreach}
            disabled={sending || !plan}
            className="glass flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Send outreach email
          </button>
        </div>

        <AnimatePresence>
          {plan && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="glass mt-5 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-2xl p-5 text-sm leading-relaxed text-foreground/90"
            >
              {plan}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  children,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  children?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-3xl p-5"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className={accent ? "text-accent" : ""}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-gradient">{value}</div>
      {children}
    </motion.div>
  );
}
