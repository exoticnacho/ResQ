"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FoodListing } from "@/lib/seedData";
import { subscribeToListings, placeOrder } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import CountdownTimer from "@/components/CountdownTimer";
import React from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

function SlideToPay({ onComplete, isProcessing }: { onComplete: () => void; isProcessing: boolean }) {
  const [slideX, setSlideX] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isProcessing) return;
    setIsSliding(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSliding || !containerRef.current || isProcessing) return;
    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const knobWidth = 52; 
    const maxSlide = containerWidth - knobWidth - 8;
    const rect = containerRef.current.getBoundingClientRect();
    let newX = e.clientX - rect.left - knobWidth / 2;
    if (newX < 0) newX = 0;
    if (newX > maxSlide) newX = maxSlide;
    setSlideX(newX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isSliding || isProcessing) return;
    setIsSliding(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const maxSlide = containerWidth - 52 - 8;
    if (slideX > maxSlide * 0.75) {
      setSlideX(maxSlide);
      onComplete();
    } else {
      setSlideX(0);
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{
        width: "100%", height: 60, background: "var(--c-brand)",
        borderRadius: 99, position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", opacity: isProcessing ? 0.7 : 1,
        boxShadow: "0 8px 24px -6px rgba(217,101,75,0.4), inset 0 1px 1px rgba(255,255,255,0.2)"
      }}
    >
      <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, opacity: Math.max(0, 1 - slideX/100) }}>
        {isProcessing ? "Memproses..." : "Geser untuk Bayar"}
      </span>
      
      {!isProcessing && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            position: "absolute", top: 4, left: 4 + slideX,
            width: 52, height: 52, borderRadius: "50%",
            background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "grab", touchAction: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: isSliding ? "none" : "left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            zIndex: 2
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      )}
    </div>
  );
}

