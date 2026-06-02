"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CATEGORIES, FoodListing } from "@/lib/seedData";
import { subscribeToListings, seedDatabase, subscribeToUserStats, UserProfile } from "@/lib/db";
import CountdownTimer from "@/components/CountdownTimer";
import { StreakWidget } from "@/components/StreakWidget";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [radarActive, setRadarActive] = useState(true);
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [userStats, setUserStats] = useState<UserProfile | null>(null);

  useEffect(() => {
    seedDatabase().catch(console.error);
    const unsubscribe = subscribeToListings((data) => {
      setListings(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserStats(user.uid, (data) => {
      setUserStats(data);
    });
    return () => unsubscribe();
  }, [user]);

  const URGENT_LISTINGS = [...listings].sort((a, b) => a.expiresAt - b.expiresAt).slice(0, 3);

  const filtered = listings.filter((l) => {
    const catMatch = activeCategory === "Semua" || l.category === activeCategory;
    const searchMatch = !search || l.name.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: "24px 0", paddingBottom: 100, position: "relative", zIndex: 10 }}>
      
      {/* ────────────────────────────────────────────────────────
          DYNAMIC ISLAND: LIVE RESCUE TICKER (Apple Style)
      ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px", display: "flex", justifyContent: "center", position: "sticky", top: 16, zIndex: 50 }} className="fade-up">
        <div className="elite-glass" style={{
          borderRadius: 99,
          padding: "8px 16px",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "var(--sh-lg), var(--sh-inner-glass)"
        }}>
          <div className="live-glow-elite" />
          <span className="t-xs c-ink" style={{ letterSpacing: 0, fontWeight: 500, textTransform: "none" }}>
            <b style={{ fontWeight: 800 }}>Sarah</b> menyelamatkan 3 porsi di dekatmu
          </span>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          EDITORIAL HERO HEADER
      ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 28px", marginTop: 8 }} className="fade-up delay-1">
        <h1 className="t-hero c-ink">
          Selamatkan.<br/>
          <span style={{ color: "var(--c-brand)" }}>Beri Dampak.</span>
        </h1>
        <p className="t-body c-muted" style={{ marginTop: 12, maxWidth: "90%", fontSize: 16, lineHeight: 1.5 }}>
          Rasakan pengalaman revolusioner menyelamatkan hidangan premium dari sisa terbuang.
        </p>
      </section>

      {/* ────────────────────────────────────────────────────────
          BENTO BOX ECO LEDGER (Google / Apple hybrid)
      ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px" }} className="fade-up delay-2">
        <div className="elite-card" style={{ 
          background: "var(--c-surface-glass-heavy)", 
          backdropFilter: "blur(40px)",
          padding: "20px 24px",
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
          gap: "16px",
          alignItems: "center",
          position: "relative"
        }}>
          {/* Subtle Glow inside the card */}
          <div style={{
            position: "absolute", top: 0, right: 0,
            width: "150px", height: "150px",
            background: "radial-gradient(circle, var(--c-brand-faint) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          <div className="flex-col gap-1">
            <div className="t-xs c-brand" style={{ fontSize: 10 }}>Makananmu</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-1px", lineHeight: 1 }}>
                {userStats ? (userStats.totalCO2 / 2.5).toFixed(1) : "0"}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", letterSpacing: 0, paddingBottom: 1 }}>kg</span>
            </div>
            <div className="t-xs" style={{ opacity: 0.6, fontSize: 10, textTransform: "none" }}>diselamatkan</div>
          </div>
          
          <div style={{ width: 1, height: "100%", background: "var(--c-border)" }} />

          <div className="flex-col gap-1">
            <div className="t-xs" style={{ color: "#10B981", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>CO₂</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-1px", lineHeight: 1 }}>
                {userStats ? userStats.totalCO2.toFixed(1) : "0"}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", letterSpacing: 0, paddingBottom: 1 }}>kg</span>
            </div>
            <div className="t-xs" style={{ opacity: 0.6, fontSize: 10, textTransform: "none" }}>ditekan</div>
          </div>

          <div style={{ width: 1, height: "100%", background: "var(--c-border)" }} />

          <div className="flex-col gap-1">
            <div className="t-xs" style={{ color: "#D97706", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Hemat</div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
              {userStats ? `Rp ${(userStats.totalSaved / 1000).toFixed(0)}k` : "Rp 0"}
            </div>
            <div className="t-xs" style={{ opacity: 0.6, fontSize: 10, textTransform: "none" }}>dihemat</div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          RESCUE RADAR TOGGLE (Tactile Switch)
      ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px" }} className="fade-up delay-3">
        <div className="elite-card flex items-center justify-between" style={{ padding: "16px 20px", cursor: "pointer" }} onClick={() => setRadarActive(!radarActive)}>
          <div className="flex items-center gap-3">
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--sh-inner-glass), var(--sh-sm)" }}>
              
            </div>
            <div>
              <h4 className="t-sm c-ink" style={{ fontWeight: 700 }}>Radar Otomatis</h4>
              <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 2, fontSize: 11 }}>Ping saat ada sisa hidangan.</p>
            </div>
          </div>
          
          <div style={{
            width: 44, height: 24, borderRadius: 99,
            background: radarActive ? "var(--c-brand)" : "var(--c-faint)",
            position: "relative",
            transition: "all 0.4s var(--ease-spring)",
            boxShadow: radarActive ? "inset 0 1px 4px rgba(0,0,0,0.2)" : "inset 0 1px 4px rgba(0,0,0,0.1)"
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 2, left: radarActive ? 22 : 2,
              transition: "all 0.4s var(--ease-spring)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
            }}/>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          SEARCH BAR (Google Material You + Apple Glass)
      ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px" }} className="fade-up delay-3">
        <div className="elite-glass" style={{ 
          display: "flex", alignItems: "center", gap: 12, 
          padding: "16px 20px", borderRadius: "var(--radius-xl)",
          boxShadow: "var(--sh-sm), var(--sh-inner-glass)",
          transition: "transform 0.3s var(--ease-spring)"
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Cari hidangan elite..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none", outline: "none", background: "transparent",
              width: "100%", fontSize: 15, fontFamily: "var(--font-sans)", fontWeight: 500, color: "var(--c-ink)"
            }}
          />
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          CATEGORY CHIPS (Apple Style Horizontal Scroll)
      ──────────────────────────────────────────────────────── */}
      <section className="fade-up delay-3">
        <div style={{ 
          display: "flex", gap: 8, padding: "0 24px", 
          overflowX: "auto", width: "100%", marginTop: 8,
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none"
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0, padding: "10px 20px", borderRadius: 99,
                fontSize: 13, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer",
                transition: "all 0.3s var(--ease-spring)",
                background: activeCategory === cat ? "var(--c-ink)" : "var(--c-surface)",
                color: activeCategory === cat ? "#fff" : "var(--c-ink)",
                boxShadow: activeCategory === cat ? "0 8px 16px rgba(0,0,0,0.15)" : "var(--sh-sm), inset 0 1px 1px rgba(255,255,255,1)",
                border: activeCategory === cat ? "1px solid transparent" : "1px solid var(--c-border)"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
          URGENT CARDS / FILTERED RESULTS
      ──────────────────────────────────────────────────────── */}
      {activeCategory === "Semua" && !search ? (
        <section style={{ padding: "0 24px" }} className="fade-up delay-3">
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <h2 className="t-h2 c-ink" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20 }}>
              Peluang Emas <span style={{ fontSize: 18 }}></span>
            </h2>
          </div>
          
          <div className="flex gap-4" style={{ 
            paddingBottom: 20, margin: "0 -24px", paddingLeft: 24, paddingRight: 24, 
            overflowX: "auto", 
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
            scrollbarWidth: "none"
          }}>
            {URGENT_LISTINGS.map((l, i) => {
              const discount = Math.round((1 - l.rescuePrice / l.originalPrice) * 100);
              return (
                <Link 
                  href={`/food/${l.id}`}
                  key={l.id} 
                  className="elite-card card-interactive" 
                  style={{ 
                    flexShrink: 0,
                    minWidth: 280, 
                    padding: 16, 
                    animationDelay: `${i*100}ms`,
                    position: "relative",
                    textDecoration: "none",
                    display: "block",
                    cursor: "pointer"
                  }}
                >
                  
                  {/* Luxury Discount Sticker */}
                  <span className="discount-luxury" style={{ top: 24, left: 24 }}>-{discount}% OFF</span>

                  {/* Thumbnail / Squircle */}
                  <div style={{ width: "100%", height: 160, marginBottom: 16, borderRadius: "var(--radius-lg)", overflow: "hidden", position: "relative" }}>
                    <img src={l.imageUrl} alt={l.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>

                  {/* Header Row */}
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <span className="t-xs" style={{ color: "var(--c-brand)", fontWeight: 700 }}> {l.donorName}</span>
                    <CountdownTimer expiresAt={l.expiresAt} />
                  </div>

                  {/* Title */}
                  <h3 className="t-h3 c-ink" style={{ marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {l.name}
                  </h3>
                  
                  {/* Pricing group */}
                  <div className="flex items-center justify-between" style={{ 
                    background: "var(--c-bg)", padding: "10px 14px", 
                    borderRadius: "var(--radius-md)", border: "1px solid var(--c-border)"
                  }}>
                    <div className="flex-col">
                      <span className="t-xs c-muted" style={{ textDecoration: "line-through", fontSize: 10, letterSpacing: 0 }}>
                        Rp {l.originalPrice.toLocaleString()}
                      </span>
                      <span className="c-ink" style={{ fontWeight: 800, fontSize: 16, fontFamily: "var(--font-display)" }}>
                        Rp {l.rescuePrice.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      {l.isPickup && <span className="tag tag-green">Pickup</span>}
                      {l.isDelivery && <span className="tag tag-yellow">Delivery</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section style={{ padding: "0 24px" }} className="fade-up delay-3">
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <h2 className="t-h2 c-ink" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 20 }}>
              Hasil Pencarian
            </h2>
            <span className="t-xs c-muted">{filtered.length} ditemukan</span>
          </div>
          <div className="flex-col gap-4">
            {filtered.length === 0 ? (
              <div className="elite-card flex-col items-center justify-center" style={{ padding: 40, textAlign: "center", background: "var(--c-surface-glass)", backdropFilter: "blur(20px)" }}>
                
                <div className="t-h3 c-ink" style={{ marginBottom: 6 }}>Tidak ditemukan</div>
                <div className="t-body c-muted">Coba kategori lain</div>
              </div>
            ) : (
              filtered.map((listing, index) => {
                const disc = Math.round((1 - listing.rescuePrice / listing.originalPrice) * 100);
                return (
                  <Link href={`/food/${listing.id}`} key={listing.id} className="elite-card" style={{ padding: 16, display: "flex", gap: 16, alignItems: "center", animationDelay: `${index * 50}ms` }}>
                    <div style={{ width: 90, height: 90, flexShrink: 0, borderRadius: "var(--radius-lg)", overflow: "hidden", position: "relative" }}>
                      <span className="discount-luxury" style={{ fontSize: 9, padding: "4px 8px", top: 6, left: 6, boxShadow: "none" }}>-{disc}%</span>
                      <img src={listing.imageUrl} alt={listing.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div className="flex-col justify-between" style={{ flex: 1, minWidth: 0, height: 90, padding: "2px 0" }}>
                      <div>
                        <div className="flex items-center justify-between" style={{ gap: 6, marginBottom: 4 }}>
                          <span className="tag" style={{ fontSize: 9, padding: "2px 6px", background: "var(--c-faint)", color: "var(--c-ink)" }}>{listing.category}</span>
                          <CountdownTimer expiresAt={listing.expiresAt} />
                        </div>
                        <h3 className="t-sm c-ink" style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 15 }}>{listing.name}</h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-col">
                          <span className="t-xs c-muted" style={{ textDecoration: "line-through", fontSize: 10, lineHeight: 1, letterSpacing: 0 }}>
                            Rp {listing.originalPrice.toLocaleString("id-ID")}
                          </span>
                          <span className="c-ink" style={{ fontWeight: 800, fontSize: 15, fontFamily: "var(--font-display)", letterSpacing: "-0.5px" }}>
                            Rp {listing.rescuePrice.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {listing.isPickup && <span className="tag tag-green" style={{ fontSize: 9, padding: "2px 6px" }}>Pickup</span>}
                          {listing.isDelivery && <span className="tag tag-yellow" style={{ fontSize: 9, padding: "2px 6px" }}>Delivery</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}
