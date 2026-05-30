"use client";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StreakWidget } from "@/components/StreakWidget";
import { useUserProgress } from "@/context/UserProgressContext";
import confetti from "canvas-confetti";

function SuccessContent() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  
  const qty = searchParams.get("qty") || "1";
  const save = searchParams.get("save") || "23000";
  const co2 = searchParams.get("co2") || "0.8";

  const { incrementStreak } = useUserProgress();

  useEffect(() => {
    setMounted(true);
    // Apple-style magical confetti burst
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#D9654B', '#E5A93D', '#FFFFFF'] });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#D9654B', '#E5A93D', '#FFFFFF'] });
    }, 250);

    incrementStreak();
  }, []);

  return (
    <div className={`fade-up ${mounted ? "" : "opacity-0"}`} style={{ transition: "opacity 0.6s var(--ease-spring)", width: "100%", zIndex: 10 }}>
      {/* Floating Success Icon (Apple Pay style check) */}
      <div style={{
        width: 120, height: 120, borderRadius: "50%",
        background: "var(--c-brand)", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 32px",
        boxShadow: "0 0 0 16px var(--c-brand-faint), var(--sh-brand), inset 0 2px 4px rgba(255,255,255,0.4)",
        transform: mounted ? "scale(1)" : "scale(0.8)",
        transition: "all 0.8s var(--ease-spring)"
      }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
             style={{ strokeDasharray: 100, strokeDashoffset: mounted ? 0 : 100, transition: "stroke-dashoffset 1s ease-out 0.2s" }}>
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <h1 className="t-hero c-ink" style={{ marginBottom: 12, fontSize: 36, textAlign: "center" }}>Berhasil.</h1>
      <p className="t-body c-muted" style={{ maxWidth: 300, margin: "0 auto 32px", fontSize: 16, lineHeight: 1.5, textAlign: "center" }}>
        Pesanan Elite Penyelamatan Pangan kamu sedang diproses.
      </p>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
        <StreakWidget />
      </div>

      {/* ELITE GLOWING RECEIPT */}
      <div className="elite-glass" style={{ 
        padding: 24,
        marginBottom: 40,
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        borderRadius: "var(--radius-xl)",
        position: "relative"
      }}>
        {/* Subtle interior glow */}
        <div style={{ position: "absolute", top: -40, left: -40, width: 150, height: 150, background: "radial-gradient(circle, var(--c-accent-glow) 0%, transparent 60%)", pointerEvents: "none" }} />

        <h3 className="t-xs" style={{ color: "var(--c-brand)", letterSpacing: "1.5px" }}>REKAP DAMPAK</h3>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: "16px", background: "var(--c-surface)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--sh-sm)" }}>
            
          </div>
          <div className="flex-col">
            <span className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15 }}>{qty} Porsi Elite</span>
            <span className="t-xs c-muted" style={{ textTransform: "none" }}>Diselamatkan hari ini</span>
          </div>
        </div>

        <div style={{ width: "100%", height: 1, background: "var(--c-border)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: "16px", background: "var(--c-surface)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--sh-sm)" }}>
            
          </div>
          <div className="flex-col">
            <span className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15 }}>Rp {parseInt(save).toLocaleString("id-ID")}</span>
            <span className="t-xs c-muted" style={{ textTransform: "none" }}>Diskon yang kamu dapatkan</span>
          </div>
        </div>

        <div style={{ width: "100%", height: 1, background: "var(--c-border)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: "16px", background: "var(--c-surface)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--sh-sm)" }}>
            
          </div>
          <div className="flex-col">
            <span className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15 }}>{co2} kg CO₂</span>
            <span className="t-xs c-muted" style={{ textTransform: "none" }}>Jejak karbon ditekan</span>
          </div>
        </div>
      </div>

      <div className="flex-col gap-4">
        <Link href="/orders" className="elite-btn-primary" style={{ textDecoration: "none", display: "flex" }}>
          Lacak Pesanan 
        </Link>
        <Link href="/" style={{
          display: "block", padding: "16px", color: "var(--c-brand)",
          fontWeight: 600, textDecoration: "none",
          borderRadius: "var(--radius-pill)",
          background: "transparent",
          fontSize: 15,
          textAlign: "center"
        }}>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="flex-col items-center justify-center" style={{ minHeight: "100%", padding: "40px 24px", textAlign: "center", position: "relative", zIndex: 10 }}>
      <Suspense fallback={
        <div className="t-h3 c-ink" style={{ fontWeight: 700, textAlign: "center", marginTop: "50%" }}>Menyiapkan Laporan Magis...</div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
