// src/components/SwipeableCard.tsx
"use client";
import React, { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { useRouter } from "next/navigation";

interface SwipeableCardProps {
  children: React.ReactNode;
  foodId: string;
  isRow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({ children, foodId, isRow = false, className, style }) => {
  const router = useRouter();
  const [swiped, setSwiped] = useState(false);
  const [offset, setOffset] = useState(0);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (e.dir === "Right") {
        setOffset(Math.min(e.deltaX, 100)); // Cap the visual drag to 100px
      }
    },
    onSwipedRight: (e) => {
      if (e.velocity > 0.5 || e.deltaX > 80) {
        setSwiped(true);
        setOffset(100);
        setTimeout(() => {
          // Instantly redirect to the checkout sheet for this item
          router.push(`/food/${foodId}`);
        }, 300);
      } else {
        setOffset(0);
      }
    },
    onSwipedLeft: () => setOffset(0),
    onSwipedUp: () => setOffset(0),
    onSwipedDown: () => setOffset(0),
    trackMouse: true, // Allows testing on desktop
  });

  return (
    <div
      {...handlers}
      style={{
        position: "relative",
        transform: `translateX(${offset}px)`,
        transition: swiped ? "transform 0.3s ease-out" : offset === 0 ? "transform 0.2s" : "none",
        cursor: "grab",
        userSelect: "none",
        touchAction: "pan-y",
        width: "100%"
      }}
      onClick={() => router.push(`/food/${foodId}`)} // Regular click still works
    >
      {/* Background layer revealed behind the card when swiping */}
      <div style={{
        position: "absolute",
        top: 0, left: -100,
        height: "100%", width: 100,
        background: "var(--c-brand)",
        borderRadius: "var(--radius-xl) 0 0 var(--radius-xl)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontSize: 24,
        opacity: offset > 20 ? Math.min(offset / 100, 1) : 0,
      }}>
        
      </div>
      
      {/* The actual Card Content */}
      <div className={className} style={{ pointerEvents: "none", ...style }}>
        {children}
      </div>

      {/* Overlay flashed upon successful swipe */}
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        background: "rgba(217,101,75,0.85)", backdropFilter: "blur(8px)",
        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, fontWeight: 800, borderRadius: "var(--radius-xl)",
        pointerEvents: "none", transition: "opacity 0.2s", zIndex: 50,
        opacity: swiped ? 1 : 0 
      }}>
        Maukah Diselamatkan? 
      </div>
    </div>
  );
};
