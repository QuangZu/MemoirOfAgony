interface GridBackgroundProps {
  position: { x: number; y: number };
}

export const GridBackground = ({ position }: GridBackgroundProps) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Grid dots pattern */}
      <svg
        className="absolute w-full h-full opacity-20"
        style={{
          transform: `translate(${position.x * 0.1}px, ${position.y * 0.1}px)`,
        }}
      >
        <defs>
          <pattern
            id="grid-dots"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="hsl(var(--primary))" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="200%" height="200%" x="-50%" y="-50%" fill="url(#grid-dots)" />
      </svg>
      
      {/* Gradient overlays for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, hsl(var(--primary) / 0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, hsl(var(--primary) / 0.03) 0%, transparent 40%)
          `,
          transform: `translate(${position.x * 0.05}px, ${position.y * 0.05}px)`,
        }}
      />
      
      {/* Vignette effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, hsl(var(--background)) 100%)',
        }}
      />
    </div>
  );
};
