import { useMemo } from "react";

export function Particles({ count = 18 }: { count?: number }) {
  // Cap count aggressively — particles are decorative and expensive at scale.
  const safeCount = Math.min(count, 24);
  const particles = useMemo(
    () =>
      Array.from({ length: safeCount }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 8,
        duration: Math.random() * 10 + 10,
        opacity: Math.random() * 0.4 + 0.2,
      })),
    [safeCount],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  );
}
