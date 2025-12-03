import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BackButton } from "./BackButton";
import { StatsCard } from "./cards/StatsCard";
import { ChartCard } from "./cards/ChartCard";
import { MoneyCard } from "./cards/MoneyCard";
import { EyeCard } from "./cards/EyeCard";
import { BitcoinCard } from "./cards/BitcoinCard";
import { QRCard } from "./cards/QRCard";
import { ImageCard } from "./cards/ImageCard";
import { EarningsCard } from "./cards/EarningsCard";
import { BalanceCard } from "./cards/BalanceCard";
import { ShoppingCard } from "./cards/ShoppingCard";
import { PhoneCard } from "./cards/PhoneCard";
import { GoldBarsCard } from "./cards/GoldBarsCard";
import { PatternCard } from "./cards/PatternCard";
import { LiveCard } from "./cards/LiveCard";
import { ParticleEffect } from "./ParticleEffect";
import { CursorEffect } from "./CursorEffect";
import { GridBackground } from "./GridBackground";

interface CardItem {
  id: string;
  component: React.ReactNode;
  gridColumn: string;
  gridRow: string;
}

const GRID_SIZE = 420; // Size of each grid cell
const CARD_GAP = 120; // Gap between cards - much more sparse
const BOUNDARY = 5000; // Boundary limit for dragging

