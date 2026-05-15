import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/GlassCard";
import { useState } from "react";
import { Calendar, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/roadmap")({
  component: Roadmap,
});

type Milestone = { week: number; title: string; tasks: string[] };

function Roadmap() {
  const [exam, setExam] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState(2);
  const [plan, setPlan] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!exam) return toast.error("Enter an exam name");
    setLoading(true);
    // Lightweight client-side generator (placeholder for AI gateway).
    await new Promise((r) => setTimeout(r, 700));
    const weeks = 6;
    const out: Milestone[] = Array.from({ length: weeks }).map((_, i) => ({
      week: i + 1,
      title:
        i === 0 ? "Foundation" :
        i < weeks - 2 ? `Deep dive ${i}` :
        i === weeks - 2 ? "Mock tests" : "Final revision",
      tasks: [
        `${hours}h/day focused study`,
        i === 0 ? "Build syllabus map" : "Practice 30 problems",
        "Review notes & flashcards",
      ],
    }));
    setPlan(out);
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
      <PageHeader title="Study Roadmap" subtitle="AI-crafted weekly plan, tuned to your timeline." />

      <GlassCard>
        <div className="grid gap-3 md:grid-cols-4">
          <input value={exam} onChange={(e) => setExam(e.target.value)} placeholder="Exam name (e.g. SAT)"
            className="glass rounded-2xl px-4 py-3 text-sm outline-none md:col-span-2" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="glass rounded-2xl px-4 py-3 text-sm outline-none" />
          <input type="number" min={1} max={12} value={hours} onChange={(e) => setHours(+e.target.value)}
            placeholder="Hours/day" className="glass rounded-2xl px-4 py-3 text-sm outline-none" />
        </div>
        <button onClick={generate} disabled={loading}
          className="mt-4 flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-medium text-primary-foreground glow disabled:opacity-50">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate roadmap
        </button>
      </GlassCard>

      {plan.length > 0 && (
        <div className="mt-8 relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-transparent" />
          <div className="space-y-4">
            {plan.map((m, i) => (
              <GlassCard key={m.week} delay={i * 0.06} className="ml-12 relative">
                <span className="absolute -left-12 top-6 grid size-9 place-items-center rounded-full bg-gradient-primary glow text-xs font-semibold text-primary-foreground">
                  W{m.week}
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-accent" />
                  <h3 className="text-base font-medium">{m.title}</h3>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {m.tasks.map((t, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 rounded-full bg-gradient-primary" /> {t}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
