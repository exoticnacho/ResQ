"use client";
import { useState, useEffect } from "react";
import { CATEGORIES, FoodListing } from "@/lib/seedData";
import { subscribeToListings } from "@/lib/db";
import dynamic from "next/dynamic";
import CountdownTimer from "@/components/CountdownTimer";
import Link from "next/link";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [showMap, setShowMap] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listings, setListings] = useState<FoodListing[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToListings((data) => {
      setListings(data);
    });
    return () => unsubscribe();
  }, []);

  const [sortBy, setSortBy] = useState<"terbaru" | "terdekat">("terbaru");

  const filtered = listings.filter((l) => {
    const cat = category === "Semua" || l.category === category;
    const q = !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.donorName.toLowerCase().includes(search.toLowerCase());
    return cat && q;
  });

  const getDistance = (id: string) => parseFloat((((id.charCodeAt(0) + (id.charCodeAt(1) || 0)) % 40) / 10 + 1.2).toFixed(1));

  if (sortBy === "terdekat") {
    filtered.sort((a, b) => getDistance(a.id) - getDistance(b.id));
  } else {
    filtered.sort((a, b) => a.expiresAt - b.expiresAt);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingBottom: 100, zIndex: 10, position: "relative" }}>
      {/* Header */}
      <header style={{
        padding: "24px 24px 8px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative"
      }}>
        <h1 className="t-h1 c-ink" style={{ margin: 0 }}>Jelajahi</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setShowMap(!showMap)}
            style={{
              background: "var(--c-surface)",
              color: "var(--c-ink)",
              border: "none",
              borderRadius: 24,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              transition: "transform 0.2s var(--ease-fluid)"
            }}
          >
            {showMap ? "List" : "Map"}
          </button>
          <button
            style={{
              background: "var(--c-surface)",
              color: "var(--c-ink)",
              border: "none",
              borderRadius: 99,
              width: 42,
              height: 42,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              transition: "transform 0.2s var(--ease-fluid)"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
        </div>
      </header>


      <main style={{ paddingBottom: 60 }}>
        {/* Search */}
        <div style={{ padding: "12px 24px 12px" }}>
          <div className="elite-glass" style={{ 
            display: "flex", alignItems: "center", gap: 12, 
            padding: "12px 16px", borderRadius: "var(--radius-md)"
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              placeholder="Cari makanan atau restoran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none", outline: "none", background: "transparent",
                width: "100%", fontSize: 14, fontFamily: "var(--font-sans)", fontWeight: 500, color: "var(--c-ink)"
              }}
            />
          </div>
        </div>

        {/* Category chips */}
        <div style={{ 
          display: "flex", gap: 8, padding: "0 24px 16px", 
          overflowX: "auto", width: "100%",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none"
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                flexShrink: 0, padding: "6px 14px", borderRadius: 99,
                fontSize: 12, fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer",
                transition: "all 0.2s var(--ease-fluid)",
                background: category === cat ? "var(--c-ink)" : "var(--c-surface)",
                color: category === cat ? "#fff" : "var(--c-muted)",
                boxShadow: "var(--sh-sm)",
                border: category === cat ? "1px solid var(--c-ink)" : "1px solid var(--c-border)"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Map Viewport with premium borders */}
        <div className="fade-up" style={{ 
          margin: "0 24px 20px", 
          borderRadius: "var(--radius-xl)", 
          overflow: "hidden", 
          boxShadow: "var(--sh-lg), var(--sh-inner-glass)", 
          height: 240,
          border: "1px solid var(--c-border)",
          background: "var(--c-surface)",
          position: "relative",
          display: showMap ? "block" : "none"
        }}>
          <MapView listings={filtered} height={240} selectedId={selectedId || undefined} onMarkerClick={setSelectedId} showMap={showMap} />
          
          {/* Seamless Map-to-Detail Floating Card */}
          {selectedId && (() => {
            const selectedListing = filtered.find(l => l.id === selectedId);
            if (!selectedListing) return null;
            const disc = Math.round((1 - selectedListing.rescuePrice / selectedListing.originalPrice) * 100);
            return (
              <div style={{
                position: "absolute", bottom: 12, left: 12, right: 12, zIndex: 1000,
                animation: "fade-up 0.3s var(--ease-spring) forwards"
              }}>
                <Link href={`/food/${selectedListing.id}`} className="elite-card" style={{ 
                  padding: 12, display: "flex", gap: 12, alignItems: "center",
                  background: "rgba(252, 252, 253, 0.95)", backdropFilter: "blur(20px)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
                }}>
                  <div style={{ width: 60, height: 60, flexShrink: 0, borderRadius: "var(--radius-md)", overflow: "hidden", position: "relative" }}>
                    <span className="discount-luxury" style={{ fontSize: 8, padding: "2px 4px", top: 4, left: 4, boxShadow: "none" }}>-{disc}%</span>
                    <img src={selectedListing.imageUrl} alt={selectedListing.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div className="flex-col justify-between" style={{ flex: 1, minWidth: 0, height: 60, padding: "2px 0" }}>
                    <div>
                      <h3 className="t-sm c-ink" style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 14 }}>{selectedListing.name}</h3>
                      <div className="t-xs c-muted" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, fontSize: 11, textTransform: "none" }}>
                         <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedListing.donorName}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
                      <span className="c-ink" style={{ fontWeight: 800, fontSize: 14, fontFamily: "var(--font-display)", letterSpacing: "-0.5px" }}>
                         Rp {selectedListing.rescuePrice.toLocaleString("id-ID")}
                      </span>
                      <div style={{ transform: "scale(0.85)", transformOrigin: "right center" }}>
                        <CountdownTimer expiresAt={selectedListing.expiresAt} />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })()}
        </div>

        {/* Results Counter and Sort Toggle */}
        <div style={{ padding: "0 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="t-sm c-muted" style={{ fontWeight: 600, fontSize: 12 }}>
            <span style={{ color: "var(--c-ink)" }}>{filtered.length}</span> Hasil
          </span>
          
          {/* Ultra-Clean Compact Sorting Trigger */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="t-sm c-muted" style={{ fontSize: 11, fontWeight: 500 }}>Urutan:</span>
            <span
              onClick={() => setSortBy(sortBy === "terbaru" ? "terdekat" : "terbaru")}
              style={{
                color: "var(--c-ink)",
                cursor: "pointer",
                transition: "opacity 0.2s",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                borderBottom: "1.5px dashed var(--c-muted)",
                paddingBottom: 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 2
              }}
            >
              {sortBy === "terbaru" ? "Terbaru" : "Terdekat"}
            </span>
          </div>
        </div>

        {/* Listings List using Elite Cards */}
        <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 16 }} className="fade-up delay-1">
          {filtered.length === 0 ? (
            <div className="elite-card flex-col items-center justify-center" style={{ padding: 40, textAlign: "center", background: "var(--c-surface-glass)", backdropFilter: "blur(20px)" }}>
              
              <div className="t-h3 c-ink" style={{ marginBottom: 6 }}>Tidak ditemukan</div>
              <div className="t-body c-muted">Coba kata kunci atau filter yang berbeda</div>
            </div>
          ) : (
            filtered.map((l, i) => <ExploreCard key={l.id} listing={l} index={i} sortBy={sortBy} />)
          )}
        </div>
      </main>
    </div>
  );
}