export default function FoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { user } = useAuth();
  
  const [listing, setListing] = useState<FoodListing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  
  const [method, setMethod] = useState<"pickup" | "delivery">("pickup");
  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState<"gopay" | "ovo" | "shopeepay">("gopay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryMargin, setDeliveryMargin] = useState(0);
  const [platformCommission, setPlatformCommission] = useState(0);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, "settings", "platform"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.deliveryMargin !== undefined) {
          setDeliveryMargin(Number(data.deliveryMargin));
        }
        if (data.feePercent !== undefined) {
          setPlatformCommission(Number(data.feePercent));
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToListings((data) => {
      const found = data.find((l) => l.id === unwrappedParams.id);
      if (found) {
        setListing(found);
        if (loadingListing) {
          if (found.isPickup) setMethod("pickup");
          else if (found.isDelivery) setMethod("delivery");
        }
      } else {
        setListing(null);
      }
      setLoadingListing(false);
    });
    return () => unsubscribe();
  }, [unwrappedParams.id]);

  if (loadingListing) return <div className="p-4 t-body text-center" style={{marginTop: 40}}>Memuat hidangan...</div>;
  if (!listing) return <div className="p-4 t-body text-center" style={{marginTop: 40}}>Hidangan tidak ditemukan atau sudah habis.</div>;

  const discount = Math.round((1 - listing.rescuePrice / listing.originalPrice) * 100);

  // Dynamic calculations
  const platformFee = platformCommission;
  // Stable simulated distance in km for this listing (between 1.2 km to 5.2 km)
  const simulatedDistance = parseFloat(
    (((listing.id.charCodeAt(0) + (listing.id.charCodeAt(1) || 0)) % 40) / 10 + 1.2).toFixed(1)
  );
  // Indonesian standard rate: Rp 7.000 for first 2 km, Rp 2.000 per km thereafter + deliveryMargin
  const deliveryFee = method === "delivery"
    ? (simulatedDistance <= 2
        ? 7000
        : 7000 + Math.round((simulatedDistance - 2) * 2000)) + deliveryMargin
    : 0;

  const rescueSubtotal = listing.rescuePrice * quantity;
  const originalSubtotal = listing.originalPrice * quantity;
  const totalCost = rescueSubtotal + platformFee + deliveryFee;
  const totalSaved = originalSubtotal - rescueSubtotal;
  const co2Offset = parseFloat((0.8 * quantity).toFixed(1));

  const handleCheckout = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }
    
    setIsProcessing(true);
    try {
      await placeOrder(
        user.uid, 
        listing.id, 
        quantity, 
        totalCost, 
        listing.name, 
        listing.donorName, 
        totalSaved, 
        co2Offset,
        method === "delivery",
        deliveryFee,
        simulatedDistance,
        Math.floor(Math.random() * 5) + 1 // mock dropoff distance 1-5 km
      );
      router.push(`/checkout-success?id=${listing.id}&qty=${quantity}&save=${totalSaved}&co2=${co2Offset}`);
    } catch (error: any) {
      alert(error.message || "Gagal memproses transaksi");
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: "100%", background: "var(--c-bg)", position: "relative", paddingBottom: 160, zIndex: 10 }}>
      
      {/* ────────────────────────────────────────────────────────
          ELITE HERO IMAGE (Full Bleed with gradient blend)
      ──────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", height: 380, width: "100%" }}>
        <img
          src={listing.imageUrl}
          alt={listing.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Deep, luxurious gradient masking */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, var(--c-bg) 95%, var(--c-bg) 100%)"
        }}/>

        {/* Floating Back Button (Glass) */}
        <button
          onClick={() => router.back()}
          className="elite-icon-btn"
          style={{ position: "absolute", top: 24, left: 24, zIndex: 20 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>

        {/* Floating tags */}
        <div style={{ position: "absolute", bottom: 40, left: 24, right: 24, zIndex: 20 }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
            <span style={{ 
              background: "var(--c-brand)", color: "#fff", padding: "6px 12px", 
              borderRadius: "var(--radius-pill)", fontSize: 11, fontWeight: 800, 
              letterSpacing: "0.5px", boxShadow: "0 4px 12px rgba(217,101,75,0.4)" 
            }}>
              -{discount}% HEMAT
            </span>
            <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)", padding: "6px 12px", borderRadius: "var(--radius-pill)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <CountdownTimer expiresAt={listing.expiresAt} />
            </div>
          </div>
          <h1 className="t-hero c-ink" style={{ fontSize: 32 }}>{listing.name}</h1>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          CONTENT AREA (Elite Typography & Geometry)
      ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: "0 24px",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        position: "relative",
        zIndex: 20,
        marginTop: -10
      }}>
        
        {/* Merchant Info */}
        <div className="elite-glass flex items-center justify-between" style={{ padding: "16px 20px", borderRadius: "var(--radius-xl)" }}>
          <div className="flex items-center gap-4">
            
            <div>
              <div className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15 }}>{listing.donorName}</div>
              <div className="t-xs c-muted" style={{ marginTop: 4, textTransform: "none", fontSize: 12, letterSpacing: 0 }}>{listing.donorAddress}</div>
            </div>
          </div>
        </div>

        {/* 1. TACTILE PORTIONS QUANTITY SELECTOR (Apple Style) */}
        <div>
          <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
            <h3 className="t-h3 c-ink">Porsi Penyelamatan</h3>
            <span className="t-xs c-brand" style={{ background: "var(--c-brand-faint)", padding: "4px 8px", borderRadius: 8 }}>{listing.quantity} Tersisa</span>
          </div>
          <div className="elite-card flex justify-between items-center" style={{ padding: "8px", borderRadius: "var(--radius-pill)" }}>
            <button 
              className="elite-icon-btn"
              onClick={() => quantity > 1 && setQuantity(quantity - 1)}
              style={{ background: "var(--c-surface)", color: "var(--c-ink)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--c-ink)", minWidth: 80, textAlign: "center", fontFamily: "var(--font-display)" }}>
              {quantity}
            </span>
            <button 
              className="elite-icon-btn"
              onClick={() => quantity < listing.quantity && setQuantity(quantity + 1)}
              style={{ background: "var(--c-surface)", color: "var(--c-ink)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </div>

        {/* 2. PICKUP / DELIVERY METHOD SELECTOR */}
        <div>
          <h3 className="t-h3 c-ink" style={{ marginBottom: 12 }}>Metode Pengambilan</h3>
          <div style={{ display: "flex", gap: 12 }}>
            {listing.isPickup && (
              <div 
                onClick={() => setMethod("pickup")}
                className="elite-card"
                style={{ 
                  flex: 1, padding: "16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  borderColor: method === "pickup" ? "var(--c-brand)" : "var(--c-border)",
                  boxShadow: method === "pickup" ? "0 0 0 1px var(--c-brand), var(--sh-sm)" : "var(--sh-sm)"
                }}
              >
                
                <span className="t-sm c-ink" style={{ fontWeight: 700 }}>Ambil Sendiri</span>
              </div>
            )}
            {listing.isDelivery && (
              <div 
                onClick={() => setMethod("delivery")}
                className="elite-card"
                style={{ 
                  flex: 1, padding: "16px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  borderColor: method === "delivery" ? "var(--c-brand)" : "var(--c-border)",
                  boxShadow: method === "delivery" ? "0 0 0 1px var(--c-brand), var(--sh-sm)" : "var(--sh-sm)"
                }}
              >
                
                <span className="t-sm c-ink" style={{ fontWeight: 700 }}>Delivery</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. APPLE WALLET STYLE PAYMENT TILE */}
        <div>
          <h3 className="t-h3 c-ink" style={{ marginBottom: 12 }}>Pembayaran</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(["gopay", "ovo", "shopeepay"] as const).map(p => (
              <div 
                key={p}
                onClick={() => setPayment(p)}
                className="elite-card"
                style={{ 
                  padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderColor: payment === p ? "var(--c-brand)" : "var(--c-border)",
                  background: payment === p ? "var(--c-brand-faint)" : "var(--c-surface)"
                }}
              >
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: 20 }}>{p === 'gopay' ? '' : p === 'ovo' ? '' : ''}</span>
                  <span className="t-sm c-ink" style={{ fontWeight: 700, textTransform: "capitalize", fontSize: 15 }}>{p}</span>
                </div>
                <div style={{ 
                  width: 20, height: 20, borderRadius: "50%", 
                  border: `2px solid ${payment === p ? 'var(--c-brand)' : 'var(--c-muted)'}`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {payment === p && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--c-brand)" }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ────────────────────────────────────────────────────────
          SLEEK INSTANT CHECKOUT SHEET (Pure Glass Apple Style)
      ──────────────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 440, margin: "0 auto",
        padding: "24px 24px 40px",
        background: "rgba(252, 252, 253, 0.85)",
        backdropFilter: "blur(60px) saturate(200%)",
        WebkitBackdropFilter: "blur(60px) saturate(200%)",
        borderTop: "1px solid rgba(255,255,255,0.6)",
        borderRadius: "40px 40px 0 0",
        boxShadow: "0 -20px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        zIndex: 100,
        display: "flex", flexDirection: "column", gap: 20
      }}>
        {/* Notch pill */}
        <div style={{ width: 40, height: 4, background: "var(--c-border)", borderRadius: 99, margin: "0 auto", marginTop: -8 }} />

        {/* Pricing breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 10, borderBottom: "1px dashed var(--c-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--c-muted)" }}>
            <span>Harga Pangan ({quantity}x)</span>
            <span style={{ color: "var(--c-ink)", fontWeight: 600 }}>Rp {rescueSubtotal.toLocaleString('id-ID')}</span>
          </div>
          {method === "delivery" && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--c-muted)" }}>
              <span>Biaya Pengantaran ({simulatedDistance} km)</span>
              <span style={{ color: "var(--c-ink)", fontWeight: 600 }}>Rp {deliveryFee.toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
           <div className="flex-col gap-1">
             <span className="t-xs c-muted" style={{ fontWeight: 600 }}>Total (via {payment.toUpperCase()})</span>
             <span className="c-ink" style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-1px" }}>Rp {totalCost.toLocaleString('id-ID')}</span>
           </div>
           <div style={{ textAlign: "right" }}>
             <span className="t-xs c-brand" style={{ background: "var(--c-brand-faint)", padding: "4px 8px", borderRadius: 8 }}>Hemat Rp {totalSaved.toLocaleString('id-ID')}</span>
           </div>
        </div>
        
        <SlideToPay onComplete={handleCheckout} isProcessing={isProcessing} />
      </div>

    </div>
  );
}
