"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Order, subscribeToAvailableDeliveries, subscribeToMyDeliveries, updateDeliveryStatus, takeDeliveryOrder, cancelDeliveryOrder } from "@/lib/db";

export default function CourierDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  
  const [availableJobs, setAvailableJobs] = useState<Order[]>([]);
  const [myJobs, setMyJobs] = useState<Order[]>([]);
  
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Calculate earnings from all completed jobs
  const [todayEarnings, setTodayEarnings] = useState(0);

  useEffect(() => {
    if (!isOnline) return;
    
    const unsubAvailable = subscribeToAvailableDeliveries((orders) => {
      setAvailableJobs(orders);
    });
    
    return () => unsubAvailable();
  }, [isOnline]);

  useEffect(() => {
    if (!user) return;
    const unsubMy = subscribeToMyDeliveries(user.uid, (orders) => {
      const activeJobs = orders.filter(o => o.status === "active" || o.status === "ready");
      setMyJobs(activeJobs);
      
      const completedJobs = orders.filter(o => o.status === "completed" && o.deliveryStatus === "delivered");
      
      // Calculate earnings from my jobs that are delivered/completed
      const earnings = completedJobs.reduce((sum, job) => sum + (job.deliveryFee || 15000), 0);
      setTodayEarnings(earnings);
    });
    
    return () => unsubMy();
  }, [user]);

  const handleTakeOrder = async (orderId: string) => {
    if (!user) return;
    try {
      await takeDeliveryOrder(orderId, user.uid);
    } catch (e: any) {
      alert("Gagal mengambil pesanan: " + e.message);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!user) return;
    if (confirm("Apakah Anda yakin ingin membatalkan pesanan ini? Pesanan akan dikembalikan ke daftar pencarian kurir.")) {
      try {
        await cancelDeliveryOrder(orderId, user.uid);
      } catch (e: any) {
        alert("Gagal membatalkan pesanan: " + e.message);
      }
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: "picked_up" | "en_route_dropoff" | "delivered") => {
    try {
      await updateDeliveryStatus(orderId, nextStatus);
    } catch (e: any) {
      alert("Gagal memperbarui status: " + e.message);
    }
  };

  const activeJob = myJobs.length > 0 ? myJobs[0] : null;

  return (
    <ProtectedRoute>
      <div style={{ padding: "90px 24px 120px", position: "relative" }}>
        <style dangerouslySetInnerHTML={{ __html: `
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
            border-radius: 40px 40px 0 0;
            border-top: 1px solid rgba(255,255,255,0.7);
            box-shadow: 0 -15px 40px rgba(0,0,0,0.1);
            transform: translateY(100%);
            transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 201;
            padding: 32px 24px 110px;
          }
          .sheet-panel.open {
            transform: translateY(0);
          }
        `}} />
        
        {/* Header & Status Toggle */}
        <section style={{ marginBottom: 32 }}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="t-h1 c-ink" style={{ fontSize: 28, letterSpacing: "-0.5px" }}>
                Halo, {user?.displayName?.split(" ")[0] || "Kurir"}!
              </h1>
              <p className="t-body c-muted" style={{ marginTop: 2 }}>
                {isOnline ? "Mencari pesanan di sekitarmu..." : "Aktifkan status untuk mulai."}
              </p>
            </div>
            
            {/* Online Toggle */}
            <div 
              onClick={() => setIsOnline(!isOnline)}
              style={{
                width: 64, height: 34, borderRadius: 34,
                background: isOnline ? "var(--c-brand)" : "var(--c-border)",
                position: "relative", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isOnline ? "0 4px 14px rgba(217,101,75,0.4)" : "inset 0 2px 4px rgba(0,0,0,0.05)"
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3, left: isOnline ? 33 : 3,
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
              }} />
            </div>
          </div>

          {/* Earnings Card */}
          <div className="elite-glass" style={{ 
            padding: 24, 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            borderRadius: "var(--radius-xl)"
          }}>
            <div>
              <div className="t-xs" style={{ color: "var(--c-brand)", fontWeight: 800, letterSpacing: "1px" }}>PENDAPATAN HARI INI</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--c-ink)", marginTop: 4, letterSpacing: "-0.5px" }}>
                Rp {todayEarnings.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: 20, background: "var(--c-brand-faint)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "inset 0 2px 8px rgba(255,255,255,0.6)"
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3" ry="3"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
          </div>
        </section>

        {/* Content Area */}
        {!isOnline ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }} className="fade-up">
            <div style={{
              width: 100, height: 100, borderRadius: "50%", background: "var(--c-surface)",
              margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h20"/>
                <path d="M12 2v20"/>
              </svg>
            </div>
            <h3 className="t-h3 c-ink" style={{ marginBottom: 8 }}>Anda Sedang Offline</h3>
            <p className="t-sm c-muted">Nyalakan toggle di atas untuk mulai menerima dan mengantar pesanan makanan sisa.</p>
          </div>
        ) : activeJob && activeJob.id ? (
          <div className="fade-up">
            <h3 className="t-h3 c-ink" style={{ marginBottom: 16 }}>Status Pengantaran</h3>
            <div className="elite-card" style={{ padding: 24, border: "2px solid var(--c-brand)", boxShadow: "0 12px 32px rgba(217,101,75,0.15)" }}>
              
              <div style={{ position: "relative", marginLeft: 16 }}>
                {/* Tracker Track Background */}
                <div style={{ position: "absolute", top: 14, bottom: 20, left: 13, width: 3, background: "var(--c-border)", borderRadius: 4, zIndex: 0 }} />
                {/* Tracker Track Foreground (Dynamic) */}
                <div style={{ position: "absolute", top: 14, left: 13, width: 3, background: "var(--c-brand)", borderRadius: 4, zIndex: 1, 
                  height: activeJob.deliveryStatus === 'en_route_pickup' ? '15%' : activeJob.deliveryStatus === 'picked_up' ? '50%' : '100%', 
                  transition: "height 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }} />

                {/* Step 1: Menuju Restoran */}
                <div style={{ display: "flex", gap: 20, marginBottom: 32, position: "relative", zIndex: 2 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--c-brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 0 6px var(--c-surface)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ width: "100%", marginTop: 2 }}>
                    <h4 className="t-sm c-ink" style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Menuju Restoran</h4>
                    <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 4, fontSize: 13 }}>Jemput {activeJob.quantity}x {activeJob.foodName} di <strong className="c-ink">{activeJob.donorName}</strong></p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, marginBottom: 8 }}>
                      <span style={{ 
                        display: "inline-block", width: 6, height: 6, borderRadius: "50%", 
                        background: activeJob.status === "ready" ? "#10B981" : "#F59E0B"
                      }} />
                      <span className="t-xs" style={{ 
                        fontWeight: 700, 
                        color: activeJob.status === "ready" ? "#10B981" : "#F59E0B",
                        fontSize: 12
                      }}>
                        {activeJob.status === "ready" ? "Toko: Makanan Siap Diambil" : "Toko: Sedang Menyiapkan Makanan..."}
                      </span>
                    </div>
                    {activeJob.deliveryStatus === "en_route_pickup" && (
                      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                        <button onClick={() => handleCancelOrder(activeJob.id!)} className="elite-btn-secondary" style={{ flex: 1, padding: "12px", fontSize: 14, background: "var(--c-surface)", color: "#EF4444", border: "1px solid var(--c-border)", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: 700 }}>
                          Batal
                        </button>
                        <button onClick={() => handleUpdateStatus(activeJob.id!, "picked_up")} className="elite-btn-primary" style={{ flex: 2, padding: "12px", fontSize: 14, boxShadow: "0 8px 16px rgba(217,101,75,0.2)" }}>
                          Konfirmasi Tiba
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Pesanan Diambil */}
                <div style={{ display: "flex", gap: 20, marginBottom: 32, position: "relative", zIndex: 2 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: (activeJob.deliveryStatus === 'picked_up' || activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') ? "var(--c-brand)" : "var(--c-surface)", color: "#fff", border: (activeJob.deliveryStatus === 'picked_up' || activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') ? "none" : "3px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 0 6px var(--c-surface)", transition: "all 0.3s" }}>
                    {(activeJob.deliveryStatus === 'picked_up' || activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                  <div style={{ opacity: (activeJob.deliveryStatus === 'picked_up' || activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') ? 1 : 0.4, transition: "opacity 0.3s", width: "100%", marginTop: 2 }}>
                    <h4 className="t-sm c-ink" style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Pesanan Diambil</h4>
                    <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 4, fontSize: 13 }}>Pastikan pesanan sesuai sebelum berangkat.</p>
                    {activeJob.deliveryStatus === "picked_up" && (
                      activeJob.status === "ready" ? (
                        <button onClick={() => handleUpdateStatus(activeJob.id!, "en_route_dropoff")} className="elite-btn-primary" style={{ width: "100%", marginTop: 14, padding: "12px", fontSize: 14, boxShadow: "0 8px 16px rgba(217,101,75,0.2)" }}>
                          Mulai Pengantaran
                        </button>
                      ) : (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ 
                            padding: "10px 14px", 
                            background: "var(--c-brand-faint)", 
                            border: "1px solid rgba(217, 101, 75, 0.2)", 
                            borderRadius: "var(--radius-lg)", 
                            color: "var(--c-brand)", 
                            fontSize: 12, 
                            fontWeight: 700, 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 8 
                          }}>
                            <span style={{ 
                              display: "inline-block", 
                              width: 8, 
                              height: 8, 
                              borderRadius: "50%", 
                              background: "var(--c-brand)",
                              animation: "pulse-dot 2.5s infinite ease-in-out"
                            }} />
                            Toko belum menandai siap diambil. Tunggu hingga toko siap.
                          </div>
                          <button 
                            disabled 
                            className="elite-btn-primary" 
                            style={{ 
                              width: "100%", 
                              marginTop: 10, 
                              padding: "12px", 
                              fontSize: 14, 
                              background: "var(--c-muted)", 
                              color: "var(--c-border)", 
                              cursor: "not-allowed",
                              opacity: 0.6,
                              boxShadow: "none"
                            }}
                          >
                            Menunggu Makanan Siap...
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Step 3: Menuju Lokasi Pengantaran */}
                <div style={{ display: "flex", gap: 20, position: "relative", zIndex: 2 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: (activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') ? "var(--c-brand)" : "var(--c-surface)", color: "#fff", border: (activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') ? "none" : "3px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 0 6px var(--c-surface)", transition: "all 0.3s" }}>
                    {(activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                  <div style={{ opacity: (activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') ? 1 : 0.4, transition: "opacity 0.3s", width: "100%", marginTop: 2 }}>
                    <h4 className="t-sm c-ink" style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Menuju Lokasi</h4>
                    <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 4, fontSize: 13 }}>Antar ke lokasi pelanggan berjarak {activeJob.dropoffDistance} km.</p>
                    {activeJob.deliveryStatus === "en_route_dropoff" && (
                      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                        <button onClick={() => setIsChatOpen(true)} className="elite-btn-secondary" style={{ flex: 1, padding: "12px", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--c-surface)", color: "var(--c-ink)" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Chat
                        </button>
                        <button onClick={() => setIsPhotoModalOpen(true)} className="elite-btn-primary" style={{ flex: 2, padding: "12px", fontSize: 14, boxShadow: "0 8px 16px rgba(217,101,75,0.2)" }}>
                          Selesaikan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fade-up">
            <h3 className="t-h3 c-ink" style={{ marginBottom: 16 }}>Pesanan Tersedia</h3>
            {availableJobs.length === 0 ? (
              <p className="t-sm c-muted">Tidak ada pesanan pengantaran saat ini.</p>
            ) : (
              <div className="flex-col gap-4">
                {availableJobs.map(job => (
                  <div key={job.id} className="elite-card flex-col" style={{ padding: 20, gap: 16 }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="t-sm c-ink" style={{ fontWeight: 800, fontSize: 16 }}>{job.donorName}</div>
                        <div className="t-xs c-muted" style={{ marginTop: 2 }}>{job.quantity}x {job.foodName}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="t-sm" style={{ color: "#10B981", fontWeight: 800, fontSize: 16 }}>
                          Rp {(job.deliveryFee || 15000).toLocaleString('id-ID')}
                        </div>
                        <div className="t-xs c-muted" style={{ marginTop: 2 }}>Pendapatan</div>
                      </div>
                    </div>
                    
                    <div style={{ background: "var(--cream-card)", border: "1px solid var(--cream-dark)", padding: "14px 16px", borderRadius: "var(--radius-lg)", display: "flex", gap: 16 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4, paddingBottom: 4 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2.5px solid var(--c-brand)", background: "var(--cream-card)" }} />
                        <div style={{ width: 2, flex: 1, background: "var(--c-border)", margin: "4px 0" }} />
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, gap: 12 }}>
                        <div>
                          <div className="t-xs c-muted" style={{ fontSize: 11, marginBottom: 2 }}>JEMPUT</div>
                          <div className="t-sm c-ink" style={{ fontWeight: 700 }}>{job.pickupDistance || 1.2} km</div>
                        </div>
                        <div>
                          <div className="t-xs c-muted" style={{ fontSize: 11, marginBottom: 2 }}>ANTAR KONSUMEN</div>
                          <div className="t-sm c-ink" style={{ fontWeight: 700 }}>{job.dropoffDistance || 3.5} km</div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleTakeOrder(job.id!)}
                      className="elite-btn-primary" 
                      style={{ width: "100%" }}
                    >
                      Ambil Pesanan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────
          PHOTO PROOF MODAL
      ──────────────────────────────────────────────────────── */}
      {isPhotoModalOpen && activeJob && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "flex-end", backdropFilter: "blur(6px)",
          transition: "opacity 0.3s"
        }}>
          <div style={{
            background: "var(--c-bg)", width: "100%", padding: "24px 24px 40px",
            borderRadius: "40px 40px 0 0", animation: "fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.1)"
          }}>
            <div style={{ width: 48, height: 5, background: "var(--c-border)", borderRadius: 99, margin: "0 auto", marginBottom: 24 }} />
            <h2 className="t-h2 c-ink" style={{ fontSize: 22, marginBottom: 8 }}>Bukti Pengantaran</h2>
            <p className="t-sm c-muted" style={{ marginBottom: 24, textTransform: "none" }}>Ambil foto makanan di lokasi tujuan sebagai bukti konfirmasi pengantaran.</p>
            
            <div style={{
              width: "100%", height: 220, background: "var(--cream-card)", borderRadius: "var(--radius-xl)",
              border: "2px dashed rgba(217,101,75,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 14, marginBottom: 32, cursor: "pointer", transition: "all 0.2s"
            }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--c-brand-faint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              <span className="t-sm c-brand" style={{ fontWeight: 800 }}>Ketuk untuk Buka Kamera</span>
            </div>

            <button 
              className="elite-btn-primary" style={{ width: "100%", padding: "16px", fontSize: 16, display: "flex", justifyContent: "center", boxShadow: "0 10px 25px rgba(217,101,75,0.25)" }}
              disabled={isUploading}
              onClick={() => {
                setIsUploading(true);
                setTimeout(() => {
                  handleUpdateStatus(activeJob.id!, "delivered");
                  setIsUploading(false);
                  setIsPhotoModalOpen(false);
                }, 1500);
              }}
            >
              {isUploading ? "Mengunggah Bukti..." : "Unggah & Selesaikan"}
            </button>
            <button 
              onClick={() => setIsPhotoModalOpen(false)}
              style={{ width: "100%", padding: 16, marginTop: 12, background: "transparent", border: "none", color: "var(--c-muted)", fontWeight: 800, cursor: "pointer" }}
            >
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
          QUICK CHAT SHEET
      ──────────────────────────────────────────────────────── */}
      <div 
        className={`sheet-backdrop ${isChatOpen ? "open" : ""}`}
        onClick={() => setIsChatOpen(false)}
      >
        <div 
          className={`sheet-panel ${isChatOpen ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ width: 48, height: 5, background: "var(--c-border)", borderRadius: 99, margin: "0 auto", marginTop: -16, marginBottom: 24 }} />
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="t-h2 c-ink" style={{ fontSize: 22 }}>Chat Pemesan</h2>
            <button onClick={() => setIsChatOpen(false)} style={{ background: "var(--c-surface)", border: "none", color: "var(--c-ink)", cursor: "pointer", display: "flex", width: 36, height: 36, borderRadius: "50%", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", padding: 20, borderRadius: "var(--radius-xl)", minHeight: 220, display: "flex", flexDirection: "column", gap: 12 }}>
             {/* Simulated chat messages */}
             <div style={{ alignSelf: "flex-end", background: "var(--c-brand)", color: "#fff", padding: "12px 16px", borderRadius: "20px 20px 4px 20px", fontSize: 14, boxShadow: "0 4px 12px rgba(217,101,75,0.15)" }}>
               Siap, pesanan sedang saya antar ya! Mohon ditunggu.
             </div>
          </div>

          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12, margin: "0 -24px", paddingLeft: 24, paddingRight: 24 }} className="scroll-area mt-5">
            {["Saya sudah di lokasi", "Sesuai titik peta ya", "Mohon angkat telepon"].map(msg => (
              <button 
                key={msg}
                onClick={() => {
                   alert("Pesan terkirim (Simulasi): " + msg);
                   setIsChatOpen(false);
                }}
                style={{ 
                  flexShrink: 0, padding: "10px 20px", borderRadius: 99, 
                  background: "var(--cream-card)", color: "var(--c-ink)", 
                  border: "1.5px solid var(--c-border)", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
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
