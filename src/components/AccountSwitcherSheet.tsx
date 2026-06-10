"use client";
import React, { useState } from "react";
import { useAccountMode, AccountMode } from "@/context/AccountModeContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AccountSwitcherSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function AccountSwitcherSheet({ open, onClose }: AccountSwitcherSheetProps) {
  const { mode, switchMode } = useAccountMode();
  const { user } = useAuth();
  const router = useRouter();

  const [isRegistering, setIsRegistering] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset state when sheet opens
  React.useEffect(() => {
    if (open) {
      setIsRegistering(false);
      setStoreName("");
    }
  }, [open]);

  const handleSwitch = async (newMode: AccountMode) => {
    if (newMode === "merchant" && user) {
      // Check if user has merchant profile
      setLoading(true);
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists() || !docSnap.data().storeName) {
          // Show registration form instead of switching directly
          setIsRegistering(true);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error checking merchant profile:", err);
      }
      setLoading(false);
    }

    executeSwitch(newMode);
  };

  const executeSwitch = (newMode: AccountMode) => {
    switchMode(newMode);
    onClose();
    if (newMode === "merchant") {
      router.push("/donor");
    } else if (newMode === "kurir") {
      router.push("/courier");
    } else {
      router.push("/");
    }
  };

  const handleRegister = async () => {
    if (!storeName.trim() || !user) return;
    setLoading(true);
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, { storeName: storeName.trim() }, { merge: true });
      executeSwitch("merchant");
    } catch (err) {
      console.error("Error registering store:", err);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
          zIndex: 500,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.35s ease",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 440,
          margin: "0 auto",
          background: "var(--c-surface)",
          borderRadius: "32px 32px 0 0",
          border: "1px solid var(--c-border)",
          borderBottom: "none",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.12)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 501,
          paddingBottom: "calc(env(safe-area-inset-bottom, 24px) + 104px)",
          overflow: "hidden",
        }}
      >
        {/* Notch */}
        <div
          style={{
            width: 40,
            height: 4,
            background: "var(--c-border)",
            borderRadius: 99,
            margin: "12px auto 0",
          }}
        />

        {/* Header */}
        <div style={{ padding: "20px 24px 12px" }}>
          <h3
            className="t-h3 c-ink"
            style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}
          >
            {isRegistering ? "Daftar Mitra ResQ" : "Ganti Mode Akun"}
          </h3>
          <p className="t-xs c-muted" style={{ textTransform: "none", fontSize: 12 }}>
            {isRegistering 
              ? "Masukkan nama toko/restoran Anda untuk mulai menyelamatkan makanan."
              : "Satu akun, dua peran. Beralih kapan saja seperti di media sosial."}
          </p>
        </div>

        {/* Content */}
        {isRegistering ? (
          <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="t-xs c-muted" style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Nama Toko / Restoran</label>
              <input
                type="text"
                placeholder="Contoh: Kedai Makmur"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: "var(--radius-md)",
                  border: "1.5px solid var(--c-border)", background: "var(--c-surface)",
                  fontSize: 15, fontFamily: "inherit", outline: "none"
                }}
                autoFocus
              />
            </div>
            
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button
                onClick={() => setIsRegistering(false)}
                style={{
                  flex: 1, padding: "14px", borderRadius: "var(--radius-pill)",
                  background: "var(--c-faint)", color: "var(--c-ink)", fontWeight: 700, fontSize: 14,
                  border: "none", cursor: "pointer"
                }}
                disabled={loading}
              >
                Kembali
              </button>
              <button
                onClick={handleRegister}
                style={{
                  flex: 2, padding: "14px", borderRadius: "var(--radius-pill)",
                  background: "var(--c-brand)", color: "#fff", fontWeight: 700, fontSize: 14,
                  border: "none", cursor: "pointer", opacity: loading || !storeName.trim() ? 0.6 : 1
                }}
                disabled={loading || !storeName.trim()}
              >
                {loading ? "Memproses..." : "Daftar & Masuk"}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "0 16px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
          {/* Consumer Mode Card */}
          <button
            onClick={() => handleSwitch("consumer")}
            style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              background:
                mode === "consumer"
                  ? "linear-gradient(135deg, rgba(14,165,233,0.06), rgba(16,185,129,0.04))"
                  : "var(--c-surface)",
              border:
                mode === "consumer"
                  ? "2px solid rgba(14,165,233,0.25)"
                  : "1.5px solid var(--c-border)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.25s ease",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                background:
                  mode === "consumer"
                    ? "linear-gradient(135deg, #0EA5E9, #10B981)"
                    : "var(--c-faint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0,
                boxShadow:
                  mode === "consumer"
                    ? "0 6px 20px rgba(14,165,233,0.25)"
                    : "none",
                transition: "all 0.3s ease",
              }}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 18 }}
                />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={mode === "consumer" ? "#fff" : "var(--c-muted)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 3,
                }}
              >
                <span
                  className="t-sm c-ink"
                  style={{ fontWeight: 800, fontSize: 15 }}
                >
                  Mode Konsumen
                </span>
                {mode === "consumer" && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "rgba(14,165,233,0.12)",
                      color: "#0EA5E9",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Aktif
                  </span>
                )}
              </div>
              <span
                className="t-xs c-muted"
                style={{ textTransform: "none", fontSize: 12 }}
              >
                Jelajahi & selamatkan makanan sisa berkualitas
              </span>
            </div>

            {/* Checkmark */}
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: mode === "consumer" ? "#0EA5E9" : "var(--c-faint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.25s ease",
                flexShrink: 0,
              }}
            >
              {mode === "consumer" && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </button>

          {/* Merchant Mode Card */}
          <button
            onClick={() => handleSwitch("merchant")}
            style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              background:
                mode === "merchant"
                  ? "linear-gradient(135deg, rgba(217,101,75,0.07), rgba(229,169,61,0.05))"
                  : "var(--c-surface)",
              border:
                mode === "merchant"
                  ? "2px solid rgba(217,101,75,0.2)"
                  : "1.5px solid var(--c-border)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.25s ease",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                background:
                  mode === "merchant"
                    ? "linear-gradient(135deg, var(--c-brand), var(--c-accent))"
                    : "var(--c-faint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0,
                boxShadow:
                  mode === "merchant"
                    ? "0 6px 20px rgba(217,101,75,0.3)"
                    : "none",
                transition: "all 0.3s ease",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={mode === "merchant" ? "#fff" : "var(--c-muted)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 3,
                }}
              >
                <span
                  className="t-sm c-ink"
                  style={{ fontWeight: 800, fontSize: 15 }}
                >
                  Mode Mitra (Merchant)
                </span>
                {mode === "merchant" && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "rgba(217,101,75,0.10)",
                      color: "var(--c-brand)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Aktif
                  </span>
                )}
              </div>
              <span
                className="t-xs c-muted"
                style={{ textTransform: "none", fontSize: 12 }}
              >
                Kelola listing makanan & pantau pesanan masuk
              </span>
            </div>

            {/* Checkmark */}
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background:
                  mode === "merchant" ? "var(--c-brand)" : "var(--c-faint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.25s ease",
                flexShrink: 0,
              }}
            >
              {mode === "merchant" && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </button>

          {/* Kurir Mode Card */}
          <button
            onClick={() => handleSwitch("kurir")}
            style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              background:
                mode === "kurir"
                  ? "linear-gradient(135deg, rgba(139,92,246,0.07), rgba(236,72,153,0.05))"
                  : "var(--c-surface)",
              border:
                mode === "kurir"
                  ? "2px solid rgba(139,92,246,0.2)"
                  : "1.5px solid var(--c-border)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.25s ease",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                background:
                  mode === "kurir"
                    ? "linear-gradient(135deg, #8B5CF6, #EC4899)"
                    : "var(--c-faint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0,
                boxShadow:
                  mode === "kurir"
                    ? "0 6px 20px rgba(139,92,246,0.3)"
                    : "none",
                transition: "all 0.3s ease",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={mode === "kurir" ? "#fff" : "var(--c-muted)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 3,
                }}
              >
                <span
                  className="t-sm c-ink"
                  style={{ fontWeight: 800, fontSize: 15 }}
                >
                  Mode Kurir
                </span>
                {mode === "kurir" && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "rgba(139,92,246,0.10)",
                      color: "#8B5CF6",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Aktif
                  </span>
                )}
              </div>
              <span
                className="t-xs c-muted"
                style={{ textTransform: "none", fontSize: 12 }}
              >
                Ambil order pengiriman & hasilkan uang
              </span>
            </div>

            {/* Checkmark */}
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background:
                  mode === "kurir" ? "#8B5CF6" : "var(--c-faint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.25s ease",
                flexShrink: 0,
              }}
            >
              {mode === "kurir" && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </button>

          {/* Separator */}
          <div style={{
            height: 1,
            background: "var(--c-border)",
            margin: "6px 4px",
            opacity: 0.6
          }} />

          {/* Admin Portal Option */}
          <button
            onClick={() => {
              onClose();
              router.push("/admin");
            }}
            style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "rgba(9, 9, 11, 0.02)",
              border: "1.5px dashed var(--c-border)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(9, 9, 11, 0.06)";
              e.currentTarget.style.borderColor = "var(--c-brand)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(9, 9, 11, 0.02)";
              e.currentTarget.style.borderColor = "var(--c-border)";
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                background: "linear-gradient(135deg, #18181B, #3F3F46)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                flexShrink: 0,
                boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 3,
                }}
              >
                <span
                  className="t-sm c-ink"
                  style={{ fontWeight: 800, fontSize: 15 }}
                >
                  Pusat Kendali Admin
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: "rgba(0,0,0,0.08)",
                    color: "var(--c-ink)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Terbatas
                </span>
              </div>
              <span
                className="t-xs c-muted"
                style={{ textTransform: "none", fontSize: 12 }}
              >
                Audit sistem, kelola transaksi, & validasi mitra baru
              </span>
            </div>

            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          </div>
        )}
      </div>
    </>
  );
}
