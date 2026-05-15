import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const v: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(12px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function GlassCard({ children, className = "", delay = 0 }: Props) {
  return (
    <motion.div
      variants={v}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`glass rounded-3xl p-6 transition-all hover:bg-white/[0.08] ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-6"
    >
      <h1 className="text-3xl md:text-4xl font-semibold text-gradient">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}