function ExploreCard({ listing, index, sortBy }: { listing: FoodListing; index: number; sortBy?: "terbaru" | "terdekat" }) {
  const disc = Math.round((1 - listing.rescuePrice / listing.originalPrice) * 100);
  const getDistance = (id: string) => parseFloat((((id.charCodeAt(0) + (id.charCodeAt(1) || 0)) % 40) / 10 + 1.2).toFixed(1));
  const distance = getDistance(listing.id);

  return (
    <Link href={`/food/${listing.id}`} className="elite-card" style={{ padding: 16, display: "flex", gap: 16, alignItems: "center", animationDelay: `${index * 50}ms` }}>
      
      {/* Thumbnail */}
      <div style={{ width: 100, height: 100, flexShrink: 0, borderRadius: "var(--radius-lg)", overflow: "hidden", position: "relative" }}>
        <span className="discount-luxury" style={{ fontSize: 9, padding: "4px 8px", top: 8, left: 8, boxShadow: "none" }}>-{disc}%</span>
        <img src={listing.imageUrl} alt={listing.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Content */}
      <div className="flex-col justify-between" style={{ flex: 1, minWidth: 0, height: 100, padding: "2px 0" }}>
        
        <div>
          <div className="flex items-center justify-between" style={{ gap: 6, marginBottom: 6 }}>
            <span className="tag" style={{ fontSize: 9, padding: "2px 8px", background: "var(--c-faint)", color: "var(--c-ink)" }}>{listing.category}</span>
            <CountdownTimer expiresAt={listing.expiresAt} />
          </div>
          <h3 className="t-sm c-ink" style={{ 
            fontWeight: 700, 
            whiteSpace: "nowrap", 
            overflow: "hidden", 
            textOverflow: "ellipsis",
            fontSize: 16
          }}>{listing.name}</h3>
        </div>

        <div>
          <div className="t-xs c-muted" style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8, textTransform: "none", fontSize: 12, letterSpacing: 0 }}>
             <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{listing.donorName}</span>
             {sortBy === "terdekat" && <span style={{ color: "var(--c-brand)", fontWeight: 700 }}>• {distance} km</span>}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-col">
              <span className="t-xs c-muted" style={{ textDecoration: "line-through", fontSize: 10, lineHeight: 1, letterSpacing: 0 }}>
                Rp {listing.originalPrice.toLocaleString("id-ID")}
              </span>
              <span className="c-ink" style={{ fontWeight: 800, fontSize: 16, fontFamily: "var(--font-display)", letterSpacing: "-0.5px" }}>
                Rp {listing.rescuePrice.toLocaleString("id-ID")}
              </span>
            </div>
            
            <div className="flex gap-2">
              {listing.isPickup && <span className="tag tag-green" style={{ fontSize: 9, padding: "2px 6px" }}>Pickup</span>}
              {listing.isDelivery && <span className="tag tag-yellow" style={{ fontSize: 9, padding: "2px 6px" }}>Delivery</span>}
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}
