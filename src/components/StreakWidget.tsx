"use client";
import React from "react";
import { useUserProgress } from "@/context/UserProgressContext";

export const StreakWidget: React.FC = () => {
  const { streak } = useUserProgress();
  const tier = (() => {
    if (streak >= 30) return { label: "Elite Forest", color: "var(--c-brand)", glow: "rgba(217,101,75,0.4)" };
    if (streak >= 15) return { label: "Sprout", color: "#10B981", glow: "rgba(16,185,129,0.4)" };
    if (streak >= 5) return { label: "Seed", color: "#34D399", glow: "rgba(52,211,153,0.4)" };
    return { label: "Newbie", color: "var(--c-accent)", glow: "rgba(229,169,61,0.4)" };
  })();

  const progress = Math.min((streak % 15) / 15 * 100, 100);

  return (
    <div className="elite-glass" style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "12px 16px",
      borderRadius: "var(--radius-xl)",
      width: "fit-content",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Tier Glow */}
      <div style={{
        position: "absolute", right: -20, top: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: tier.glow, filter: "blur(20px)",
        pointerEvents: "none", opacity: 0.5
      }} />

      {/* Circular Progress Ring */}
      <div style={{ position: "relative", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0 }}>
          <circle cx="22" cy="22" r="18" fill="none" stroke="var(--c-border)" strokeWidth="4" />
          <circle cx="22" cy="22" r="18" fill="none" stroke={tier.color} strokeWidth="4" 
            strokeDasharray="113" strokeDashoffset={113 - (113 * progress) / 100} 
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s var(--ease-spring)" }}
          />
        </svg>
        
      </div>

      <div className="flex-col">
        <span className="t-xs" style={{ color: tier.color, letterSpacing: "1px" }}>{tier.label} Tier</span>
        <span className="c-ink" style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.5px" }}>
          {streak} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--c-muted)" }}>Hari</span>
        </span>
      </div>
    </div>
  );
};
