import { useEffect, useState } from "react";
import { cn } from "./lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  speed: number;
  life: number;
}

interface ParticleEffectProps {
  x: number;
  y: number;
  onComplete: () => void;
}

export const ParticleEffect = ({ x, y, onComplete }: ParticleEffectProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Create particles
    const colors = [
      "hsl(142, 100%, 42%)", // Primary green
      "hsl(142, 100%, 60%)", // Light green
      "hsl(142, 80%, 30%)",  // Dark green
      "hsl(0, 0%, 100%)",    // White
    ];

    const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 0,
      y: 0,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: (Math.PI * 2 * i) / 12 + Math.random() * 0.5,
      speed: Math.random() * 100 + 60,
      life: 1,
    }));

    setParticles(newParticles);

    // Animation loop
    let frame: number;
    const startTime = Date.now();
    const duration = 600;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        onComplete();
        return;
      }

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: Math.cos(p.angle) * p.speed * progress,
          y: Math.sin(p.angle) * p.speed * progress,
          life: 1 - progress,
        }))
      );

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  return (
    <div
      className="fixed pointer-events-none z-[100]"
      style={{ left: x, top: y }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size * p.life,
            height: p.size * p.life,
            backgroundColor: p.color,
            transform: `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`,
            opacity: p.life,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
};
