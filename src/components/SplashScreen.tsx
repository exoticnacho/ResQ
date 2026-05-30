"use client";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"visible" | "fading">("visible");

  useEffect(() => {
    // After 2.2s show fade-out animation, then call onComplete
    const fadeTimer = setTimeout(() => setPhase("fading"), 2200);
    const doneTimer = setTimeout(() => onComplete(), 2700);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onComplete]);

  return (
    <div
      aria-label="Memuat ResQ..."
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--c-bg)",
        transition: "opacity 0.5s var(--ease-fluid)",
        opacity: phase === "fading" ? 0 : 1,
        pointerEvents: phase === "fading" ? "none" : "all",
        overflow: "hidden",
      }}
    >
      {/* ─── Ambient Orbs ─── */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", borderRadius: "50%",
          filter: "blur(90px)", opacity: 0.45,
          background: "var(--c-brand)",
          width: 320, height: 320, top: -120, left: -80,
          animation: "splashOrb1 12s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", borderRadius: "50%",
          filter: "blur(110px)", opacity: 0.25,
          background: "var(--c-accent)",
          width: 260, height: 260, bottom: 40, right: -80,
          animation: "splashOrb2 16s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", borderRadius: "50%",
          filter: "blur(100px)", opacity: 0.22,
          background: "#FFE8D6",
          width: 400, height: 400, bottom: -150, left: "15%",
          animation: "splashOrb1 20s ease-in-out infinite reverse",
        }} />
      </div>

      {/* ─── Main Content ─── */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 0,
        animation: "splashFadeIn 0.6s var(--ease-spring) forwards",
        position: "relative", zIndex: 2,
      }}>

        {/* Logo Mark */}
        <div style={{
          width: 88, height: 88,
          background: "linear-gradient(145deg, var(--c-brand) 0%, #B84030 100%)",
          borderRadius: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 28,
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.18) inset,
            0 20px 60px -12px rgba(217,101,75,0.5),
            0 8px 24px -4px rgba(217,101,75,0.3)
          `,
          animation: "logoBreath 2.8s ease-in-out infinite",
        }}>
          
        </div>

        {/* Wordmark */}
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 48,
          fontWeight: 800,
          letterSpacing: "-2px",
          color: "var(--c-ink)",
          lineHeight: 1,
          marginBottom: 12,
        }}>
          Res<span style={{ color: "var(--c-brand)" }}>Q</span>
        </div>

        {/* Tagline */}
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--c-muted)",
          letterSpacing: "0.3px",
          animation: "splashTaglineIn 0.6s var(--ease-spring) 0.4s both",
          marginBottom: 52,
        }}>
          Selamatkan makanan, jaga bumi kita
        </p>

        {/* Progress Bar */}
        <div style={{
          width: 120, height: 3,
          background: "rgba(217,101,75,0.15)",
          borderRadius: 99,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, var(--c-brand), var(--c-accent))",
            borderRadius: 99,
            animation: "progressBar 2s var(--ease-fluid) forwards",
          }} />
        </div>
      </div>

      {/* ─── Bottom Brand Mark ─── */}
      <div style={{
        position: "absolute", bottom: 40,
        fontFamily: "var(--font-sans)",
        fontSize: 11, fontWeight: 500,
        color: "rgba(113,113,122,0.6)",
        letterSpacing: "0.5px",
        animation: "splashTaglineIn 0.6s var(--ease-spring) 0.8s both",
        zIndex: 2,
      }}>
        Food Rescue · Zero Waste · Community
      </div>
    </div>
  );
}
