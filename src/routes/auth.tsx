import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AIOrb } from "@/components/AIOrb";
import { Particles } from "@/components/Particles";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useT } from "@/i18n/LanguageContext";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const t = useT();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success(t("auth.verifyInbox"));
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/auth",
        });
        if (error) throw error;
        toast.success(t("auth.resetSent"));
        setMode("signin");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(t("auth.googleFailed"));
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <Particles count={20} />
      <div className="fixed right-4 top-4 z-50">
        <LanguageSelector align="right" />
      </div>
      {/* Floating orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 size-[28rem] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.6 0.28 290 / 0.6), transparent 70%)" }} />
      <div className="pointer-events-none absolute -bottom-40 -right-32 size-[32rem] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.7 0.24 200 / 0.5), transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong relative z-10 w-full max-w-md rounded-3xl p-8"
      >
        <div className="flex flex-col items-center">
          <AIOrb size={84} />
          <h1 className="mt-6 text-2xl font-semibold text-gradient">{t("auth.brand")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? t("auth.createAcc") : mode === "forgot" ? t("auth.resetPw") : t("auth.welcome")}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
          <label className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
            <Mail className="size-4 text-muted-foreground" />
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPh")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          {mode !== "forgot" && (
            <label className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
              <Lock className="size-4 text-muted-foreground" />
              <input
                type="password" required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
          )}

          <button
            type="submit" disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 glow disabled:opacity-50"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {mode === "signup" ? t("auth.create") : mode === "forgot" ? t("auth.sendReset") : t("auth.signin")}
          </button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>{t("auth.or")}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <button
              onClick={onGoogle} disabled={loading}
              className="glass flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm transition hover:bg-white/10 disabled:opacity-50"
            >
              <GoogleIcon /> {t("auth.continueGoogle")}
            </button>
          </>
        )}

        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>
              <button onClick={() => setMode("forgot")} className="hover:text-foreground">{t("auth.forgot")}</button>
              <button onClick={() => setMode("signup")} className="hover:text-foreground">{t("auth.createGo")}</button>
            </>
          ) : (
            <button onClick={() => setMode("signin")} className="hover:text-foreground">{t("auth.backSignin")}</button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <path fill="#EA4335" d="M12 11v3.2h4.5c-.2 1.2-1.4 3.4-4.5 3.4-2.7 0-4.9-2.2-4.9-5s2.2-5 4.9-5c1.5 0 2.6.6 3.2 1.2l2.2-2.1C15.9 5.4 14.1 4.6 12 4.6 7.9 4.6 4.6 7.9 4.6 12s3.3 7.4 7.4 7.4c4.3 0 7.1-3 7.1-7.2 0-.5 0-.8-.1-1.2H12z" />
    </svg>
  );
}
