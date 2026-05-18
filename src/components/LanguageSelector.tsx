import { Globe, Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { LANGUAGES, type LangCode } from "@/i18n/translations";

type Props = {
  variant?: "full" | "compact";
  align?: "left" | "right";
  className?: string;
};

export function LanguageSelector({ variant = "full", align = "right", className = "" }: Props) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glass flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition hover:bg-white/10"
        aria-label="Select language"
      >
        <Globe className="size-4 text-accent" />
        {variant === "full" && <span className="hidden sm:inline">{current.native}</span>}
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`glass-strong absolute z-50 mt-2 w-48 rounded-2xl p-1.5 ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {LANGUAGES.map((l) => {
              const active = l.code === lang;
              return (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code as LangCode);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-gradient-primary/20 text-foreground"
                      : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  }`}
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{l.native}</span>
                    <span className="text-[10px] text-muted-foreground">{l.label}</span>
                  </span>
                  {active && <Check className="size-3.5 text-accent" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
