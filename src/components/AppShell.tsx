import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Activity,
  Map,
  MessageSquare,
  Trophy,
  Layers,
  LogOut,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Particles } from "./Particles";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/productivity", label: "Productivity", icon: Activity },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/chat", label: "AI Tutor", icon: MessageSquare },
  { to: "/quiz", label: "Quiz Arena", icon: Trophy },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
];

export function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="relative min-h-screen w-full">
      <Particles count={14} />
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 p-4 md:block">
          <div className="glass flex h-full flex-col rounded-3xl p-5">
            <div className="mb-8 flex items-center gap-3 px-2">
              <div className="grid size-9 place-items-center rounded-xl bg-gradient-primary glow">
                <Sparkles className="size-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">AI Teaching</div>
                <div className="text-xs text-muted-foreground">Studio</div>
              </div>
            </div>
            <nav className="flex flex-1 flex-col gap-1">
              {nav.map((n) => {
                const active = path === n.to;
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all ${
                      active
                        ? "bg-white/10 text-foreground glow"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="active-pill"
                        className="absolute inset-0 -z-10 rounded-2xl"
                        style={{ background: "var(--gradient-primary)", opacity: 0.18 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="size-4" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={logout}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile top nav */}
        <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 md:hidden">
          <div className="glass flex gap-1 rounded-full px-2 py-2">
            {nav.map((n) => {
              const Icon = n.icon;
              const active = path === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`grid size-10 place-items-center rounded-full transition ${
                    active ? "bg-gradient-primary text-primary-foreground glow" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="min-w-0 flex-1 p-4 pb-24 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
