"use client";
import { useState } from "react";
import { loginWithEmail, loginWithGoogle, registerWithEmail } from "@/lib/auth";
import { useRouter } from "next/navigation";

type Tab = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) throw new Error("Nama lengkap wajib diisi");
        await registerWithEmail(email, password, name);
      }
      router.push("/");
    } catch (err: unknown) {
      console.error("Auth error details:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(
        msg.includes("invalid-credential") || msg.includes("wrong-password")
          ? "Email atau password salah"
          : msg.includes("email-already-in-use")
          ? "Email sudah terdaftar"
          : msg.includes("weak-password")
          ? "Password minimal 6 karakter"
          : msg.includes("invalid-email")
          ? "Format email tidak valid"
          : msg.includes("Firebase") || msg.includes("placeholder")
          ? `Firebase error (${msg}). Periksa konfigurasi Anda.`
          : msg
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push("/");
    } catch (err: unknown) {
      console.error("Google Auth error details:", err);
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("popup-closed") ? "Login dibatalkan" :
        msg.includes("Firebase") || msg.includes("placeholder")
          ? `Firebase error (${msg}). Periksa konfigurasi Anda.`
          : "Gagal login dengan Google"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      background: "var(--c-bg)",
    }}>
      {/* ─── Ambient Background Orbs ─── */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", borderRadius: "50%", filter: "blur(80px)", opacity: 0.35,
          background: "var(--c-brand)", width: 280, height: 280, top: -80, left: -80,
          animation: "drift 14s infinite alternate var(--ease-fluid)"
        }} />
        <div style={{
          position: "absolute", borderRadius: "50%", filter: "blur(80px)", opacity: 0.18,
          background: "var(--c-accent)", width: 220, height: 220, bottom: 40, right: -60,
          animation: "drift 18s infinite alternate-reverse var(--ease-fluid)"
        }} />
        <div style={{
          position: "absolute", borderRadius: "50%", filter: "blur(100px)", opacity: 0.2,
          background: "#FFE8D6", width: 360, height: 360, bottom: -120, left: "10%",
          animation: "drift 22s infinite alternate var(--ease-fluid)"
        }} />
      </div>

      {/* ─── Header ─── */}
      <header style={{
        padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, var(--c-brand) 0%, #C05035 100%)",
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 20px rgba(217,101,75,0.35), inset 0 1px 1px rgba(255,255,255,0.25)"
          }}>
            
          </div>
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22,
            letterSpacing: "-0.8px", color: "var(--c-ink)"
          }}>
            Res<span style={{ color: "var(--c-brand)" }}>Q</span>
          </span>
        </div>
      </header>

      {/* ─── Main Card Content ─── */}
      <main style={{
        flex: 1,
        padding: "0 24px 40px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        zIndex: 10,
        gap: 0,
      }}>

        {/* Hero Emoji + Headline */}
        <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeSlideUpBasic 0.6s var(--ease-spring) forwards" }}>
          <div style={{
            fontSize: 52, marginBottom: 16, lineHeight: 1,
            animation: "logoBreath 3s ease-in-out infinite"
          }}>
            {tab === "login" ? "" : ""}
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800,
            letterSpacing: "-1px", color: "var(--c-ink)", lineHeight: 1.1, marginBottom: 8
          }}>
            {tab === "login" ? "Selamat datang kembali" : "Buat akun baru"}
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--c-muted)", fontWeight: 400, lineHeight: 1.5 }}>
            {tab === "login"
              ? "Login untuk mulai selamatkan makanan"
              : "Bergabung dan hemat lebih banyak hari ini"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="elite-tab-container" style={{ marginBottom: 28 }}>
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`elite-tab-btn${tab === t ? " active" : ""}`}
            >
              {t === "login" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="elite-btn-secondary"
          style={{ marginBottom: 20 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Lanjut dengan Google
        </button>

        {/* Divider */}
        <div className="elite-divider" style={{ marginBottom: 20 }}>atau</div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "rgba(217,101,75,0.08)",
            color: "#B34030",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            fontSize: 13, fontWeight: 500, marginBottom: 16,
            border: "1px solid rgba(217,101,75,0.25)",
            fontFamily: "var(--font-sans)",
            display: "flex", alignItems: "flex-start", gap: 8,
            animation: "fadeSlideUpBasic 0.3s var(--ease-fluid)"
          }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}>️</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {tab === "register" && (
            <div className="elite-input-group">
              <label className="elite-input-label" htmlFor="name">Nama Lengkap</label>
              <input
                id="name"
                type="text"
                className="elite-input-field"
                placeholder="Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="elite-input-group">
            <label className="elite-input-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="elite-input-field"
              placeholder="kamu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="elite-input-group">
            <label className="elite-input-label" htmlFor="password">
              Password
              {tab === "register" && (
                <span style={{ fontWeight: 400, color: "var(--c-muted)", marginLeft: 6 }}>
                  (min. 6 karakter)
                </span>
              )}
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPass ? "text" : "password"}
                className="elite-input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                style={{ paddingRight: 52 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                style={{
                  position: "absolute", right: 14, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--c-muted)", fontSize: 18, padding: 4,
                  lineHeight: 1, display: "flex", alignItems: "center",
                }}
              >
                {showPass ? (
                  // Eye-slash icon
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  // Eye icon
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="elite-btn-primary"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: "2.5px solid rgba(255,255,255,0.35)",
                borderTopColor: "white",
                animation: "spin 0.8s linear infinite"
              }} />
            ) : (
              tab === "login" ? "Masuk ke ResQ" : "Buat Akun"
            )}
          </button>
        </form>

        {/* Bottom Link */}
        <p style={{
          textAlign: "center", marginTop: 24,
          fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--c-muted)"
        }}>
          {tab === "login" ? (
            <>
              Belum punya akun?{" "}
              <button
                onClick={() => { setTab("register"); setError(""); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--c-brand)", fontWeight: 700, fontSize: 14,
                  fontFamily: "inherit", padding: 0,
                  textDecoration: "underline", textDecorationColor: "rgba(217,101,75,0.3)"
                }}
              >
                Daftar gratis
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{" "}
              <button
                onClick={() => { setTab("login"); setError(""); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--c-brand)", fontWeight: 700, fontSize: 14,
                  fontFamily: "inherit", padding: 0,
                  textDecoration: "underline", textDecorationColor: "rgba(217,101,75,0.3)"
                }}
              >
                Masuk sekarang
              </button>
            </>
          )}
        </p>
      </main>
    </div>
  );
}
