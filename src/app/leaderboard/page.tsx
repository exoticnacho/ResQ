"use client";
import React, { useState, useEffect } from "react";
import { StreakWidget } from "@/components/StreakWidget";
import { subscribeToLeaderboard, UserProfile } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard((data) => {
      setLeaderboard(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: "24px", paddingBottom: "100px", minHeight: "100%", position: "relative", zIndex: 10 }}>
      {/* Editorial Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        <div>
          <h1 className="t-h1 c-ink" style={{ fontSize: 28, letterSpacing: "-1px" }}>Global Impact</h1>
        </div>
        <StreakWidget />
      </div>

      <div style={{ marginBottom: 24, marginTop: 8 }}>
        <h2 className="t-h2 c-ink" style={{ fontSize: 20, marginBottom: 4 }}>Top Rescuers </h2>
        <p className="t-body c-muted" style={{ fontSize: 15 }}>Lihat pahlawan lingkungan dari data riil.</p>
      </div>

      <div className="flex-col gap-4">
        {loading ? (
          <div className="t-body c-muted" style={{ textAlign: "center", marginTop: 40 }}>Memuat papan peringkat...</div>
        ) : leaderboard.length === 0 ? (
          <div className="t-body c-muted" style={{ textAlign: "center", marginTop: 40 }}>Belum ada pahlawan saat ini.</div>
        ) : (
          leaderboard.map((u, idx) => {
            const isMe = user && user.uid === u.id;
            return (
              <div key={u.id} className="elite-card fade-up" style={{ display: "flex", alignItems: "center", padding: "16px 20px", animationDelay: `${idx * 50}ms` }}>
                
                {/* Elite Rank Badge */}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 16, fontFamily: "var(--font-display)",
                  marginRight: 16,
                  background: idx === 0 ? "linear-gradient(135deg, #FDE047, #F59E0B)" :
                              idx === 1 ? "linear-gradient(135deg, #E2E8F0, #94A3B8)" :
                              idx === 2 ? "linear-gradient(135deg, #FDBA74, #D97706)" : "var(--c-faint)",
                  color: idx < 3 ? "#FFF" : "var(--c-muted)",
                  boxShadow: idx === 0 ? "0 4px 16px rgba(245,158,11,0.4), inset 0 1px 1px rgba(255,255,255,0.6)" : "inset 0 1px 1px rgba(255,255,255,0.6)"
                }}>
                  {idx + 1}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 16 }}>
                    {isMe ? "You" : u.name}
                  </div>
                  <div className="t-xs c-muted" style={{ display: "flex", gap: 12, marginTop: 6, textTransform: "none", fontSize: 12, letterSpacing: 0 }}>
                    <span> Rp {(u.totalSaved/1000).toFixed(0)}k</span>
                    <span> {u.totalCO2}kg CO₂</span>
                  </div>
                </div>

                <div style={{ 
                  fontSize: 11, fontWeight: 800, padding: "6px 12px", borderRadius: 8,
                  background: isMe ? "var(--c-accent-glow)" : "var(--c-brand-faint)", 
                  color: isMe ? "#B45309" : "var(--c-brand)" 
                }}>
                  {u.tier || "Newbie"}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
