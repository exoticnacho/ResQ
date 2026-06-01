"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { subscribeToUserOrders, Order } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import confetti from "canvas-confetti";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [completing, setCompleting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const getDeliveryStep = (status?: string) => {
    if (!status || status === 'waiting_courier') return 0;
    if (status === 'en_route_pickup' || status === 'picked_up') return 1;
    if (status === 'en_route_dropoff') return 2;
    if (status === 'delivered') return 3;
    return 0;
  };

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserOrders(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
      
      // Auto-update selected order details if open
      if (selectedOrder) {
        const updated = data.find(o => o.id === selectedOrder.id);
        if (updated) {
          setSelectedOrder(updated);
        }
      }
    });
    return () => unsubscribe();
  }, [user, selectedOrder?.id]);

  const activeOrders = orders.filter(o => o.status === "active" || o.status === "ready");
  const pastOrders = orders.filter(o => o.status !== "active" && o.status !== "ready");

  const handleCompleteOrder = async (orderId: string) => {
    if (!db) return;
    setCompleting(true);
    try {
      const orderRef = doc(db, "orders", orderId);
      await setDoc(orderRef, { status: "completed" }, { merge: true });
      
      // Play celebratory impact confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#D9654B", "#10B981", "#34D399", "#FFFFFF"]
      });

      // Update current selected modal status
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: "completed" } : null);
      }
    } catch (e) {
      alert("Gagal menyelesaikan penyelamatan");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div style={{ padding: "40px 24px", paddingBottom: 100, position: "relative", zIndex: 10 }}>
        
        {/* Style Tag for animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes dash-flow {
            to {
              stroke-dashoffset: -20;
            }
          }
          @keyframes pulse-dot {
            0% { transform: scale(0.95); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 0.8; }
            100% { transform: scale(0.95); opacity: 0.5; }
          }
          .animated-path {
            stroke-dasharray: 8 6;
            animation: dash-flow 1.5s linear infinite;
          }
          .scooter-marker {
            position: absolute;
            width: 44px; height: 44px;
            background: var(--c-ink);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 20px rgba(9,9,11,0.25);
            border: 3px solid #fff;
            z-index: 15;
            motion-path: path('M 50 65 Q 120 65 150 110 T 260 145');
            offset-path: path('M 50 65 Q 120 65 150 110 T 260 145');
            animation: move-scooter 8s ease-in-out infinite alternate;
          }
          @keyframes move-scooter {
            0% {
              offset-distance: 0%;
            }
            100% {
              offset-distance: 100%;
            }
          }
          .pulse-indicator {
            position: absolute;
            width: 100%; height: 100%;
            border-radius: 50%;
            background: var(--c-brand-faint);
            animation: pulse-dot 2s infinite ease-in-out;
            z-index: 1;
          }
          .sheet-backdrop {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(8px);
            z-index: 200;
            opacity: 0; pointer-events: none;
            transition: opacity 0.4s var(--ease-fluid);
          }
          .sheet-backdrop.open {
            opacity: 1; pointer-events: all;
          }
          .sheet-panel {
            position: fixed; bottom: 0; left: 0; right: 0;
            max-width: 440px; margin: 0 auto;
            background: rgba(252, 252, 253, 0.96);
            backdrop-filter: blur(40px) saturate(180%);
            -webkit-backdrop-filter: blur(40px) saturate(180%);
            border-radius: 40px 40px 0 0;
            border-top: 1px solid rgba(255,255,255,0.7);
            box-shadow: 0 -15px 40px rgba(0,0,0,0.1);
            transform: translateY(100%);
            transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 201;
            padding: 32px 24px 110px;
            display: flex; 
            flex-direction: column; 
            gap: 24px;
          }
          .sheet-panel.open {
            transform: translateY(0);
          }
          @keyframes move-scooter {
            0% {
              offset-distance: 0%;
            }
            100% {
              offset-distance: 100%;
            }
          }
        `}} />

        {/* Header (No duplicate profile to prevent overlap) */}
        <header className="flex items-center justify-between" style={{ marginBottom: 28 }}>
          <h1 className="t-h1 c-ink">Pesanan</h1>
        </header>

        {loading ? (
          <div className="t-body c-muted" style={{ textAlign: "center", marginTop: 40 }}>Memuat pesanan...</div>
        ) : activeOrders.length > 0 ? (
          <div className="flex-col gap-6">
            {activeOrders.map(activeOrder => (
            <section key={activeOrder.id} style={{ marginBottom: 28 }} className="fade-up">
              <div 
                className="elite-card" 
                onClick={() => setSelectedOrder(activeOrder)}
                style={{ 
                  padding: 0, 
                  background: "var(--c-surface)",
                  cursor: "pointer",
                  overflow: "hidden"
                }}
              >
                {/* Simulated Map Background */}
                <div style={{ height: 210, background: "#F1F5F9", position: "relative" }}>
                  <div style={{
                    position: "absolute", inset: 0, opacity: 0.25,
                    backgroundImage: "linear-gradient(#94A3B8 1px, transparent 1px), linear-gradient(90deg, #94A3B8 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                  }}/>
                  
                  {/* Map routes (Visual) */}
                  <div style={{ position: "absolute", top: "40%", left: 0, right: 0, height: 12, background: "rgba(255,255,255,0.7)", zIndex: 1 }} />
                  <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 12, background: "rgba(255,255,255,0.7)", zIndex: 1 }} />
                  
                  {/* Glowing dynamic path */}
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2 }}>
                    <path d="M 50 65 Q 120 65 150 110 T 260 145" fill="none" stroke="var(--c-brand)" strokeWidth="4.5" className="animated-path" />
                  </svg>
 
                  {/* Merchant Marker (Glows & Pulses) */}
                  <div style={{
                    position: "absolute", top: 40, left: 24,
                    zIndex: 10
                  }}>
                    <div style={{
                      background: "#fff", padding: "4px 10px", borderRadius: 12,
                      boxShadow: "var(--sh-md)", display: "flex", gap: 6, alignItems: "center",
                      transform: "rotate(-3deg)", border: "1px solid var(--c-border)", position: "relative", zIndex: 2
                    }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--c-brand)" }}></div>
                      <span className="t-xs c-ink" style={{ fontSize: 10, fontWeight: 800 }}>{activeOrder.donorName}</span>
                    </div>
                  </div>

                  {/* Dynamic Scooter (Animates smoothly along curved route path) */}
                  <div className="scooter-marker">
                    <span style={{ fontSize: 22, lineHeight: 1 }}>🛵</span>
                  </div>

                  {/* User Marker (Pulses with Apple-style blue ring) */}
                  <div style={{
                    position: "absolute", top: 125, left: 245,
                    zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    width: 46, height: 46
                  }}>
                    <div className="pulse-indicator" style={{ background: "rgba(14, 165, 233, 0.3)" }} />
                    <div style={{
                      background: "#fff", padding: 6, borderRadius: "50%",
                      boxShadow: "var(--sh-md)", transform: "rotate(6deg)", border: "2px solid #fff", position: "relative", zIndex: 2
                    }}>
                      <img src={user?.photoURL || "https://i.pravatar.cc/150?img=32"} style={{ width: 32, height: 32, borderRadius: "50%" }} />
                    </div>
                  </div>
                </div>

                <div style={{ padding: "24px 24px" }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <span className="t-xs c-muted" style={{ fontSize: 11 }}>ID: #{activeOrder.id?.slice(0,6).toUpperCase()}</span>
                    <div className="flex gap-2">
                      <span className="tag" style={{ background: "var(--c-faint)", color: "var(--c-ink)", border: "1px solid var(--c-border)", padding: "4px 8px", fontSize: 10 }}>
                        {activeOrder.isDelivery ? 'Delivery' : 'Ambil di Tempat'}
                      </span>
                      <span className={`tag ${activeOrder.status === 'ready' ? 'tag-green' : 'tag-yellow'}`} style={{ padding: "4px 8px", fontSize: 10 }}>
                        {activeOrder.status === 'ready' ? 'Siap Diambil' : 'Sedang Diproses'}
                      </span>
                    </div>
                  </div>
                  <h3 className="t-h3 c-ink" style={{ fontWeight: 800, fontSize: 18 }}>{activeOrder.foodName}</h3>
                  <div className="t-sm c-muted" style={{ marginTop: 2, fontSize: 14 }}>
                    dari <strong>{activeOrder.donorName}</strong>
                  </div>
                </div>

                {/* Progress Steps (Dynamic based on Delivery/Pickup) */}
                <div style={{ position: "relative", marginLeft: 12 }}>
                  {activeOrder.isDelivery ? (() => {
                    const step = getDeliveryStep(activeOrder.deliveryStatus);
                    return (
                      <>
                        <div style={{ position: "absolute", top: 12, bottom: 20, left: 11, width: 2, background: "var(--c-border)", zIndex: 0 }} />
                        <div style={{ position: "absolute", top: 12, left: 11, width: 2, background: "var(--c-brand)", zIndex: 1, height: `${step * 33}%`, transition: "height 0.5s ease" }} />
                        
                        <div style={{ display: "flex", gap: 16, marginBottom: 24, position: "relative", zIndex: 2 }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--c-brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}></div>
                          <div>
                            <h4 className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Pesanan Disiapkan</h4>
                            <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 2, fontSize: 12 }}>Restoran sedang menyiapkan makananmu.</p>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 16, marginBottom: 24, position: "relative", zIndex: 2 }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: step >= 1 ? "var(--c-brand)" : "var(--c-surface)", color: step >= 1 ? "#fff" : "var(--c-muted)", border: step >= 1 ? "none" : "2px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {step >= 1 && ""}
                          </div>
                          <div style={{ opacity: step >= 1 ? 1 : 0.6 }}>
                            <h4 className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Kurir Menjemput</h4>
                            <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 2, fontSize: 12 }}>Kurir sedang menuju ke restoran.</p>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 16, marginBottom: 24, position: "relative", zIndex: 2 }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: step >= 2 ? "var(--c-brand)" : "var(--c-surface)", color: step >= 2 ? "#fff" : "var(--c-muted)", border: step >= 2 ? "none" : "2px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {step >= 2 && ""}
                          </div>
                          <div style={{ opacity: step >= 2 ? 1 : 0.6 }}>
                            <h4 className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Makanan Diantar</h4>
                            <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 2, fontSize: 12 }}>Kurir sedang menuju ke lokasimu.</p>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 16, position: "relative", zIndex: 2 }}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", background: step >= 3 ? "var(--c-brand)" : "var(--c-surface)", color: step >= 3 ? "#fff" : "var(--c-muted)", border: step >= 3 ? "none" : "2px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {step >= 3 && ""}
                          </div>
                          <div style={{ opacity: step >= 3 ? 1 : 0.6 }}>
                            <h4 className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Tiba di Tujuan</h4>
                            <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 2, fontSize: 12 }}>Makanan telah berhasil diantar!</p>
                          </div>
                        </div>
                      </>
                    );
                  })() : (
                    <>
                      <div style={{ position: "absolute", top: 12, bottom: 20, left: 11, width: 2, background: "var(--c-border)", zIndex: 0 }} />
                      <div style={{ position: "absolute", top: 12, left: 11, width: 2, background: "var(--c-brand)", zIndex: 1, height: activeOrder.status === 'ready' ? '50%' : '10%', transition: "height 0.5s ease" }} />

                      <div style={{ display: "flex", gap: 16, marginBottom: 24, position: "relative", zIndex: 2 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--c-brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}></div>
                        <div>
                          <h4 className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Pesanan Dibuat</h4>
                          <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 2, fontSize: 12 }}>Toko sedang menyiapkan pesananmu.</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 16, marginBottom: 24, position: "relative", zIndex: 2 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: activeOrder.status === 'ready' ? "var(--c-brand)" : "var(--c-surface)", color: activeOrder.status === 'ready' ? "#fff" : "var(--c-muted)", border: activeOrder.status === 'ready' ? "none" : "2px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s ease" }}>
                          {activeOrder.status === 'ready' && ""}
                        </div>
                        <div style={{ opacity: activeOrder.status === 'ready' ? 1 : 0.6 }}>
                          <h4 className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Siap Diambil</h4>
                          <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 2, fontSize: 12 }}>Silakan ambil di lokasi sebelum waktu habis.</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 16, position: "relative", zIndex: 2 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--c-surface)", border: "2px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} />
                        <div style={{ opacity: 0.6 }}>
                          <h4 className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Selesai</h4>
                          <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 2, fontSize: 12 }}>Makanan berhasil diselamatkan!</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ padding: "0 24px 24px", marginTop: 16 }}>
                  {activeOrder.isDelivery && activeOrder.deliveryStatus !== "delivered" && activeOrder.deliveryStatus !== "waiting_courier" && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsChatOpen(true); }}
                      className="elite-btn-primary" 
                      style={{ width: "100%", marginBottom: 16, background: "var(--c-ink)", color: "#fff", display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}
                    >
                      Chat Kurir
                    </button>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="t-xs c-muted" style={{ textTransform: "none", fontSize: 12 }}>Ketuk untuk lihat panduan detail</span>
                    <span className="t-xs c-brand" style={{ fontWeight: 700, fontSize: 13 }}>Rincian </span>
                  </div>
                </div>
              </div>
            </section>
            ))}
          </div>
        ) : (
          <div className="t-body c-muted" style={{ textAlign: "center", marginTop: 40, marginBottom: 40 }}>Tidak ada pesanan aktif saat ini.</div>
        )}

        {/* Riwayat Pesanan */}
        {pastOrders.length > 0 && (
          <>
            <h3 className="t-h3 c-ink" style={{ marginBottom: 16 }}>Riwayat Penyelamatan</h3>
            <div className="flex-col gap-4">
              {pastOrders.map(order => (
                <div 
                  key={order.id} 
                  className="elite-card card-interactive fade-up delay-2" 
                  onClick={() => setSelectedOrder(order)}
                  style={{ padding: "16px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t-sm c-ink" style={{ fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.foodName}</div>
                    <div className="t-xs c-muted" style={{ marginTop: 4, textTransform: "none", fontSize: 12, letterSpacing: 0 }}>
                      Selesai diselamatkan dari {order.donorName}
                    </div>
                  </div>
                  <div className="elite-icon-btn" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--c-faint)", border: "none", boxShadow: "none" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────
          APPLE-STYLE BOTTOM DETAIL SHEET
      ──────────────────────────────────────────────────────── */}
      <div 
        className={`sheet-backdrop ${selectedOrder ? "open" : ""}`}
        onClick={() => setSelectedOrder(null)}
      >
        <div 
          className={`sheet-panel ${selectedOrder ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Notch Line */}
          <div style={{ width: 40, height: 4, background: "var(--c-border)", borderRadius: 99, margin: "0 auto", marginTop: -16 }} />

          {selectedOrder && (
            <>
              {/* Header inside sheet */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="t-xs c-muted" style={{ letterSpacing: "1px" }}>RINCIAN PENYELAMATAN</span>
                  <h2 className="t-h2 c-ink" style={{ marginTop: 4, fontSize: 24 }}>{selectedOrder.foodName}</h2>
                </div>
                <span className={`tag ${selectedOrder.status === 'active' ? 'tag-yellow' : 'tag-green'}`} style={{ fontSize: 11, padding: "6px 12px" }}>
                  {selectedOrder.status === 'active' ? 'Sedang Diproses' : 'Selesai'}
                </span>
              </div>

              {/* Status Tracking Step Progress */}
              <div style={{ background: "var(--c-faint)", padding: 20, borderRadius: "var(--radius-xl)" }}>
                <h4 className="t-xs c-ink" style={{ fontWeight: 800, marginBottom: 14 }}>STATUS KEMAJUAN</h4>
                <div className="flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--c-brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}></div>
                    <span className="t-sm c-ink" style={{ fontWeight: 700 }}>Pesanan Dibuat</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--c-brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}></div>
                    <span className="t-sm c-ink" style={{ fontWeight: 700 }}>Pembayaran Dikonfirmasi</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div style={{ 
                      width: 22, height: 22, borderRadius: "50%", 
                      background: selectedOrder.status === 'completed' ? 'var(--c-brand)' : '#E2E8F0', 
                      color: selectedOrder.status === 'completed' ? '#fff' : 'var(--c-muted)',
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 
                    }}>
                      {selectedOrder.status === 'completed' ? '' : '3'}
                    </div>
                    <span className={`t-sm ${selectedOrder.status === 'completed' ? 'c-ink font-bold' : 'c-muted'}`} style={{ fontWeight: selectedOrder.status === 'completed' ? 700 : 500 }}>
                      {selectedOrder.status === 'completed' ? 'Penyelamatan Sukses' : 'Siap Diambil'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Store & Pickup Info */}
              <div className="flex-col gap-2">
                <h4 className="t-xs c-muted" style={{ letterSpacing: "1.5px" }}>LOKASI & CARA AMBIL</h4>
                <div className="elite-card flex-col gap-2" style={{ padding: 16 }}>
                  <div className="t-sm c-ink" style={{ fontWeight: 700 }}>{selectedOrder.donorName}</div>
                  <p className="t-xs c-muted" style={{ textTransform: "none", fontSize: 12, lineHeight: 1.4 }}>
                    Silakan datang ke toko, tunjukkan ID Pesanan <strong>#{selectedOrder.id?.slice(0, 6).toUpperCase()}</strong> kepada staf di kasir untuk mengambil makanan Anda.
                  </p>
                </div>
              </div>

              {/* Receipt Summary */}
              <div className="flex-col gap-2">
                <h4 className="t-xs c-muted" style={{ letterSpacing: "1.5px" }}>RANGKUMAN BIAYA</h4>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="t-sm c-muted">{selectedOrder.quantity}x {selectedOrder.foodName}</span>
                  <span className="t-sm c-ink" style={{ fontWeight: 700 }}>Rp {selectedOrder.totalPrice.toLocaleString("id-ID")}</span>
                </div>
                <div style={{ width: "100%", height: 1, background: "var(--c-border)", margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="t-sm c-brand" style={{ fontWeight: 700 }}>Total Hemat</span>
                  <span className="t-sm c-brand" style={{ fontWeight: 800 }}>Klaim Poin Aktivitas</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex-col gap-3" style={{ marginTop: 8 }}>
                {(selectedOrder.status === "active" || selectedOrder.status === "ready") && selectedOrder.isDelivery && (
                  <div style={{ 
                    textAlign: "center", 
                    padding: "14px 20px", 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: "var(--c-brand)",
                    background: "var(--c-brand-faint)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid rgba(217, 101, 75, 0.2)"
                  }}>
                    🛵 Kurir sedang mengantar makanan Anda. Pesanan akan otomatis diselesaikan setelah tiba!
                  </div>
                )}
                {(selectedOrder.status === "active" || selectedOrder.status === "ready") && !selectedOrder.isDelivery && (
                  <button
                    onClick={() => handleCompleteOrder(selectedOrder.id!)}
                    disabled={completing}
                    className="elite-btn-primary"
                    style={{ width: "100%", display: "flex", justifyContent: "center" }}
                  >
                    {completing ? "Memproses..." : "Selesaikan Penyelamatan & Klaim Dampak"}
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    padding: "16px",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--c-faint)",
                    color: "var(--c-ink)",
                    fontWeight: 700,
                    fontSize: 15,
                    border: "1px solid var(--c-border)",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  Tutup Rincian
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          APPLE-STYLE QUICK CHAT SHEET
      ──────────────────────────────────────────────────────── */}
      <div 
        className={`sheet-backdrop ${isChatOpen ? "open" : ""}`}
        onClick={() => setIsChatOpen(false)}
        style={{ zIndex: 300 }}
      >
        <div 
          className={`sheet-panel ${isChatOpen ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
          style={{ zIndex: 301, paddingBottom: 40 }}
        >
          <div style={{ width: 40, height: 4, background: "var(--c-border)", borderRadius: 99, margin: "0 auto", marginTop: -16 }} />
          
          <div className="flex justify-between items-center mb-2">
            <h2 className="t-h2 c-ink" style={{ fontSize: 20 }}>Chat dengan Kurir</h2>
            <button onClick={() => setIsChatOpen(false)} style={{ background: "none", border: "none", fontSize: 20, color: "var(--c-muted)", cursor: "pointer" }}></button>
          </div>

          <div style={{ background: "var(--c-surface)", padding: 16, borderRadius: "var(--radius-lg)", minHeight: 180, display: "flex", flexDirection: "column", gap: 12 }}>
             {/* Simulated chat messages */}
             <div style={{ alignSelf: "flex-start", background: "var(--c-faint)", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", fontSize: 14 }}>
               Halo! Pesanan sedang saya ambil.
             </div>
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, margin: "0 -24px", paddingLeft: 24, paddingRight: 24 }} className="scroll-area mt-2">
            {["Tolong titip satpam", "Saya sudah di lobby", "Oke, terima kasih!"].map(msg => (
              <button 
                key={msg}
                onClick={() => {
                   alert("Pesan terkirim (Simulasi): " + msg);
                   setIsChatOpen(false);
                }}
                style={{ 
                  flexShrink: 0, padding: "8px 16px", borderRadius: 99, 
                  background: "var(--c-brand-faint)", color: "var(--c-brand)", 
                  border: "1px solid var(--c-brand)", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s"
                }}
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