export const InteractiveGrid = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedCardRect, setSelectedCardRect] = useState<DOMRect | null>(null);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [zoomProgress, setZoomProgress] = useState(0);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Card configurations - sparse layout with gaps
  const cards: CardItem[] = [
    { id: "image1", component: <ImageCard className="w-full h-full" />, gridColumn: "1", gridRow: "1" },
    { id: "eye", component: <EyeCard className="w-full h-full" />, gridColumn: "3", gridRow: "1" },
    { id: "bitcoin", component: <BitcoinCard className="w-full h-full" />, gridColumn: "5", gridRow: "1" },
    { id: "live", component: <LiveCard className="w-full h-full" />, gridColumn: "2", gridRow: "2" },
    { id: "earnings", component: <EarningsCard title="Earnings" amount="$389" period="in May" className="w-full h-full" />, gridColumn: "4", gridRow: "2" },
    { id: "stats", component: <StatsCard percentage={62} className="w-full h-full" />, gridColumn: "1", gridRow: "3" },
    { id: "chart", component: <ChartCard title="Capsule Corp." value="$1,234" change="↑ 1.01%" className="w-full h-full" />, gridColumn: "3", gridRow: "3" },
    { id: "phone", component: <PhoneCard className="w-full h-full" />, gridColumn: "5", gridRow: "3" },
    { id: "shopping", component: <ShoppingCard className="w-full h-full" />, gridColumn: "2", gridRow: "4" },
    { id: "money", component: <MoneyCard amount="$150" className="w-full h-full" />, gridColumn: "4", gridRow: "4" },
    { id: "qr", component: <QRCard className="w-full h-full" />, gridColumn: "1", gridRow: "5" },
    { id: "gold", component: <GoldBarsCard className="w-full h-full" />, gridColumn: "3", gridRow: "5" },
    { id: "pattern", component: <PatternCard className="w-full h-full" />, gridColumn: "5", gridRow: "5" },
    { id: "balance", component: <BalanceCard balance="95,260.00" change="↑ 2.30%" className="w-full h-full" />, gridColumn: "2", gridRow: "6" },
  ];

  // Create repeated cards for infinite effect
  const repeatedCards = useCallback(() => {
    const result: { card: CardItem; offsetX: number; offsetY: number; key: string }[] = [];
    const repeatX = 2;
    const repeatY = 2;
    
    for (let ox = -repeatX; ox <= repeatX; ox++) {
      for (let oy = -repeatY; oy <= repeatY; oy++) {
        cards.forEach(card => {
          result.push({
            card,
            offsetX: ox * 5 * GRID_SIZE,
            offsetY: oy * 6 * GRID_SIZE,
            key: `${card.id}-${ox}-${oy}`,
          });
        });
      }
    }
    return result;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (selectedCard) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [position, selectedCard]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || selectedCard) return;
    
    let newX = e.clientX - dragStart.current.x;
    let newY = e.clientY - dragStart.current.y;
    
    // Apply boundary limits
    newX = Math.max(-BOUNDARY, Math.min(BOUNDARY, newX));
    newY = Math.max(-BOUNDARY, Math.min(BOUNDARY, newY));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, selectedCard]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const addParticle = useCallback((x: number, y: number) => {
    const id = Date.now();
    setParticles((prev) => [...prev, { id, x, y }]);
  }, []);

  const removeParticle = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleCardClick = useCallback((cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCard) return;
    
    // Add particle effect at click position
    addParticle(e.clientX, e.clientY);
    
    const cardElement = cardRefs.current.get(cardId);
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      setSelectedCardRect(rect);
    }
    
    // Start zoom animation
    setZoomProgress(0);
    setSelectedCard(cardId);
    
    // Animate zoom progress with spring-like easing
    let start: number;
    const duration = 600;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // Spring easing for more dynamic feel
      const eased = 1 - Math.pow(1 - progress, 3) * Math.cos(progress * Math.PI * 0.5);
      setZoomProgress(Math.min(eased, 1));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [selectedCard, addParticle]);

  const handleBack = useCallback(() => {
    // Animate zoom out
    let start: number;
    const duration = 600;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = Math.pow(1 - progress, 3);
      setZoomProgress(eased);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSelectedCard(null);
        setSelectedCardRect(null);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (selectedCard) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
  }, [position, selectedCard]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || selectedCard) return;
    const touch = e.touches[0];
    
    let newX = touch.clientX - dragStart.current.x;
    let newY = touch.clientY - dragStart.current.y;
    
    newX = Math.max(-BOUNDARY, Math.min(BOUNDARY, newX));
    newY = Math.max(-BOUNDARY, Math.min(BOUNDARY, newY));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, selectedCard]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard support for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCard) {
        handleBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCard, handleBack]);

  const allCards = repeatedCards();

  return (
    <div 
      ref={containerRef}
      className={cn(
        "w-full h-full overflow-hidden bg-background relative",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Grid Pattern */}
      <GridBackground position={position} />
      
      <BackButton onClick={handleBack} visible={!!selectedCard} />
      
      {/* Cursor Effect */}
      <CursorEffect isDragging={isDragging} />
      
      {/* Particle Effects */}
      {particles.map((p) => (
        <ParticleEffect
          key={p.id}
          x={p.x}
          y={p.y}
          onComplete={() => removeParticle(p.id)}
        />
      ))}
      
      {/* Grid Canvas */}
      <div
        className={cn(
          "grid-canvas transition-transform",
          selectedCard && "pointer-events-none"
        )}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          left: "50%",
          top: "50%",
          marginLeft: `-${2.5 * GRID_SIZE}px`,
          marginTop: `-${3 * GRID_SIZE}px`,
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
      >
        {allCards.map(({ card, offsetX, offsetY, key }) => {
          const isSelected = selectedCard === card.id && offsetX === 0 && offsetY === 0;
          
          return (
            <div
              key={key}
              ref={(el) => {
                if (el && offsetX === 0 && offsetY === 0) {
                  cardRefs.current.set(card.id, el);
                }
              }}
              className={cn(
                "absolute card-interactive",
                selectedCard && !isSelected && "opacity-0 scale-90 blur-sm",
                isSelected && "z-50"
              )}
              style={{
                width: GRID_SIZE - CARD_GAP,
                height: GRID_SIZE - CARD_GAP,
                left: (parseInt(card.gridColumn) - 1) * GRID_SIZE + offsetX + CARD_GAP / 2,
                top: (parseInt(card.gridRow) - 1) * GRID_SIZE + offsetY + CARD_GAP / 2,
                transition: selectedCard 
                  ? "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)" 
                  : "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s, opacity 0.3s",
              }}
              onClick={(e) => handleCardClick(card.id, e)}
            >
              {card.component}
            </div>
          );
        })}
      </div>

      {/* Zoomed Card Overlay */}
      {selectedCard && selectedCardRect && (
        <div 
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${0.85 * zoomProgress})`,
            backdropFilter: `blur(${12 * zoomProgress}px)`,
          }}
          onClick={handleBack}
        >
          <div 
            style={{
              width: Math.min(850, window.innerWidth - 32),
              height: Math.min(750, window.innerHeight - 80),
              transform: `scale(${0.3 + 0.7 * zoomProgress}) translateY(${(1 - zoomProgress) * 30}px)`,
              opacity: zoomProgress,
              transition: 'transform 0.1s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {cards.find(c => c.id === selectedCard)?.component}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!selectedCard && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground text-sm bg-secondary/50 backdrop-blur px-4 py-2 rounded-full">
          Drag to explore • Click a card to zoom
        </div>
      )}
    </div>
  );
};
