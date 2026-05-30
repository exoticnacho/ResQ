"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Order, subscribeToAvailableDeliveries, subscribeToMyDeliveries, updateDeliveryStatus } from "@/lib/db";

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
      setMyJobs(orders);
      
      // Calculate earnings from my jobs that are delivered/completed
      // In a real app we would query all completed deliveries for today
    });
    
    return () => unsubMy();
  }, [user]);

  const handleTakeOrder = async (orderId: string) => {
    if (!user) return;
    try {
      await updateDeliveryStatus(orderId, "en_route_pickup", user.uid);
    } catch (e: any) {
      alert("Gagal mengambil pesanan: " + e.message);
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
                width: 60, height: 32, borderRadius: 16,
                background: isOnline ? "var(--c-brand)" : "var(--c-border)",
                position: "relative", cursor: "pointer", transition: "all 0.3s ease",
                boxShadow: isOnline ? "0 4px 12px rgba(14,165,233,0.3)" : "none"
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3, left: isOnline ? 31 : 3,
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
              }} />
            </div>
          </div>

          {/* Earnings Card */}
          <div className="elite-card" style={{ 
            background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(139,92,246,0.15))",
            border: "1.5px solid rgba(139,92,246,0.2)",
            padding: 20, 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            <div>
              <div className="t-xs" style={{ color: "#8B5CF6", fontWeight: 700, letterSpacing: "0.5px" }}>PENDAPATAN HARI INI</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--c-ink)", marginTop: 2 }}>
                Rp {todayEarnings.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: 16, background: "rgba(139,92,246,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2"/>
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
            <div className="elite-card" style={{ padding: 20, border: "2px solid var(--c-brand)" }}>
              
              <div style={{ position: "relative", marginLeft: 12 }}>
                <div style={{ position: "absolute", top: 12, bottom: 20, left: 11, width: 2, background: "var(--c-border)", zIndex: 0 }} />
                <div style={{ position: "absolute", top: 12, left: 11, width: 2, background: "var(--c-brand)", zIndex: 1, 
                  height: activeJob.deliveryStatus === 'en_route_pickup' ? '10%' : activeJob.deliveryStatus === 'picked_up' ? '50%' : '100%', 
                  transition: "height 0.5s ease" }} />

                {/* Step 1: Menuju Restoran */}
                <div style={{ display: "flex", gap: 16, marginBottom: 24, position: "relative", zIndex: 2 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--c-brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <h4 className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Menuju Restoran</h4>
                    <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 2, fontSize: 12 }}>Jemput {activeJob.quantity}x {activeJob.foodName} di {activeJob.donorName}</p>
                    {activeJob.deliveryStatus === "en_route_pickup" && (
                      <button onClick={() => handleUpdateStatus(activeJob.id!, "picked_up")} className="elite-btn-primary" style={{ width: "100%", marginTop: 12, padding: "10px" }}>
                        Tiba di Restoran
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 2: Pesanan Diambil */}
                <div style={{ display: "flex", gap: 16, marginBottom: 24, position: "relative", zIndex: 2 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: (activeJob.deliveryStatus === 'picked_up' || activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') ? "var(--c-brand)" : "var(--c-surface)", color: "#fff", border: (activeJob.deliveryStatus === 'picked_up' || activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') ? "none" : "2px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {(activeJob.deliveryStatus === 'picked_up' || activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                  <div style={{ opacity: (activeJob.deliveryStatus === 'picked_up' || activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') ? 1 : 0.5 }}>
                    <h4 className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Pesanan Diambil</h4>
                    <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 2, fontSize: 12 }}>Pastikan pesanan sesuai.</p>
                    {activeJob.deliveryStatus === "picked_up" && (
                      <button onClick={() => handleUpdateStatus(activeJob.id!, "en_route_dropoff")} className="elite-btn-primary" style={{ width: "100%", marginTop: 12, padding: "10px" }}>
                        Mulai Pengantaran
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 3: Menuju Lokasi Pengantaran */}
                <div style={{ display: "flex", gap: 16, position: "relative", zIndex: 2 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: (activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') ? "var(--c-brand)" : "var(--c-surface)", color: "#fff", border: (activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') ? "none" : "2px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {(activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                  <div style={{ opacity: (activeJob.deliveryStatus === 'en_route_dropoff' || activeJob.deliveryStatus === 'delivered') ? 1 : 0.5, width: "100%" }}>
                    <h4 className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Menuju Lokasi</h4>
                    <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 2, fontSize: 12 }}>Antar ke lokasi berjarak {activeJob.dropoffDistance} km.</p>
                    {activeJob.deliveryStatus === "en_route_dropoff" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button onClick={() => setIsChatOpen(true)} className="elite-btn-primary" style={{ flex: 1, padding: "10px", background: "var(--c-ink)", color: "#fff" }}>
                          Chat
                        </button>
                        <button onClick={() => setIsPhotoModalOpen(true)} className="elite-btn-primary" style={{ flex: 2, padding: "10px" }}>
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
                  <div key={job.id} className="elite-card flex-col" style={{ padding: 16, gap: 12 }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="t-sm c-ink" style={{ fontWeight: 800 }}>{job.donorName}</div>
                        <div className="t-xs c-muted">{job.quantity}x {job.foodName}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="t-sm" style={{ color: "#10B981", fontWeight: 800 }}>
                          Rp {(job.deliveryFee || 15000).toLocaleString('id-ID')}
                        </div>
                        <div className="t-xs c-muted">Pendapatan</div>
                      </div>
                    </div>
                    
                    <div style={{ background: "var(--c-surface)", padding: 12, borderRadius: 12, display: "flex", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--c-brand)" }} />
                        <div style={{ width: 2, height: 20, background: "var(--c-border)" }} />
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                        <div className="t-xs c-ink"><strong>Jemput:</strong> {job.pickupDistance || 1.2} km</div>
                        <div className="t-xs c-ink"><strong>Antar Pembeli:</strong> {job.dropoffDistance || 3.5} km</div>
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
          position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "flex-end", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "var(--c-surface)", width: "100%", padding: "24px 24px 40px",
            borderRadius: "32px 32px 0 0", animation: "fade-up 0.3s var(--ease-spring)"
          }}>
            <h2 className="t-h2 c-ink" style={{ fontSize: 20, marginBottom: 8 }}>Bukti Pengantaran</h2>
            <p className="t-sm c-muted" style={{ marginBottom: 24, textTransform: "none" }}>Ambil foto makanan di lokasi tujuan sebagai bukti.</p>
            
            <div style={{
              width: "100%", height: 200, background: "var(--c-faint)", borderRadius: 16,
              border: "2px dashed var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 12, marginBottom: 24, cursor: "pointer", transition: "all 0.2s"
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <span className="t-sm c-brand" style={{ fontWeight: 700 }}>Ketuk untuk Kamera</span>
            </div>

            <button 
              className="elite-btn-primary" style={{ width: "100%", display: "flex", justifyContent: "center" }}
              disabled={isUploading}
              onClick={() => {
                setIsUploading(true);
                setTimeout(() => {
                  handleUpdateStatus(activeJob.id!, "delivered");
                  setTodayEarnings(prev => prev + (activeJob.deliveryFee || 0));
                  setIsUploading(false);
                  setIsPhotoModalOpen(false);
                }, 1500);
              }}
            >
              {isUploading ? "Mengunggah..." : "Unggah & Selesaikan"}
            </button>
            <button 
              onClick={() => setIsPhotoModalOpen(false)}
              style={{ width: "100%", padding: 16, marginTop: 12, background: "transparent", border: "none", color: "var(--c-muted)", fontWeight: 700, cursor: "pointer" }}
            >
              Batal
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
          <div style={{ width: 40, height: 4, background: "var(--c-border)", borderRadius: 99, margin: "0 auto", marginTop: -16, marginBottom: 16 }} />
          
          <div className="flex justify-between items-center mb-2">
            <h2 className="t-h2 c-ink" style={{ fontSize: 20 }}>Chat dengan Pemesan</h2>
            <button onClick={() => setIsChatOpen(false)} style={{ background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer", display: "flex" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style={{ background: "var(--c-surface)", padding: 16, borderRadius: "var(--radius-lg)", minHeight: 180, display: "flex", flexDirection: "column", gap: 12 }}>
             {/* Simulated chat messages */}
             <div style={{ alignSelf: "flex-end", background: "var(--c-brand-faint)", color: "var(--c-brand)", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", fontSize: 14 }}>
               Siap, mohon ditunggu!
             </div>
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, margin: "0 -24px", paddingLeft: 24, paddingRight: 24 }} className="scroll-area mt-4">
            {["Saya sudah di lokasi", "Sesuai titik koordinat ya", "Mohon angkat telepon"].map(msg => (
              <button 
                key={msg}
                onClick={() => {
                   alert("Pesan terkirim (Simulasi): " + msg);
                   setIsChatOpen(false);
                }}
                style={{ 
                  flexShrink: 0, padding: "8px 16px", borderRadius: 99, 
                  background: "var(--c-faint)", color: "var(--c-ink)", 
                  border: "1px solid var(--c-border)", fontSize: 13, fontWeight: 600,
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
