"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { subscribeToUserStats, UserProfile } from "@/lib/db";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAccountMode } from "@/context/AccountModeContext";
import AccountSwitcherSheet from "@/components/AccountSwitcherSheet";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { mode } = useAccountMode();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showWallet, setShowWallet] = useState(false);
  const [renderingShare, setRenderingShare] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);

  // Fully interactive modal states
  const [activeModal, setActiveModal] = useState<"payment" | "address" | "notifications" | "help" | "edit-profile" | null>(null);

  // 1. Edit Profile States
  const [editName, setEditName] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // 2. Payment Method States
  const [paymentMethods, setPaymentMethods] = useState([
    { id: "gopay", name: "GoPay", type: "E-Wallet", balance: 45000, color: "#00AED6", active: true },
    { id: "ovo", name: "OVO", type: "E-Wallet", balance: 12500, color: "#4C2A86", active: false },
    { id: "card", name: "Visa **** 8892", type: "Credit Card", balance: 0, color: "#1E293B", active: false }
  ]);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpTarget, setTopUpTarget] = useState("gopay");
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [lastTopUpAmount, setLastTopUpAmount] = useState(0);

  // 3. Saved Address States
  const [addresses, setAddresses] = useState([
    { id: 1, label: "Rumah", detail: "Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan", isDefault: true },
    { id: 2, label: "Kantor", detail: "Gedung ResQ, Lantai 12, Jl. H.R. Rasuna Said, Jakarta Selatan", isDefault: false }
  ]);
  const [newAddrLabel, setNewAddrLabel] = useState("");
  const [newAddrDetail, setNewAddrDetail] = useState("");

  // 4. Promo Notification States
  const [notifPreferences, setNotifPreferences] = useState({
    orderStatus: true,
    nearbyAlerts: true,
    weeklyPromo: false,
    ecoMilestones: true
  });

  // 5. Help & FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Toast notification state instead of browser alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserStats(user.uid, (data) => {
      setProfile(data);
      setLoadingStats(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Pre-fill edit inputs when user opens edit profile modal
  useEffect(() => {
    if (user) {
      setEditName(user.displayName || "");
      setEditPhotoUrl(user.photoURL || "");
    }
  }, [user, activeModal]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/auth");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editName.trim()) return;
    setUpdatingProfile(true);
    try {
      const finalPhotoUrl = editPhotoUrl.trim() || "";
      
      // 1. Update Firebase Auth
      await updateProfile(user, {
        displayName: editName.trim(),
        photoURL: finalPhotoUrl || null
      });

      // 2. Update Firestore users collection
      if (db) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          name: editName.trim(),
          photoURL: finalPhotoUrl
        });
      }

      // 3. Reload Auth User session locally
      await user.reload();

      router.refresh();
      setActiveModal(null);
      triggerToast("Profil berhasil diperbarui!");
    } catch (err) {
      console.error("Gagal update profil:", err);
      triggerToast("Gagal memperbarui profil.");
    }
    setUpdatingProfile(false);
  };

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerToast("Masukkan nominal top-up yang valid.");
      return;
    }
    setIsToppingUp(true);
    setTimeout(() => {
      setPaymentMethods(prev => prev.map(method => {
        if (method.id === topUpTarget) {
          return { ...method, balance: method.balance + amount };
        }
        return method;
      }));
      setLastTopUpAmount(amount);
      setTopUpAmount("");
      setIsToppingUp(false);
      setTopUpSuccess(true);
    }, 1500);
  };

  const handleSelectActivePayment = (id: string) => {
    setPaymentMethods(prev => prev.map(m => ({ ...m, active: m.id === id })));
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrLabel.trim() || !newAddrDetail.trim()) return;
    const newAddr = {
      id: Date.now(),
      label: newAddrLabel.trim(),
      detail: newAddrDetail.trim(),
      isDefault: false
    };
    setAddresses(prev => [...prev, newAddr]);
    setNewAddrLabel("");
    setNewAddrDetail("");
    triggerToast("Alamat baru berhasil ditambahkan!");
  };

  const handleDeleteAddress = (id: number) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  const handleSetDefaultAddress = (id: number) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const toggleNotif = (key: keyof typeof notifPreferences) => {
    setNotifPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Use Firestore-backed stats — accurate from purchase history
  const totalSavedFormatted = profile ? `Rp ${(profile.totalSaved / 1000).toFixed(0)}k` : "-";
  const totalCO2 = profile?.totalCO2 ?? 0;
  const foodKg = profile ? (totalCO2 / 2.5).toFixed(1) : "-";

  const faqs = [
    {
      q: "Apa itu platform penyelamatan makanan ResQ?",
      a: "ResQ adalah aplikasi berkelanjutan yang menghubungkan Anda dengan restoran, toko roti, dan supermarket lokal untuk menyelamatkan makanan berlebih yang masih lezat dan berkualitas tinggi dengan potongan harga signifikan."
    },
    {
      q: "Apakah kualitas makanan di ResQ terjamin?",
      a: "Sangat terjamin. Semua mitra merchant kami wajib mematuhi standar kebersihan dan keselamatan makanan yang ketat. Makanan disiapkan dan dikemas dengan standar yang sama seperti pemesanan reguler."
    },
    {
      q: "Bagaimana sistem pengantaran bekerja?",
      a: "Anda bisa memesan langsung ke alamat rumah melalui mitra kurir internal ResQ dengan biaya pengiriman yang disesuaikan berdasarkan jarak secara real-time. Semua biaya pengiriman dialokasikan penuh untuk performa kesejahteraan kurir kami."
    },
    {
      q: "Mengapa menyelamatkan makanan penting untuk bumi?",
      a: "Membuang makanan menyumbang sekitar 8-10% dari emisi gas rumah kaca global. Dengan menyelamatkan 1 porsi makanan surplus di ResQ, Anda berhasil menekan rata-rata emisi gas CO₂ dari pembusukan sampah makanan secara langsung."
    }
  ];

  const avatarGradientPresets = [
    { name: "Ocean Breeze", grad: "linear-gradient(135deg, #0EA5E9, #10B981)" },
    { name: "Sunset Glow", grad: "linear-gradient(135deg, #F59E0B, #EF4444)" },
    { name: "Royal Velvet", grad: "linear-gradient(135deg, #8B5CF6, #EC4899)" },
    { name: "Forest Mint", grad: "linear-gradient(135deg, #10B981, #064E3B)" }
  ];

  return (
    <ProtectedRoute>
      <div style={{ padding: "40px 24px", paddingBottom: 120, position: "relative", zIndex: 10 }}>
        
        {/* ────────────────────────────────────────────────────────
            PROFILE HEADER (Raised with Outstanding Plus Button)
        ──────────────────────────────────────────────────────── */}
        <section 
          onClick={() => setActiveModal("edit-profile")}
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            marginBottom: 32,
            cursor: "pointer" 
          }}
          title="Ubah Profil"
        >
          <div style={{
            width: 104, height: 104, borderRadius: "50%",
            marginBottom: 16,
            boxShadow: "0 10px 25px rgba(0,0,0,0.08), 0 0 0 4px var(--c-bg), 0 0 0 6px var(--c-border)",
            background: "var(--c-surface)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative"
          }}>
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                background: "linear-gradient(135deg, var(--c-brand), var(--c-accent))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 36, fontWeight: 800
              }}>
                {(profile?.name || user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Highly outstanding raised plus indicator */}
            <div style={{
              position: "absolute",
              bottom: 0,
              right: -8,
              background: "var(--c-brand)",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(14, 165, 233, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)",
              border: "3px solid var(--c-surface)",
              zIndex: 10,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
          </div>
          
          <h1 className="t-h1 c-ink" style={{ fontSize: 26, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 6 }}>
            {profile?.name || user?.displayName || "Pengguna ResQ"}
          </h1>
          <p className="t-body c-muted" style={{ marginTop: 2, fontSize: 14 }}>
            {user?.email || "Email tidak tersedia"}
          </p>
        </section>

        {/* ────────────────────────────────────────────────────────
            BENTO CARD ECOSTATS
        ──────────────────────────────────────────────────────── */}
        <section className="elite-card" style={{ 
          background: "var(--c-surface-glass-heavy)", 
          backdropFilter: "blur(40px)",
          marginBottom: 24, 
          padding: "24px",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", top: "-30%", right: "-30%",
            width: "120px", height: "120px",
            background: "radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr", gap: "12px", alignItems: "center" }}>
            <div className="flex-col gap-1">
              <div className="t-xs c-brand" style={{ fontSize: 10 }}>Makanan</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.5px" }}>
                {loadingStats ? "-" : foodKg}
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", marginLeft: 2 }}>kg</span>
              </div>
              <div className="t-xs" style={{ opacity: 0.7, textTransform: "none", fontSize: 10 }}>Diselamatkan</div>
            </div>

            <div style={{ width: 1, height: "100%", background: "var(--c-border)" }} />

            <div className="flex-col gap-1">
              <div className="t-xs" style={{ color: "#10B981", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px" }}>CO₂</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.5px" }}>
                {loadingStats ? "-" : totalCO2.toFixed(1)}
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", marginLeft: 2 }}>kg</span>
              </div>
              <div className="t-xs" style={{ opacity: 0.7, textTransform: "none", fontSize: 10 }}>Ditekan</div>
            </div>

            <div style={{ width: 1, height: "100%", background: "var(--c-border)" }} />

            <div className="flex-col gap-1">
              <div className="t-xs" style={{ color: "#D97706", fontSize: 10, fontWeight: 700, letterSpacing: "0.5px" }}>Hemat</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                {loadingStats ? "-" : totalSavedFormatted}
              </div>
              <div className="t-xs" style={{ opacity: 0.7, textTransform: "none", fontSize: 10 }}>Uang</div>
            </div>
          </div>

          {/* Tier + Streak row */}
          {profile && (
            <div style={{ 
              display: "flex", alignItems: "center", gap: 12, 
              marginTop: 20, paddingTop: 16, 
              borderTop: "1px solid var(--c-border)" 
            }}>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: "5px 12px", borderRadius: 99,
                background: profile.streak >= 30 ? "var(--c-brand-faint)" : profile.streak >= 5 ? "rgba(16,185,129,0.1)" : "var(--c-faint)",
                color: profile.streak >= 30 ? "var(--c-brand)" : profile.streak >= 5 ? "#10B981" : "var(--c-muted)"
              }}>
                Streak: {profile.streak} Hari
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 99,
                background: "var(--c-faint)", color: "var(--c-ink)"
              }}>
                {profile.tier}
              </span>
            </div>
          )}

          {/* Share & Wallet CTAs */}
          {profile && (
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button 
                onClick={() => {
                  if (renderingShare) return;
                  setRenderingShare(true);
                  
                  const canvas = document.createElement("canvas");
                  canvas.width = 1080;
                  canvas.height = 1920;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) {
                    setRenderingShare(false);
                    return;
                  }

                  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
                  grad.addColorStop(0, "#0F172A");
                  grad.addColorStop(0.5, "#064E3B");
                  grad.addColorStop(1, "#451A03");
                  ctx.fillStyle = grad;
                  ctx.fillRect(0, 0, 1080, 1920);

                  ctx.fillStyle = "rgba(217, 101, 75, 0.12)";
                  ctx.beginPath();
                  ctx.arc(1080, 0, 600, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
                  ctx.beginPath();
                  ctx.arc(0, 960, 700, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
                  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
                  ctx.lineWidth = 4;
                  
                  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
                    ctx.beginPath();
                    ctx.moveTo(x + r, y);
                    ctx.arcTo(x + w, y, x + w, y + h, r);
                    ctx.arcTo(x + w, y + h, x, y + h, r);
                    ctx.arcTo(x, y + h, x, y, r);
                    ctx.arcTo(x, y, x + w, y, r);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                  };
                  
                  roundRect(90, 300, 900, 1300, 64);

                  ctx.fillStyle = "#D9654B";
                  ctx.font = "bold 32px sans-serif";
                  ctx.textAlign = "center";
                  ctx.fillText("RESQ APP • DAMPAK EKOLOGIS", 540, 390);

                  ctx.fillStyle = "#FFFFFF";
                  ctx.font = "bold 68px sans-serif";
                  ctx.fillText(user?.displayName || "Penyelamat Pangan", 540, 500);
                  
                  ctx.fillStyle = "#94A3B8";
                  ctx.font = "bold 36px sans-serif";
                  ctx.fillText(`${profile.tier.toUpperCase()} MEMBER`, 540, 560);

                  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
                  ctx.beginPath();
                  ctx.moveTo(180, 620);
                  ctx.lineTo(900, 620);
                  ctx.stroke();

                  ctx.fillStyle = "#34D399";
                  ctx.font = "extrabold 180px sans-serif";
                  ctx.fillText(totalCO2.toFixed(1), 540, 840);
                  
                  ctx.fillStyle = "#FFFFFF";
                  ctx.font = "bold 44px sans-serif";
                  ctx.fillText("KG JEJAK CO₂ DITEKAN", 540, 920);

                  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
                  roundRect(160, 1020, 340, 220, 32);
                  ctx.fillStyle = "#F59E0B";
                  ctx.font = "bold 42px sans-serif";
                  ctx.fillText(totalSavedFormatted, 330, 1120);
                  ctx.fillStyle = "#94A3B8";
                  ctx.font = "bold 26px sans-serif";
                  ctx.fillText("UANG DIHEMAT", 330, 1180);

                  roundRect(580, 1020, 340, 220, 32);
                  ctx.fillStyle = "#EF4444";
                  ctx.font = "bold 42px sans-serif";
                  ctx.fillText(`${profile.streak} HARI`, 750, 1120);
                  ctx.fillStyle = "#94A3B8";
                  ctx.font = "bold 26px sans-serif";
                  ctx.fillText("STREAK AKTIF", 750, 1180);

                  ctx.fillStyle = "#34D399";
                  ctx.font = "italic 36px sans-serif";
                  ctx.fillText("Menyelamatkan Makanan, Menjaga Bumi", 540, 1360);

                  ctx.fillStyle = "#FFFFFF";
                  roundRect(390, 1450, 300, 80, 8);
                  ctx.fillStyle = "#000000";
                  ctx.font = "bold 24px monospace";
                  ctx.fillText("||| | |||| | ||| | ||", 540, 1500);

                  ctx.fillStyle = "#64748B";
                  ctx.font = "500 28px sans-serif";
                  ctx.fillText("resq.id/download", 540, 1750);

                  try {
                    const dataUrl = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.download = `ResQ-Story-${user?.displayName || 'User'}.png`;
                    link.href = dataUrl;
                    link.click();
                  } catch (e) {
                    alert("Gagal mengekspor gambar");
                  } finally {
                    setRenderingShare(false);
                  }
                }}
                className="elite-btn-primary" 
                style={{ flex: 1, padding: "12px", fontSize: 13, height: "auto", display: "flex", justifyContent: "center" }}
              >
                {renderingShare ? "Memproses..." : "Bagikan Story"}
              </button>
              <button 
                onClick={() => setShowWallet(true)}
                className="elite-card" 
                style={{ flex: 1, padding: "12px", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", margin: 0, cursor: "pointer", background: "var(--c-surface)" }}
              >
                Apple Wallet
              </button>
            </div>
          )}
        </section>

        {/* ────────────────────────────────────────────────────────
            SETTINGS LIST (Interactive Real Actions with SVG Icons)
        ──────────────────────────────────────────────────────── */}
        <section className="flex-col gap-3">

          {/* Account Mode Switcher */}
          <button
            onClick={() => setShowSwitcher(true)}
            className="elite-card flex items-center justify-between w-full"
            style={{
              padding: "16px",
              cursor: "pointer",
              textAlign: "left",
              background: "var(--c-surface)",
              boxShadow: "var(--sh-sm), var(--sh-inner-glass)",
            }}
          >
            <div className="flex items-center gap-4">
              <div style={{
                width: 44, height: 44, borderRadius: "14px",
                background: "rgba(14,165,233,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 2.1l4 4-4 4M3 22v-6c0-1.1.9-2 2-2h10l4-4M3 9l4-4-4-4"/>
                </svg>
              </div>
              <div>
                <div className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15 }}>
                  Ganti Mode Akun
                </div>
                <div className="t-xs c-muted" style={{ marginTop: 2, textTransform: "none", fontSize: 12, letterSpacing: 0 }}>
                  Ganti ke mode mitra/consumer
                </div>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          <SettingItem
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            }
            title="Metode Pembayaran"
            subtitle={`${paymentMethods.find(p => p.active)?.name || "Pilih Metode"} • Aktif`}
            tint="rgba(14, 165, 233, 0.12)"
            onClick={() => {
              setTopUpSuccess(false);
              setActiveModal("payment");
            }}
          />
          
          <SettingItem
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            }
            title="Alamat Tersimpan"
            subtitle={`${addresses.length} Lokasi tersimpan`}
            tint="rgba(16, 185, 129, 0.12)"
            onClick={() => setActiveModal("address")}
          />

          <SettingItem
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            }
            title="Notifikasi Promo"
            subtitle="Promo codes, Notifikasi terdekat"
            tint="rgba(245, 158, 11, 0.12)"
            onClick={() => setActiveModal("notifications")}
          />

          <SettingItem
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D9654B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            }
            title="Bantuan & FAQ"
            subtitle="Layanan ResQ Care"
            tint="rgba(217, 101, 75, 0.12)"
            onClick={() => setActiveModal("help")}
          />

        </section>

        {/* ────────────────────────────────────────────────────────
            LOGOUT CTA
        ──────────────────────────────────────────────────────── */}
        <section style={{ marginTop: 36 }}>
          <button
            onClick={handleLogout}
            className="elite-card"
            style={{ 
              background: "transparent", 
              color: "var(--c-brand)", 
              borderColor: "var(--c-brand-faint)",
              boxShadow: "none",
              fontSize: 15,
              fontWeight: 700,
              width: "100%",
              textAlign: "center",
              padding: "16px",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(217,101,75,0.05)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Keluar dari Akun
          </button>
        </section>

        {/* ────────────────────────────────────────────────────────
            DYNAMIC INTERACTIVE MODALS
        ──────────────────────────────────────────────────────── */}
        {activeModal && (
          <div 
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 24
            }} 
            onClick={() => setActiveModal(null)}
          >
            <div 
              style={{
                width: "100%", maxWidth: 400,
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                borderRadius: 32, padding: "24px 20px 28px",
                display: "flex", flexDirection: "column", gap: 20,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              }} 
              onClick={e => e.stopPropagation()} 
              className="scale-up"
            >
              
              <div className="flex justify-between items-center" style={{ borderBottom: "1px solid var(--c-border)", paddingBottom: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--c-ink)" }}>
                  {activeModal === "edit-profile" && "Edit Profil Pengguna"}
                  {activeModal === "payment" && "Metode Pembayaran"}
                  {activeModal === "address" && "Alamat Tersimpan"}
                  {activeModal === "notifications" && "Preferensi Notifikasi"}
                  {activeModal === "help" && "Pusat Bantuan & FAQ"}
                </span>
                <button onClick={() => setActiveModal(null)} style={{ background: "transparent", border: "none", color: "var(--c-muted)", cursor: "pointer", fontSize: 22, fontWeight: 300 }}>×</button>
              </div>

              {/* 1. EDIT PROFILE MODAL */}
              {activeModal === "edit-profile" && (
                <form onSubmit={handleUpdateProfile} className="flex-col gap-4">
                  {/* File Upload / Interactive Preview Area */}
                  <div className="flex-col gap-2">
                    <label className="t-xs c-muted" style={{ fontWeight: 700 }}>FOTO PROFIL</label>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 6 }}>
                      <div style={{
                        width: 72, height: 72, borderRadius: "50%",
                        border: "2.5px solid var(--c-border)", overflow: "hidden", background: "var(--c-surface)",
                        boxShadow: "var(--sh-md)", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {editPhotoUrl ? (
                          <img src={editPhotoUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{
                            width: "100%", height: "100%",
                            background: "linear-gradient(135deg, var(--c-brand), var(--c-accent))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontSize: 24, fontWeight: 800
                          }}>
                            {editName.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          id="profile-photo-file-upload" 
                          style={{ display: "none" }} 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                triggerToast("Ukuran foto maksimal 2MB!");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === "string") {
                                  setEditPhotoUrl(reader.result);
                                  triggerToast("Foto profil terpilih!");
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <label 
                            htmlFor="profile-photo-file-upload" 
                            className="elite-icon-btn" 
                            style={{ 
                              width: "auto", display: "inline-flex", padding: "8px 16px", 
                              height: "auto", borderRadius: "var(--radius-pill)", fontSize: 13, 
                              fontWeight: 700, cursor: "pointer", background: "var(--c-surface)",
                              border: "1px solid var(--c-border)",
                              boxShadow: "var(--sh-sm)"
                            }}
                          >
                             Unggah Foto
                          </label>
                          {editPhotoUrl && (
                            <button 
                              type="button"
                              onClick={() => {
                                setEditPhotoUrl("");
                                triggerToast("Foto profil dihapus.");
                              }}
                              style={{
                                padding: "8px 16px", borderRadius: "var(--radius-pill)",
                                background: "var(--c-faint)", color: "#EF4444", fontSize: 13,
                                border: "1px solid var(--c-border)", cursor: "pointer", fontWeight: 700
                              }}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                        <p className="t-xs c-muted" style={{ marginTop: 4, textTransform: "none", fontSize: 11 }}>Maks 2MB. JPG atau PNG.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-col gap-2">
                    <label className="t-xs c-muted" style={{ fontWeight: 700 }}>NAMA LENGKAP</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      style={{
                        padding: 12, borderRadius: 12, border: "1.5px solid var(--c-border)",
                        background: "var(--c-bg)", color: "var(--c-ink)", outline: "none", fontSize: 14
                      }}
                      placeholder="Masukkan nama"
                      required
                    />
                  </div>

                  <div className="flex-col gap-2">
                    <label className="t-xs c-muted" style={{ fontWeight: 700 }}>FOTO PROFIL (URL)</label>
                    <input 
                      type="url" 
                      value={editPhotoUrl.startsWith("data:") ? "" : editPhotoUrl}
                      onChange={e => setEditPhotoUrl(e.target.value)}
                      style={{
                        padding: 12, borderRadius: 12, border: "1.5px solid var(--c-border)",
                        background: "var(--c-bg)", color: "var(--c-ink)", outline: "none", fontSize: 14
                      }}
                      placeholder={editPhotoUrl.startsWith("data:") ? "Foto diunggah dari lokal" : "Masukkan link gambar / foto"}
                    />
                  </div>

                  {/* Clean Geometric presets instead of AI-looking emojis */}
                  <div className="flex-col gap-2" style={{ marginTop: 4 }}>
                    <label className="t-xs c-muted" style={{ fontWeight: 700 }}>ATAU PILIH PRESET GRADASI</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 4 }}>
                      {avatarGradientPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g_${idx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${idx === 0 ? '#0ea5e9' : idx === 1 ? '#F59E0B' : idx === 2 ? '#8B5CF6' : '#10B981'}"/><stop offset="100%" stop-color="${idx === 0 ? '#10B981' : idx === 1 ? '#EF4444' : idx === 2 ? '#EC4899' : '#064E3B'}"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g_${idx})"/><text y="62" x="50" font-size="36" fill="%23ffffff" font-weight="bold" font-family="sans-serif" text-anchor="middle">${editName.charAt(0).toUpperCase() || 'U'}</text></svg>`;
                            setEditPhotoUrl(`data:image/svg+xml;utf8,${svgStr}`);
                            triggerToast("Preset terpilih!");
                          }}
                          style={{
                            height: 48,
                            background: preset.grad,
                            borderRadius: 12,
                            border: "2px solid var(--c-border)",
                            cursor: "pointer",
                            transition: "transform 0.2s"
                          }}
                          onMouseOver={e => e.currentTarget.style.transform = "scale(1.08)"}
                          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="elite-btn-primary" 
                    style={{ marginTop: 16, padding: "14px", width: "100%", border: "none" }}
                    disabled={updatingProfile}
                  >
                    {updatingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </form>
              )}

              {/* 2. PAYMENT METHODS MODAL WITH ANIMATION */}
              {activeModal === "payment" && (
                <div className="flex-col gap-4">
                  {topUpSuccess ? (
                    /* Beautiful inline success screen with clean SVG illustration instead of emojis */
                    <div style={{ textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                      <div style={{
                        width: 64, height: 64, borderRadius: "50%", background: "rgba(16, 185, 129, 0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        animation: "pulse 2s infinite"
                      }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 800, fontSize: 18, color: "var(--c-ink)" }}>Top Up Berhasil!</h4>
                        <p className="t-xs c-muted" style={{ marginTop: 4, textTransform: "none" }}>
                          Saldo sebesar Rp {lastTopUpAmount.toLocaleString("id-ID")} telah dikreditkan ke {paymentMethods.find(p => p.id === topUpTarget)?.name}.
                        </p>
                      </div>
                      <button 
                        onClick={() => setTopUpSuccess(false)}
                        className="elite-btn-primary"
                        style={{ width: "100%", marginTop: 8 }}
                      >
                        Selesai
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-col gap-3">
                        <span className="t-xs c-muted" style={{ fontWeight: 700 }}>METODE PEMBAYARAN ANDA</span>
                        {paymentMethods.map(method => (
                          <div 
                            key={method.id} 
                            onClick={() => handleSelectActivePayment(method.id)}
                            style={{
                              padding: "14px 16px", borderRadius: 16, border: method.active ? "2px solid var(--c-brand)" : "1.5px solid var(--c-border)",
                              background: method.active ? "var(--c-faint)" : "var(--c-surface)",
                              display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span style={{
                                width: 36, height: 36, borderRadius: 10, background: method.color,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", fontSize: 13, fontWeight: 800
                              }}>
                                {method.name.charAt(0)}
                              </span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-ink)" }}>{method.name}</div>
                                <div className="t-xs c-muted" style={{ fontSize: 11 }}>{method.type}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--c-ink)" }}>
                                Rp {method.balance.toLocaleString("id-ID")}
                              </div>
                              {method.active && <span className="t-xs" style={{ color: "var(--c-brand)", fontWeight: 700 }}>Aktif</span>}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ borderTop: "1px solid var(--c-border)", paddingTop: 16 }} className="flex-col gap-3">
                        <span className="t-xs c-muted" style={{ fontWeight: 700 }}>TOP UP SALDO INSTAN</span>
                        <div className="flex-col gap-3">
                          <select 
                            value={topUpTarget} 
                            onChange={e => setTopUpTarget(e.target.value)}
                            style={{
                              width: "100%", padding: "14px", borderRadius: 12, border: "1.5px solid var(--c-border)",
                              background: "var(--c-surface)", color: "var(--c-ink)", outline: "none", fontSize: 14,
                              fontWeight: 600
                            }}
                          >
                            <option value="gopay">GoPay</option>
                            <option value="ovo">OVO</option>
                          </select>
                          <input 
                            type="number" 
                            value={topUpAmount}
                            onChange={e => setTopUpAmount(e.target.value)}
                            placeholder="Nominal (Contoh: 50000)"
                            style={{
                              width: "100%", padding: "14px", borderRadius: 12, border: "1.5px solid var(--c-border)",
                              background: "var(--c-bg)", color: "var(--c-ink)", outline: "none", fontSize: 14
                            }}
                          />
                          <button 
                            onClick={handleTopUp}
                            disabled={isToppingUp}
                            className="elite-btn-primary"
                            style={{ width: "100%", padding: "14px", border: "none", fontSize: 14, opacity: isToppingUp ? 0.7 : 1 }}
                          >
                            {isToppingUp ? "Memproses..." : "Konfirmasi Top Up Saldo"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 3. SAVED ADDRESS MODAL */}
              {activeModal === "address" && (
                <div className="flex-col gap-4">
                  <div className="flex-col gap-3" style={{ maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
                    <span className="t-xs c-muted" style={{ fontWeight: 700 }}>DAFTAR ALAMAT</span>
                    {addresses.map(addr => (
                      <div 
                        key={addr.id}
                        style={{
                          padding: "12px", borderRadius: 16, border: "1.5px solid var(--c-border)",
                          background: addr.isDefault ? "rgba(16, 185, 129, 0.05)" : "var(--c-surface)",
                          display: "flex", flexDirection: "column", gap: 6, position: "relative"
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span style={{ fontWeight: 800, fontSize: 13, color: "var(--c-ink)" }}>
                            {addr.label} {addr.isDefault && <span style={{ color: "#10B981", fontSize: 10, background: "rgba(16,185,129,0.1)", padding: "2px 6px", borderRadius: 6, marginLeft: 6 }}>Utama</span>}
                          </span>
                          <div style={{ display: "flex", gap: 8 }}>
                            {!addr.isDefault && (
                              <button 
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                style={{ background: "none", border: "none", color: "var(--c-brand)", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                              >
                                Set Utama
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteAddress(addr.id)}
                              style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 11 }}
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                        <p className="t-xs c-muted" style={{ fontSize: 11, textTransform: "none", lineHeight: 1.4 }}>
                          {addr.detail}
                        </p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddAddress} style={{ borderTop: "1px solid var(--c-border)", paddingTop: 16 }} className="flex-col gap-3">
                    <span className="t-xs c-muted" style={{ fontWeight: 700 }}>TAMBAH ALAMAT BARU</span>
                    <input 
                      type="text" 
                      value={newAddrLabel}
                      onChange={e => setNewAddrLabel(e.target.value)}
                      placeholder="Label (Contoh: Apartemen, Kantor Cabang)"
                      style={{
                        padding: 10, borderRadius: 12, border: "1.5px solid var(--c-border)",
                        background: "var(--c-bg)", color: "var(--c-ink)", outline: "none", fontSize: 13
                      }}
                      required
                    />
                    <textarea 
                      value={newAddrDetail}
                      onChange={e => setNewAddrDetail(e.target.value)}
                      placeholder="Detail alamat lengkap..."
                      rows={2}
                      style={{
                        padding: 10, borderRadius: 12, border: "1.5px solid var(--c-border)",
                        background: "var(--c-bg)", color: "var(--c-ink)", outline: "none", fontSize: 13,
                        resize: "none", fontFamily: "inherit"
                      }}
                      required
                    />
                    <button 
                      type="submit" 
                      style={{
                        background: "var(--c-brand)", color: "#fff", border: "none", padding: "12px",
                        borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 13
                      }}
                    >
                      Simpan Alamat Baru
                    </button>
                  </form>
                </div>
              )}

              {/* 4. PROMO NOTIFICATIONS MODAL */}
              {activeModal === "notifications" && (
                <div className="flex-col gap-4">
                  <span className="t-xs c-muted" style={{ fontWeight: 700 }}>ATUR NOTIFIKASI ANDA</span>
                  
                  {[
                    { key: "orderStatus" as const, title: "Status Pesanan", desc: "Dapatkan info langsung saat kurir bergerak menjemput pesanan." },
                    { key: "nearbyAlerts" as const, title: "Makanan Murah Dekat Saya", desc: "Terima peringatan instan jika makanan kesukaan Anda mendekati limit kelayakan." },
                    { key: "weeklyPromo" as const, title: "Voucher & Promo Mingguan", desc: "Rekomendasi promo hemat eksklusif setiap minggu." },
                    { key: "ecoMilestones" as const, title: "Pencapaian Ekologi", desc: "Notifikasi saat jejak karbon Anda berhasil diselamatkan." }
                  ].map(item => (
                    <div 
                      key={item.key}
                      onClick={() => toggleNotif(item.key)}
                      style={{
                        padding: "12px 14px", borderRadius: 16, border: "1.5px solid var(--c-border)",
                        background: notifPreferences[item.key] ? "rgba(14,165,233,0.02)" : "var(--c-surface)",
                        display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer"
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--c-ink)" }}>{item.title}</div>
                        <p style={{ fontSize: 10, color: "var(--c-muted)", textTransform: "none", marginTop: 2, lineHeight: 1.3 }}>{item.desc}</p>
                      </div>
                      
                      {/* iOS-style toggle track */}
                      <div style={{
                        width: 44, height: 24, borderRadius: 12,
                        background: notifPreferences[item.key] ? "#10B981" : "var(--c-border)",
                        position: "relative", transition: "background 0.3s ease",
                        flexShrink: 0
                      }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%", background: "#fff",
                          position: "absolute", top: 2, left: notifPreferences[item.key] ? 22 : 2,
                          transition: "left 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }} />
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => {
                      setActiveModal(null);
                      triggerToast("Preferensi notifikasi disimpan!");
                    }} 
                    className="elite-btn-primary"
                    style={{ border: "none", padding: "14px" }}
                  >
                    Selesai
                  </button>
                </div>
              )}

              {/* 5. FAQ & ACCORDION MODAL */}
              {activeModal === "help" && (
                <div className="flex-col gap-3" style={{ maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
                  <span className="t-xs c-muted" style={{ fontWeight: 700 }}>PERTANYAAN UMUM</span>
                  
                  {faqs.map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div 
                        key={index}
                        style={{
                          border: "1.5px solid var(--c-border)", borderRadius: 16,
                          background: "var(--c-surface)", overflow: "hidden"
                        }}
                      >
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                          style={{
                            width: "100%", padding: "14px", display: "flex", justifyContent: "space-between",
                            alignItems: "center", background: "none", border: "none", cursor: "pointer",
                            textAlign: "left", fontWeight: 700, fontSize: 13, color: "var(--c-ink)"
                          }}
                        >
                          <span>{faq.q}</span>
                          <span style={{ fontSize: 14, color: "var(--c-muted)" }}>{isOpen ? "−" : "+"}</span>
                        </button>
                        
                        {isOpen && (
                          <div style={{
                            padding: "0 14px 14px", color: "var(--c-muted)", fontSize: 12,
                            textTransform: "none", lineHeight: 1.4, borderTop: "1px solid var(--c-border)",
                            paddingTop: 10, background: "var(--c-faint)"
                          }}>
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  <div style={{ borderTop: "1px solid var(--c-border)", paddingTop: 12, marginTop: 4 }} className="flex-col gap-2">
                    <span className="t-xs c-muted" style={{ fontWeight: 700 }}>BUTUH BANTUAN LAIN?</span>
                    <button 
                      onClick={() => triggerToast("Menghubungi Live Chat ResQ Care...")}
                      style={{
                        background: "rgba(217, 101, 75, 0.08)", color: "var(--c-brand)",
                        border: "1px solid var(--c-brand-faint)", borderRadius: 12, padding: "12px",
                        fontWeight: 700, cursor: "pointer", fontSize: 13
                      }}
                    >
                      Hubungi Live Support 24/7
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            APPLE WALLET MODAL DIALOG PREVIEW
        ──────────────────────────────────────────────────────── */}
        {showWallet && profile && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24
          }} onClick={() => setShowWallet(false)}>
            <div style={{
              width: "100%", maxWidth: 360,
              background: "rgba(25,25,27,0.95)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 32, padding: "24px 20px 32px",
              display: "flex", flexDirection: "column", gap: 24,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            }} onClick={e => e.stopPropagation()} className="scale-up">
              
              <div className="flex justify-between items-center">
                <span style={{ color: "#94A3B8", fontSize: 12, fontWeight: 800 }}>APPLE WALLET PASS</span>
                <button onClick={() => setShowWallet(false)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}>×</button>
              </div>

              {/* simulated iOS pass card */}
              <div style={{
                background: "linear-gradient(135deg, #0F172A, #064E3B)",
                borderRadius: 24, padding: 20, color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.1)",
                display: "flex", flexDirection: "column", gap: 24,
                boxShadow: "0 15px 30px rgba(0,0,0,0.3)"
              }}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 13, fontWeight: 800 }}>ResQ Saver Pass</span>
                  </div>
                  <span style={{ fontSize: 10, background: "rgba(255,255,255,0.15)", padding: "4px 8px", borderRadius: 8 }}>LOYALTY</span>
                </div>

                <div>
                  <span style={{ color: "#94A3B8", fontSize: 9 }}>MEMBER NAME</span>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.displayName || "Penyelamat Pangan"}</div>
                </div>

                <div className="flex justify-between">
                  <div>
                    <span style={{ color: "#94A3B8", fontSize: 9 }}>TIER LEVEL</span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#34D399" }}>{profile.tier}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: "#94A3B8", fontSize: 9 }}>ACTIVE STREAK</span>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{profile.streak} Hari</div>
                  </div>
                </div>

                {/* iOS Barcode preview */}
                <div style={{ background: "#fff", padding: 12, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 18, color: "#000", fontFamily: "monospace", letterSpacing: 3 }}>|||| | ||| | |||| | ||</div>
                  <span style={{ fontSize: 8, color: "#64748B" }}>UID: {user?.uid.slice(0, 12).toUpperCase()}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  triggerToast("Sukses menambahkan ResQ Saver Pass ke Apple Wallet!");
                  setShowWallet(false);
                }}
                className="elite-btn-primary" 
                style={{ background: "#000", color: "#fff", border: "1.5px solid rgba(255,255,255,0.15)", display: "flex", justifyContent: "center" }}
              >
                Add to Apple Wallet
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Account Switcher Sheet */}
      <AccountSwitcherSheet
        open={showSwitcher}
        onClose={() => setShowSwitcher(false)}
      />

      {/* Elegant minimalist Toast notification instead of browser alert dialogues */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: 100,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(12px)",
          color: "#FFFFFF",
          padding: "12px 24px",
          borderRadius: 20,
          fontSize: 14,
          fontWeight: 700,
          zIndex: 2000,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          animation: "scaleUp 0.25s ease",
          textAlign: "center",
          whiteSpace: "nowrap"
        }}>
          {toastMessage}
        </div>
      )}

    </ProtectedRoute>
  );
}


function SettingItem({ 
  icon, 
  title, 
  subtitle, 
  tint, 
  onClick 
}: { 
  icon: React.ReactNode, 
  title: string, 
  subtitle: string, 
  tint: string,
  onClick?: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className="elite-card flex items-center justify-between w-full"
      style={{ 
        padding: "16px", 
        cursor: "pointer", 
        textAlign: "left", 
        background: "var(--c-surface)",
        boxShadow: "var(--sh-sm), var(--sh-inner-glass)"
      }}
    >
      <div className="flex items-center gap-4">
        <div style={{
          width: 44, height: 44, borderRadius: "14px",
          background: tint, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 0 2px 4px rgba(255,255,255,0.8)"
        }}>
          {icon}
        </div>
        <div>
          <div className="t-sm c-ink" style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
          <div className="t-xs c-muted" style={{ marginTop: 2, textTransform: "none", fontSize: 12, letterSpacing: 0 }}>{subtitle}</div>
        </div>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}
