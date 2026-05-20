import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/GlassCard";
import { Flame, Clock, Trophy, Sparkles, TrendingUp, Quote } from "lucide-react";
import { AIRobot } from "@/components/AIRobot";
import { TodoList } from "@/components/TodoList";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { useT } from "@/i18n/LanguageContext";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Stat = { day: string; minutes_studied: number; quizzes_completed: number; xp: number; streak: number };

function Dashboard() {
  const t = useT();
  const [stats, setStats] = useState<Stat[]>([]);
  const [name, setName] = useState("there");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as Record<string, string> | undefined;
      setName(meta?.display_name || data.user?.email?.split("@")[0] || "there");
    });
    supabase
      .from("productivity_stats")
      .select("day, minutes_studied, quizzes_completed, xp, streak")
      .order("day", { ascending: true })
      .limit(7)
      .then(({ data }) => setStats((data ?? []) as Stat[]));
  }, []);

  const totals = stats.reduce(
    (a, s) => ({
      minutes: a.minutes + s.minutes_studied,
      quizzes: a.quizzes + s.quizzes_completed,
      xp: a.xp + s.xp,
    }),
    { minutes: 0, quizzes: 0, xp: 0 },
  );
  const streak = stats.at(-1)?.streak ?? 0;

  const chartData = stats.length
    ? stats.map((s) => ({ day: s.day.slice(5), minutes: s.minutes_studied }))
    : Array.from({ length: 7 }).map((_, i) => ({
        day: `D${i + 1}`,
        minutes: Math.round(40 + Math.random() * 80),
      }));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`${t("dash.welcome")}, ${name}`}
        subtitle={t("dash.subtitle")}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard icon={<Flame className="size-5" />} label={t("dash.streak")} value={`${streak} ${t("dash.days")}`} accent="oklch(0.7 0.24 30)" delay={0} />
        <KpiCard icon={<Clock className="size-5" />} label={t("dash.hours")} value={`${(totals.minutes / 60).toFixed(1)}h`} accent="oklch(0.72 0.2 280)" delay={0.05} />
        <KpiCard icon={<Trophy className="size-5" />} label={t("dash.quizzes")} value={totals.quizzes.toString()} accent="oklch(0.78 0.18 200)" delay={0.1} />
        <KpiCard icon={<Sparkles className="size-5" />} label={t("dash.xp")} value={totals.xp.toLocaleString()} accent="oklch(0.7 0.22 320)" delay={0.15} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2" delay={0.2}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="size-4 text-accent" />
            <h3 className="text-sm font-medium">{t("dash.weekly")}</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.2 280)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="oklch(0.72 0.2 280)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="oklch(0.6 0.04 260)" fontSize={11} />
                <YAxis stroke="oklch(0.6 0.04 260)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.04 270 / 0.85)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                    backdropFilter: "blur(20px)",
                  }}
                />
                <Area type="monotone" dataKey="minutes" stroke="oklch(0.78 0.22 280)" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard delay={0.25}>
          <div className="mb-3 flex items-center gap-2">
            <Quote className="size-4 text-accent" />
            <h3 className="text-sm font-medium">{t("dash.motivation")}</h3>
          </div>
          <p className="text-lg leading-snug font-medium text-gradient">
            "The expert in anything was once a beginner."
          </p>
          <p className="mt-3 text-xs text-muted-foreground">— Helen Hayes</p>
          <AIRobot />
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <GlassCard delay={0.3}>
          <h3 className="mb-3 text-sm font-medium">{t("dash.aiRecs")}</h3>
          <ul className="space-y-3 text-sm">
            <Rec text={t("dash.rec1")} />
            <Rec text={t("dash.rec2")} />
            <Rec text={t("dash.rec3")} />
          </ul>
        </GlassCard>
        <GlassCard delay={0.35}>
          <TodoList />
        </GlassCard>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, accent, delay }: { icon: React.ReactNode; label: string; value: string; accent: string; delay: number }) {
  return (
    <GlassCard delay={delay}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="grid size-9 place-items-center rounded-xl" style={{ background: `${accent} / 0.18`, color: accent, boxShadow: `0 0 30px ${accent.replace(")", " / 0.4)")}` }}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </GlassCard>
  );
}

function Rec({ text }: { text: string }) {
  return (
    <li className="glass flex items-start gap-3 rounded-2xl p-3">
      <span className="mt-1 size-2 shrink-0 rounded-full bg-gradient-primary glow" />
      <span>{text}</span>
    </li>
  );
}
