import { motion } from "framer-motion";

export function AIOrb({ size = 120 }: { size?: number }) {
  return (
    <motion.div
      className="relative animate-orb"
      style={{ width: size, height: size }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, oklch(0.95 0.08 280) 0%, oklch(0.6 0.28 290) 40%, oklch(0.3 0.2 260) 80%)",
          boxShadow:
            "0 0 60px oklch(0.7 0.28 290 / 0.7), inset -10px -20px 40px oklch(0.2 0.1 260 / 0.6), inset 10px 15px 30px oklch(1 0 0 / 0.3)",
        }}
      />
      <div
        className="absolute -inset-6 rounded-full opacity-60 blur-2xl"
        style={{ background: "var(--gradient-primary)" }}
      />
    </motion.div>
  );
}
