import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const REACTIONS = ["✨", "💡", "⭐", "🚀", "💫", "🎯", "❤️"];

export function AIRobot() {
  const [hovered, setHovered] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [expression, setExpression] = useState<"happy" | "wink" | "surprised">("happy");

  // Random reactions every 5-10s
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      const delay = 5000 + Math.random() * 5000;
      timer = setTimeout(() => {
        setReaction(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
        setExpression(Math.random() > 0.5 ? "wink" : "surprised");
        setTimeout(() => setReaction(null), 1600);
        setTimeout(() => setExpression("happy"), 900);
        loop();
      }, delay);
    };
    loop();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative mx-auto mt-4 grid h-44 w-full place-items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Ambient glow */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.72 0.25 290 / 0.35), transparent 60%)",
          filter: "blur(20px)",
        }}
        animate={{ opacity: hovered ? 0.9 : 0.55, scale: hovered ? 1.1 : 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Floating particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute size-1 rounded-full"
          style={{
            background: i % 2 ? "oklch(0.78 0.18 200)" : "oklch(0.72 0.2 280)",
            boxShadow: "0 0 8px currentColor",
            left: `${15 + i * 12}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [0, -14, 0],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 3 + i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Robot body */}
      <motion.div
        className="relative"
        animate={{
          y: hovered ? [-4, -10, -4] : [0, -6, 0],
          rotate: hovered ? [0, 2, -2, 0] : [0, 1.5, -1.5, 0],
        }}
        transition={{
          duration: hovered ? 2 : 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{ scale: 1.08 }}
      >
        {/* Head */}
        <motion.div
          className="relative grid h-20 w-20 place-items-center rounded-[28%]"
          style={{
            background:
              "linear-gradient(145deg, oklch(0.85 0.12 250), oklch(0.55 0.22 290))",
            boxShadow:
              "0 0 30px oklch(0.72 0.25 290 / 0.6), inset 0 -6px 12px oklch(0.3 0.1 270 / 0.5), inset 0 6px 10px oklch(1 0 0 / 0.4)",
            border: "1px solid oklch(1 0 0 / 0.25)",
          }}
          animate={{ rotate: hovered ? [0, -6, 6, 0] : [0, -3, 3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Antenna */}
          <div className="absolute -top-4 left-1/2 h-4 w-[2px] -translate-x-1/2 bg-gradient-to-t from-white/40 to-transparent">
            <motion.span
              className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full"
              style={{
                background: "oklch(0.78 0.22 200)",
                boxShadow: "0 0 12px oklch(0.78 0.22 200)",
              }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          </div>

          {/* Visor / face screen */}
          <div
            className="relative flex h-11 w-14 items-center justify-center gap-2 rounded-xl"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.18 0.05 270), oklch(0.1 0.04 270))",
              boxShadow:
                "inset 0 0 12px oklch(0.78 0.22 200 / 0.4), 0 0 8px oklch(0 0 0 / 0.6)",
              border: "1px solid oklch(1 0 0 / 0.15)",
            }}
          >
            {/* Eyes */}
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  background: "oklch(0.85 0.2 200)",
                  boxShadow: `0 0 ${hovered ? 14 : 8}px oklch(0.78 0.22 200)`,
                }}
                animate={
                  expression === "wink" && i === 1
                    ? { scaleY: [1, 0.1, 1], height: 10, width: 10 }
                    : expression === "surprised"
                      ? { scale: [1, 1.3, 1], height: 12, width: 12 }
                      : { scaleY: [1, 1, 0.1, 1, 1], height: 10, width: 10 }
                }
                transition={
                  expression === "happy"
                    ? { duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }
                    : { duration: 0.4 }
                }
              />
            ))}
          </div>

          {/* Cheek glow */}
          <span className="absolute bottom-3 left-2 size-1.5 rounded-full bg-pink-400/60 blur-[1px]" />
          <span className="absolute bottom-3 right-2 size-1.5 rounded-full bg-pink-400/60 blur-[1px]" />
        </motion.div>

        {/* Body */}
        <div
          className="relative mx-auto mt-1 h-10 w-16 rounded-2xl"
          style={{
            background:
              "linear-gradient(145deg, oklch(0.75 0.14 250), oklch(0.45 0.2 290))",
            boxShadow:
              "0 8px 24px oklch(0.5 0.2 290 / 0.4), inset 0 -4px 8px oklch(0.25 0.1 270 / 0.5), inset 0 4px 6px oklch(1 0 0 / 0.3)",
            border: "1px solid oklch(1 0 0 / 0.2)",
          }}
        >
          {/* Chest core */}
          <motion.div
            className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "oklch(0.78 0.22 200)",
              boxShadow: "0 0 14px oklch(0.78 0.22 200)",
            }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Waving arm */}
        <motion.div
          className="absolute -right-3 top-20 h-2.5 w-6 origin-left rounded-full"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.7 0.16 270), oklch(0.55 0.22 290))",
            boxShadow: "0 0 8px oklch(0.6 0.2 290 / 0.5)",
          }}
          animate={{ rotate: hovered ? [0, -45, -10, -45, 0] : [0, -25, 0, -15, 0] }}
          transition={{
            duration: hovered ? 1.2 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span
            className="absolute -right-1 -top-1 size-3 rounded-full"
            style={{
              background: "oklch(0.85 0.12 250)",
              boxShadow: "0 0 6px oklch(0.78 0.22 200)",
            }}
          />
        </motion.div>

        {/* Static left arm */}
        <div
          className="absolute -left-2 top-20 h-2.5 w-5 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.55 0.22 290), oklch(0.7 0.16 270))",
          }}
        />
      </motion.div>

      {/* Reaction emoji popup */}
      <AnimatePresence>
        {reaction && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 top-2 -translate-x-1/2 text-2xl"
            style={{ filter: "drop-shadow(0 0 8px oklch(0.78 0.22 200))" }}
          >
            {reaction}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover sparkles */}
      <AnimatePresence>
        {hovered &&
          Array.from({ length: 4 }).map((_, i) => (
            <motion.span
              key={`spark-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: -30 - i * 8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
              className="absolute text-sm"
              style={{
                left: `${30 + i * 15}%`,
                top: "50%",
                filter: "drop-shadow(0 0 6px oklch(0.78 0.22 200))",
              }}
            >
              ✨
            </motion.span>
          ))}
      </AnimatePresence>
    </div>
  );
}
