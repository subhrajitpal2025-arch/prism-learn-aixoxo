import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AIOrb } from "./AIOrb";
import { Particles } from "./Particles";

const SEEN_KEY = "ats_intro_seen";

export function CinematicIntro({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SEEN_KEY)) {
      setShow(false);
      onDone();
      return;
    }
    const t = setTimeout(() => {
      sessionStorage.setItem(SEEN_KEY, "1");
      setShow(false);
      onDone();
    }, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(20px)" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          <Particles count={60} />
          <AIOrb size={140} />
          <motion.h1
            className="mt-12 text-4xl md:text-6xl font-semibold text-gradient tracking-tight"
            initial={{ opacity: 0, y: 20, letterSpacing: "0.4em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "-0.02em" }}
            transition={{ duration: 1.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            AI Teaching Studio
          </motion.h1>
          <motion.p
            className="mt-4 text-sm uppercase tracking-[0.4em] text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.6 }}
          >
            Learn. Evolve. Excel.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
