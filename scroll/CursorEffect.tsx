import { useEffect, useState } from "react";

interface CursorTrail {
  id: number;
  x: number;
  y: number;
  opacity: number;
}

interface CursorEffectProps {
  isDragging: boolean;
}

export const CursorEffect = ({ isDragging }: CursorEffectProps) => {
  const [trails, setTrails] = useState<CursorTrail[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      if (isDragging) {
        setTrails((prev) => [
          ...prev.slice(-8),
          {
            id: Date.now(),
            x: e.clientX,
            y: e.clientY,
            opacity: 1,
          },
        ]);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isDragging]);

  // Fade out trails
  useEffect(() => {
    if (!isDragging) {
      setTrails([]);
      return;
    }

    const interval = setInterval(() => {
      setTrails((prev) =>
        prev
          .map((t) => ({ ...t, opacity: t.opacity - 0.15 }))
          .filter((t) => t.opacity > 0)
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isDragging]);

  if (!isDragging) return null;

  return (
    <>
      {/* Cursor trails */}
      {trails.map((trail) => (
        <div
          key={trail.id}
          className="fixed pointer-events-none z-[90] rounded-full"
          style={{
            left: trail.x,
            top: trail.y,
            width: 12,
            height: 12,
            transform: "translate(-50%, -50%)",
            backgroundColor: `hsl(142, 100%, 42%)`,
            opacity: trail.opacity * 0.6,
            boxShadow: `0 0 20px hsl(142, 100%, 42%)`,
          }}
        />
      ))}
      
      {/* Main cursor glow */}
      <div
        className="fixed pointer-events-none z-[91] rounded-full"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          width: 24,
          height: 24,
          transform: "translate(-50%, -50%)",
          border: "2px solid hsl(142, 100%, 42%)",
          boxShadow: `0 0 30px hsl(142, 100%, 42%, 0.5), inset 0 0 15px hsl(142, 100%, 42%, 0.3)`,
          animation: "pulse 1s ease-in-out infinite",
        }}
      />
    </>
  );
};
