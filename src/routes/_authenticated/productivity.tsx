import { createFileRoute } from "@tanstack/react-router";
import { GlassCard, PageHeader } from "@/components/GlassCard";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/productivity")({
  component: Productivity,
});

function Productivity() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState("General");
  const total = useRef(25 * 60);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          logSession();
          return total.current;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const logSession = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("study_sessions").insert({
      user_id: data.user.id,
      subject,
      duration_minutes: Math.round(total.current / 60),
    });
    toast.success("Session logged ✦");
  };

  const pct = ((total.current - seconds) / total.current) * 100;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Productivity" subtitle="Focus deep. Track every minute." />

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <div className="flex flex-col items-center py-6">
            <CircularTimer pct={pct} label={`${mm}:${ss}`} />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="glass mt-6 rounded-full px-4 py-2 text-center text-sm outline-none"
              placeholder="Subject"
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setRunning((r) => !r)}
                className="flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-medium text-primary-foreground glow"
              >
                {running ? <Pause className="size-4" /> : <Play className="size-4" />}
                {running ? "Pause" : "Start"}
              </button>
              <button
                onClick={() => { setRunning(false); setSeconds(total.current); }}
                className="glass flex items-center gap-2 rounded-full px-5 py-3 text-sm"
              >
                <RotateCcw className="size-4" /> Reset
              </button>
            </div>
            <div className="mt-6 flex gap-2">
              {[15, 25, 45, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => { total.current = m * 60; setSeconds(m * 60); setRunning(false); }}
                  className="glass rounded-full px-3 py-1.5 text-xs"
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        <div className="flex flex-col gap-4">
          <GlassCard delay={0.1}>
            <div className="mb-2 flex items-center gap-2 text-sm">
              <Target className="size-4 text-accent" /> Daily goal
            </div>
            <div className="mb-2 flex items-end justify-between">
              <span className="text-2xl font-semibold">2h 10m</span>
              <span className="text-xs text-muted-foreground">/ 4h</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-primary glow" style={{ width: "55%" }} />
            </div>
          </GlassCard>

          <GlassCard delay={0.15}>
            <h3 className="mb-3 text-sm font-medium">Subject progress</h3>
            <div className="space-y-3">
              {[
                { s: "Math", v: 78 },
                { s: "Physics", v: 62 },
                { s: "Chemistry", v: 41 },
              ].map((x) => (
                <div key={x.s}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{x.s}</span><span className="text-muted-foreground">{x.v}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${x.v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function CircularTimer({ pct, label }: { pct: number; label: string }) {
  const r = 110;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative grid place-items-center">
      <svg width="280" height="280" className="-rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.22 280)" />
            <stop offset="100%" stopColor="oklch(0.78 0.18 200)" />
          </linearGradient>
        </defs>
        <circle cx="140" cy="140" r={r} stroke="oklch(1 0 0 / 0.08)" strokeWidth="10" fill="none" />
        <circle
          cx="140" cy="140" r={r}
          stroke="url(#ring)" strokeWidth="10" fill="none"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 12px oklch(0.72 0.25 290 / 0.6))", transition: "stroke-dashoffset 0.5s" }}
        />
      </svg>
      <div className="absolute text-5xl font-semibold tabular-nums text-gradient">{label}</div>
    </div>
  );
}
