"use client";
import React, { useState, useEffect } from "react";

export default function ShowroomClient({ children }: { children: React.ReactNode }) {
  const [foodSaved, setFoodSaved] = useState(1248.4);
  const [carbonSaved, setCarbonSaved] = useState(3121.0);
  const [activeRescuers, setActiveRescuers] = useState(4892);

  useEffect(() => {
    const interval = setInterval(() => {
      setFoodSaved((prev) => parseFloat((prev + 0.1).toFixed(1)));
      setCarbonSaved((prev) => parseFloat((prev + 0.25).toFixed(2)));
      if (Math.random() > 0.6) {
        setActiveRescuers((prev) => prev + 1);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="showroom-wrapper">
      {/* ────────────────────────────────────────────────────────
          LEFT PANEL: Presentation Hub (Sustainability & Business Pitch)
      ──────────────────────────────────────────────────────── */}
      <aside className="presentation-hub">
        <div>
          {/* Header */}
          <div className="flex items-center" style={{ marginBottom: 40 }}>
            <div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-1px" }}>ResQ</span>
                <span className="tag tag-green" style={{ fontSize: 9, padding: "2px 6px" }}>PITCH CENTER</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 600 }}>Food Rescue Marketplace</p>
            </div>
          </div>

          {/* Slogan */}
          <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-2px", marginBottom: 20 }}>
            Sore. Save.<br />
            <span style={{ color: "var(--c-glow-green)" }}>Rescue Made Simple.</span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--c-muted)", lineHeight: 1.6, maxWidth: 440, marginBottom: 48 }}>
            Visualisasikan penyelamatan pangan secara real-time. Bantu kurangi limbah surplus dan rasakan dampak lingkungan nyata dalam satu dasbor.
          </p>

          {/* Environmental Ledger Indicators */}
          <div className="flex-col gap-4" style={{ marginBottom: 48 }}>
            <h3 className="t-xs" style={{ color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>DAMPAK RIIL RESQ (LIVE)</h3>
            <div className="flex gap-6">
              
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "20px 24px",
                borderRadius: "20px",
                flex: 1,
                minWidth: 150
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--c-glow-green)", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  <span className="live-glow" />  Makanan Diselamatkan
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
                  {foodSaved.toLocaleString("id-ID", { minimumFractionDigits: 1 })} <span style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>kg</span>
                </div>
              </div>

              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "20px 24px",
                borderRadius: "20px",
                flex: 1,
                minWidth: 150
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--c-glow-green)", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  <span className="live-glow" /> ️ CO₂ Dihemat
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
                  {carbonSaved.toLocaleString("id-ID", { minimumFractionDigits: 2 })} <span style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>kg</span>
                </div>
              </div>

            </div>
          </div>

          {/* DNA highlight checklist */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: 24, maxWidth: 480 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, letterSpacing: "1px", color: "var(--c-glow-green)", marginBottom: 16 }}>PITCH PRESENTATION CHECKLIST</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--c-glow-green)", fontWeight: 800 }}></span> **5-Star App Polish:** Center PWAs with beautiful eco bank savings banners.
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--c-glow-green)", fontWeight: 800 }}></span> **Interactive Checkout Counters:** Tactile portions and pay options.
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--c-glow-green)", fontWeight: 800 }}></span> **Eco Benefit Breakdowns:** Show exact carbon offset and money saved.
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--c-glow-green)", fontWeight: 800 }}></span> **Isolated Presentation Hub:** Show the live app via clean sandboxed iframe.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, fontSize: 12, color: "var(--c-muted)", fontWeight: 600 }}>
          <span>© 2026 ResQ Corp. All Rights Reserved.</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-glow-green)" }} />
            Active Rescuers: {activeRescuers.toLocaleString("id-ID")}
          </span>
        </div>
      </aside>

      {/* ────────────────────────────────────────────────────────
          RIGHT PANEL: Phone Chassis Bezel containing iframe
      ──────────────────────────────────────────────────────── */}
      <main className="app-viewport">
        <div className="phone-mockup-frame">
          {children}
        </div>
      </main>
    </div>
  );
}
