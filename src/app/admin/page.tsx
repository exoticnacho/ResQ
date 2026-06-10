"use client";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────
interface MerchantApplication {
  id: string;
  storeName: string;
  email: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  category?: string;
}

interface CourierApplication {
  id: string;
  name: string;
  email: string;
  vehicle: string;
  plate: string;
  status: "pending" | "approved" | "rejected";
}

interface Order {
  id: string;
  totalPrice: number;
  status: string;
  createdAt?: any;
  foodName?: string;
  donorName?: string;
  quantity?: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  totalSaved: number;
  totalCO2: number;
  tier: string;
  storeName?: string;
  role?: string;
}

type AdminTab = "overview" | "merchants" | "couriers" | "transactions" | "users" | "settings";

// ─── Helpers ─────────────────────────────────────────────────
function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function formatDate(ts: any): string {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Clean SVG Charts ─────────────────────────────────────────
function LineChart({ data, color = "var(--c-brand)", label, labels = [] }: { data: number[]; color?: string; label?: string; labels?: string[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  if (!data || data.length < 2) return <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-muted)", fontSize: 13 }}>Tidak ada data</div>;
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 400;
  const h = 120;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 20) - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div style={{ position: "relative", width: "100%", marginTop: 16 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>}
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace(/[^a-zA-Z0-9]/g,"")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#grad-${color.replace(/[^a-zA-Z0-9]/g,"")})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => {
          const x = (i / (data.length - 1)) * w;
          const y = h - ((v - min) / range) * (h - 20) - 10;
          return (
            <g key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
              <circle cx={x} cy={y} r="16" fill="transparent" style={{ cursor: "pointer" }} />
              <circle cx={x} cy={y} r={hoverIdx === i ? "6" : "5"} fill="var(--c-surface)" stroke={color} strokeWidth={hoverIdx === i ? "3" : "2.5"} style={{ transition: "all 0.2s", pointerEvents: "none" }} />
            </g>
          );
        })}
      </svg>
      {hoverIdx !== null && (
        <div style={{
          position: "absolute",
          left: `${(hoverIdx / (data.length - 1)) * 100}%`,
          top: -36,
          transform: "translateX(-50%)",
          background: "var(--c-ink)",
          color: "var(--c-surface)",
          padding: "6px 12px",
          borderRadius: "var(--radius-sm)",
          fontSize: 13,
          fontWeight: 700,
          pointerEvents: "none",
          whiteSpace: "nowrap",
          boxShadow: "var(--sh-md)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {labels[hoverIdx] && <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, marginBottom: 2 }}>{labels[hoverIdx]}</span>}
          {formatRupiah(data[hoverIdx])}
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string; border: string }> = {
    pending:   { bg: "rgba(234, 179, 8, 0.1)", color: "#ca8a04", label: "Menunggu", border: "1px solid rgba(234, 179, 8, 0.2)" },
    approved:  { bg: "rgba(34, 197, 94, 0.1)", color: "#16a34a", label: "Disetujui", border: "1px solid rgba(34, 197, 94, 0.2)" },
    rejected:  { bg: "rgba(239, 68, 68, 0.1)", color: "#dc2626", label: "Ditolak", border: "1px solid rgba(239, 68, 68, 0.2)" },
    active:    { bg: "rgba(59, 130, 246, 0.1)", color: "#2563eb", label: "Aktif", border: "1px solid rgba(59, 130, 246, 0.2)" },
    completed: { bg: "rgba(34, 197, 94, 0.1)", color: "#16a34a", label: "Selesai", border: "1px solid rgba(34, 197, 94, 0.2)" },
    cancelled: { bg: "rgba(239, 68, 68, 0.1)", color: "#dc2626", label: "Dibatalkan", border: "1px solid rgba(239, 68, 68, 0.2)" },
    refunded:  { bg: "rgba(168, 85, 247, 0.1)", color: "#9333ea", label: "Di-Refund", border: "1px solid rgba(168, 85, 247, 0.2)" },
    ready:     { bg: "rgba(59, 130, 246, 0.1)", color: "#2563eb", label: "Siap", border: "1px solid rgba(59, 130, 246, 0.2)" },
  };
  const s = map[status] || { bg: "rgba(9, 9, 11, 0.02)", color: "var(--c-muted)", label: status, border: "1px solid rgba(9, 9, 11, 0.05)" };
  return (
    <span style={{ 
      background: s.bg, color: s.color, border: s.border,
      borderRadius: "6px", padding: "4px 8px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center"
    }}>
      {s.label}
    </span>
  );
}

// ─── Stat Card ───────────────────────────────
function StatCard({ icon, label, value, sub, accent = "var(--c-ink)" }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="elite-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40, height: 40,
          borderRadius: 12,
          background: `color-mix(in srgb, ${accent} 10%, transparent)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accent,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-muted)" }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "var(--c-ink)", letterSpacing: "-0.5px", lineHeight: 1, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: "var(--c-muted)", fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

// ─── Main Admin Component ─────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [merchants, setMerchants] = useState<MerchantApplication[]>([]);
  const [couriers, setCouriers] = useState<CourierApplication[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoAccept, setAutoAccept] = useState(false);
  const [autoAcceptCouriers, setAutoAcceptCouriers] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // System Settings (As defined in PRD)
  const [feePercent, setFeePercent] = useState("2000");
  const [deliveryMargin, setDeliveryMargin] = useState("0");

  // ─── Auth Gate (simple PIN) ───────────────────────────────
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const ADMIN_PIN = "resqadmin2026";

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Keyboard shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ─── Fetch data ───────────────────────────────────────────
  useEffect(() => {
    if (!authenticated || !db) return;
    setLoading(true);

    const unsubSettings = onSnapshot(doc(db, "settings", "platform"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.feePercent !== undefined) setFeePercent(String(data.feePercent));
        if (data.deliveryMargin !== undefined) setDeliveryMargin(String(data.deliveryMargin));
      }
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const allUsers: UserProfile[] = [];
      const allMerchants: MerchantApplication[] = [];
      const allCouriers: CourierApplication[] = [];

      snap.forEach((d) => {
        const data = d.data();
        allUsers.push({ id: d.id, ...data } as UserProfile);
        
        // Merchants
        if (data.storeName) {
          allMerchants.push({
            id: d.id,
            storeName: data.storeName,
            name: data.name || "—",
            email: data.email || "—",
            status: data.merchantStatus || "pending",
            category: data.storeCategory || "Makanan & Minuman",
          });
        }
        
        // Couriers (Assuming role courier or vehicle present)
        if (data.role === "courier" || data.vehiclePlate) {
          allCouriers.push({
            id: d.id,
            name: data.name || "—",
            email: data.email || "—",
            vehicle: data.vehicle || "Motor",
            plate: data.vehiclePlate || "—",
            status: data.courierStatus || "pending",
          });
        }
      });
      setUsers(allUsers);
      setMerchants(allMerchants);
      setCouriers(allCouriers);
    });

    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
      const ords: Order[] = [];
      snap.forEach((d) => ords.push({ id: d.id, ...d.data() } as Order));
      setOrders(ords);
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubUsers();
      unsubOrders();
    };
  }, [authenticated]);

  // ─── Auto Accept Logic (Merchants) ─────────────────────────
  useEffect(() => {
    if (autoAccept && merchants.length > 0) {
      const pending = merchants.filter(m => m.status === "pending");
      if (pending.length > 0) {
        pending.forEach(async (m) => {
          try { await updateDoc(doc(db, "users", m.id), { merchantStatus: "approved" }); } catch(e) {}
        });
        triggerToast(`${pending.length} Mitra otomatis disetujui.`);
      }
    }
  }, [autoAccept, merchants]);

  // ─── Auto Accept Logic (Couriers) ──────────────────────────
  useEffect(() => {
    if (autoAcceptCouriers && couriers.length > 0) {
      const pending = couriers.filter(c => c.status === "pending");
      if (pending.length > 0) {
        pending.forEach(async (c) => {
          try { await updateDoc(doc(db, "users", c.id), { courierStatus: "approved" }); } catch(e) {}
        });
        triggerToast(`${pending.length} Kurir otomatis disetujui.`);
      }
    }
  }, [autoAcceptCouriers, couriers]);

  // ─── Actions ──────────────────────────────────────────────
  const handleAction = async (collectionName: string, docId: string, field: string, value: string, successMsg: string) => {
    setActionLoading(docId + value);
    try {
      await updateDoc(doc(db, collectionName, docId), { [field]: value });
      triggerToast(successMsg);
    } catch {
      triggerToast("Terjadi kesalahan sistem.");
    }
    setActionLoading(null);
  };

  const handleAcceptAll = async (type: "merchants" | "couriers") => {
    setActionLoading("acceptAll" + type);
    const list = type === "merchants" ? merchants : couriers;
    const pending = list.filter(m => m.status === "pending");
    const field = type === "merchants" ? "merchantStatus" : "courierStatus";
    for (const m of pending) {
      try { await updateDoc(doc(db, "users", m.id), { [field]: "approved" }); } catch(e) {}
    }
    if (pending.length > 0) triggerToast(`${pending.length} ${type === "merchants" ? "Mitra" : "Kurir"} disetujui.`);
    setActionLoading(null);
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      triggerToast("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = ["ID Pesanan", "Tanggal", "Item", "Mitra", "Total Harga", "Status"];
    const rows = orders.map(o => {
      let dateStr = "";
      if (o.createdAt) {
        const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        dateStr = d.toISOString();
      }
      return [
        o.id,
        dateStr,
        `"${(o.foodName || "Pesanan ResQ").replace(/"/g, '""')}"`,
        `"${(o.donorName || "Tidak diketahui").replace(/"/g, '""')}"`,
        o.totalPrice || 0,
        o.status || ""
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `resq_transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast("Data Transaksi berhasil diekspor ke CSV.");
  };

  const handleSaveSettings = async () => {
    setActionLoading("saveSettings");
    try {
      await setDoc(doc(db, "settings", "platform"), {
        feePercent: parseInt(feePercent) || 0,
        deliveryMargin: parseInt(deliveryMargin) || 0,
      }, { merge: true });
      triggerToast("Pengaturan platform berhasil diperbarui.");
    } catch (err: any) {
      triggerToast("Gagal menyimpan pengaturan: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Analytics computations ───────────────────────────────
  const totalRevenue = orders.filter(o => o.status === "completed").reduce((s, o) => s + (o.totalPrice || 0), 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const pendingMerchants = merchants.filter(m => m.status === "pending").length;
  const pendingCouriers = couriers.filter(c => c.status === "pending").length;
  const totalUsers = users.length;

  const now = Date.now();
  const dayMs = 86400000;
  const revenueByDay = Array.from({ length: 7 }, (_, i) => {
    const start = now - (6 - i) * dayMs;
    const end = start + dayMs;
    return orders.filter(o => o.status === "completed" && (o.createdAt?.toMillis?.() || 0) >= start && (o.createdAt?.toMillis?.() || 0) < end).reduce((s, o) => s + (o.totalPrice || 0), 0);
  });
  const dayLabels = Array.from({ length: 7 }, (_, i) => new Date(now - (6 - i) * dayMs).toLocaleDateString("id-ID", { weekday: "short" }));

  // Filters
  const filteredMerchants = merchants.filter(m => (m.storeName || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredCouriers = couriers.filter(c => (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.plate || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOrders = orders.filter(o => (o.id || "").toLowerCase().includes(searchTerm.toLowerCase()) || (o.donorName || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsers = users.filter(u => (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()));

  // ─── PIN Screen (Clean Design) ──────────────────────────
  if (!authenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="elite-card" style={{ width: "100%", maxWidth: 400, textAlign: "center", padding: "48px 32px" }}>
          <div style={{ width: 56, height: 56, borderRadius: "var(--radius-md)", background: "var(--c-brand)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--sh-md)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h1 className="t-h2" style={{ marginBottom: 8 }}>ResQ Admin</h1>
          <p className="t-body" style={{ marginBottom: 32 }}>Silakan masukkan kode akses administrator.</p>
          <div className="elite-input-group" style={{ marginBottom: 24 }}>
            <input type="password" placeholder="Access Code" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && pin === ADMIN_PIN) setAuthenticated(true); }} className="elite-input-field" style={{ textAlign: "center", letterSpacing: "2px" }} autoFocus />
          </div>
          <button className="elite-btn-primary" onClick={() => { if (pin === ADMIN_PIN) setAuthenticated(true); else triggerToast("Akses Ditolak."); }}>
            Masuk ke Console
          </button>
        </div>
        {toast && <div style={{ position: "fixed", bottom: 32, padding: "12px 24px", background: "#DC2626", color: "#fff", borderRadius: "var(--radius-pill)", fontSize: 14, fontWeight: 600, boxShadow: "var(--sh-md)", zIndex: 9999 }}>{toast}</div>}
      </div>
    );
  }

  // ─── Main Render (Clean Enterprise UI) ─────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)", color: "var(--c-ink)", display: "flex", flexDirection: "row" }}>
      
      {/* ─── Command Palette (Ctrl+K) ─── */}
      {cmdOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(9, 9, 11, 0.4)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "10vh" }}>
          <div className="elite-card" style={{ width: "100%", maxWidth: 600, padding: 0 }}>
            <div style={{ padding: 16, borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", gap: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search commands, users, or orders..." autoFocus className="elite-input-field" style={{ border: "none", boxShadow: "none", padding: 0, background: "transparent" }} onChange={(e) => setSearchTerm(e.target.value)} />
              <button onClick={() => setCmdOpen(false)} style={{ background: "var(--c-faint)", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 12, cursor: "pointer", color: "var(--c-muted)", fontWeight: 600 }}>ESC</button>
            </div>
            <div style={{ padding: 8 }}>
              <div style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quick Links</div>
              <div style={{ padding: "12px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: "var(--c-ink)", fontWeight: 500 }} onClick={() => {setTab("merchants"); setCmdOpen(false);}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Kelola Mitra Baru
              </div>
              <div style={{ padding: "12px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: "var(--c-ink)", fontWeight: 500 }} onClick={() => {setTab("transactions"); setCmdOpen(false);}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Laporan Transaksi
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Sidebar ─── */}
      <aside style={{ width: 260, display: "flex", flexDirection: "column", background: "var(--c-surface)", borderRight: "1px solid var(--c-border)", height: "100vh", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ padding: "32px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--c-brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--c-ink)", letterSpacing: "-0.5px", lineHeight: 1 }}>ResQ Admin</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "0 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          {([
            { id: "overview", label: "Dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg> },
            { id: "merchants", label: "Mitra Resto", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, badge: pendingMerchants > 0 ? pendingMerchants : null },
            { id: "couriers", label: "Manajemen Kurir", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, badge: pendingCouriers > 0 ? pendingCouriers : null },
            { id: "transactions", label: "Transaksi", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
            { id: "users", label: "Pengguna", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            { id: "settings", label: "Pengaturan", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
          ] as { id: AdminTab; label: string; icon: React.ReactNode; badge?: number | null }[]).map((item) => (
            <button key={item.id} onClick={() => { setTab(item.id); setSearchTerm(""); }}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: "var(--radius-md)",
                background: tab === item.id ? "var(--c-faint)" : "transparent",
                color: tab === item.id ? "var(--c-ink)" : "var(--c-muted)", 
                fontSize: 14, fontWeight: tab === item.id ? 600 : 500,
                textAlign: "left", width: "100%", cursor: "pointer", border: "none",
                transition: "all 0.2s"
              }}>
              <span style={{ color: tab === item.id ? "var(--c-brand)" : "inherit" }}>{item.icon}</span>
              {item.label}
              {item.badge && <span style={{ marginLeft: "auto", background: "var(--c-brand)", color: "#fff", borderRadius: "var(--radius-pill)", padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: "20px 16px", borderTop: "1px solid var(--c-border)" }}>
          <button onClick={() => setCmdOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "var(--c-faint)", border: "none", borderRadius: "var(--radius-md)", padding: "10px 12px", color: "var(--c-muted)", fontSize: 13, fontWeight: 500, cursor: "pointer", marginBottom: 16 }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Search...</span>
            <span style={{ background: "var(--c-surface)", padding: "2px 6px", borderRadius: 4, fontSize: 11, border: "1px solid var(--c-border)" }}>Ctrl K</span>
          </button>
          <button onClick={() => setAuthenticated(false)} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", color: "var(--c-ink-light)", fontSize: 14, fontWeight: 600, padding: "8px 12px", width: "100%" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Keluar
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main style={{ flex: 1, padding: "48px 64px", overflowY: "auto", position: "relative" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <h1 className="t-h1" style={{ marginBottom: 4 }}>
                {tab === "overview" && "Dashboard Analytics"}
                {tab === "merchants" && "Verifikasi Mitra"}
                {tab === "couriers" && "Manajemen Kurir"}
                {tab === "transactions" && "Transaksi & Audit"}
                {tab === "users" && "Data Pengguna"}
                {tab === "settings" && "Pengaturan Sistem"}
              </h1>
              <p className="t-body">
                {tab === "overview" && "Ringkasan performa platform secara real-time."}
                {tab === "merchants" && "Tinjau dan setujui pendaftaran mitra restoran baru."}
                {tab === "couriers" && "Kelola pendaftaran kurir pengiriman."}
                {tab === "transactions" && "Pantau transaksi, pesanan, dan manajemen keuangan."}
                {tab === "users" && "Database pengguna yang terdaftar di ResQ."}
                {tab === "settings" && "Konfigurasi variabel inti sistem platform."}
              </p>
            </div>
            
            {tab !== "overview" && tab !== "settings" && (
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Cari data..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="elite-input-field" style={{ paddingLeft: 40, width: 260, background: "var(--c-surface)" }} />
              </div>
            )}
            
            {tab === "transactions" && (
              <button className="elite-btn-secondary" onClick={handleExportCSV} style={{ width: "auto", padding: "10px 20px", marginLeft: 16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(3, 1fr)" }}>
              {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 140, borderRadius: "var(--radius-md)" }} />)}
              <div className="shimmer" style={{ height: 400, borderRadius: "var(--radius-md)", gridColumn: "span 3" }} />
            </div>
          ) : (
            <>
              {/* ══════ OVERVIEW ══════ */}
              {tab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
                    <StatCard label="Total Penjualan (GMV)" value={formatRupiah(totalRevenue)} sub="Gross Merchandise Value" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} accent="#16a34a" />
                    <StatCard label="Total Pesanan" value={totalOrders} sub={`${completedOrders} selesai`} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>} accent="#3b82f6" />
                    <StatCard label="Pengguna Aktif" value={totalUsers} sub="Termasuk mitra & kurir" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} accent="#9333ea" />
                  </div>

                  <div className="elite-card" style={{ padding: "32px", borderRadius: "var(--radius-lg)" }}>
                    <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 className="t-h3" style={{ marginBottom: 4 }}>Tren Pendapatan</h3>
                        <p className="t-sm">Performa transaksi 7 hari terakhir</p>
                      </div>
                      <div style={{ background: "rgba(9, 9, 11, 0.04)", color: "var(--c-ink)", border: "1px solid rgba(9, 9, 11, 0.05)", padding: "4px 8px", borderRadius: "6px", fontSize: 11, fontWeight: 700 }}>+12.4% vs Minggu Lalu</div>
                    </div>
                    <LineChart data={revenueByDay} color="var(--c-brand)" labels={dayLabels} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                      {dayLabels.map((d, i) => <span key={i} style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 500 }}>{d}</span>)}
                    </div>
                  </div>
                </div>
              )}

              {/* ══════ MERCHANTS ══════ */}
              {tab === "merchants" && (
                <div className="elite-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--c-surface)" }}>
                    <h3 className="t-h3">Daftar Mitra Restoran</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--c-ink)", cursor: "pointer" }}>
                        <input type="checkbox" checked={autoAccept} onChange={e => setAutoAccept(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--c-brand)" }} />
                        Auto-Accept
                      </label>
                      <button className="elite-btn-secondary" style={{ padding: "8px 16px", width: "auto", fontSize: 13 }} onClick={() => handleAcceptAll("merchants")} disabled={!!actionLoading}>
                        Setujui Semua Pending
                      </button>
                    </div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "var(--c-faint)", color: "var(--c-muted)" }}>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Nama Toko</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Kategori</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Pemilik</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Status</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600, textAlign: "right" }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMerchants.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--c-muted)" }}>Tidak ada data mitra ditemukan.</td></tr>
                        ) : filteredMerchants.map(m => (
                          <tr key={m.id} style={{ borderBottom: "1px solid var(--c-border)", transition: "background 0.2s" }} className="table-row-hover">
                            <td style={{ padding: "16px 24px", fontWeight: 600 }}>{m.storeName}</td>
                            <td style={{ padding: "16px 24px", color: "var(--c-muted)" }}>{m.category}</td>
                            <td style={{ padding: "16px 24px" }}>
                              <div>{m.name}</div>
                              <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{m.email}</div>
                            </td>
                            <td style={{ padding: "16px 24px" }}><StatusBadge status={m.status} /></td>
                            <td style={{ padding: "16px 24px", textAlign: "right" }}>
                              {m.status === "pending" && (
                                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                  <button onClick={() => handleAction("users", m.id, "merchantStatus", "approved", "Mitra disetujui")} style={{ background: "var(--c-ink)", color: "var(--c-surface)", border: "none", padding: "6px 12px", borderRadius: "6px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Terima</button>
                                  <button onClick={() => handleAction("users", m.id, "merchantStatus", "rejected", "Mitra ditolak")} style={{ background: "transparent", color: "var(--c-muted)", border: "1px solid var(--c-faint)", padding: "5px 12px", borderRadius: "6px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Tolak</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ══════ COURIERS ══════ */}
              {tab === "couriers" && (
                <div className="elite-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--c-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 className="t-h3">Verifikasi Kurir</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--c-ink)", cursor: "pointer" }}>
                        <input type="checkbox" checked={autoAcceptCouriers} onChange={e => setAutoAcceptCouriers(e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--c-brand)" }} />
                        Auto-Accept
                      </label>
                      <button className="elite-btn-secondary" style={{ padding: "8px 16px", width: "auto", fontSize: 13 }} onClick={() => handleAcceptAll("couriers")} disabled={!!actionLoading}>
                        Setujui Semua Pending
                      </button>
                    </div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "var(--c-faint)", color: "var(--c-muted)" }}>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Nama Kurir</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Kendaraan</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Plat Nomor</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Status</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600, textAlign: "right" }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCouriers.length === 0 ? (
                           <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--c-muted)" }}>Tidak ada data kurir ditemukan.</td></tr>
                        ) : filteredCouriers.map(c => (
                          <tr key={c.id} style={{ borderBottom: "1px solid var(--c-border)" }}>
                            <td style={{ padding: "16px 24px" }}>
                              <div style={{ fontWeight: 600 }}>{c.name}</div>
                              <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{c.email}</div>
                            </td>
                            <td style={{ padding: "16px 24px" }}>{c.vehicle}</td>
                            <td style={{ padding: "16px 24px", fontFamily: "monospace", fontWeight: 600 }}>{c.plate}</td>
                            <td style={{ padding: "16px 24px" }}><StatusBadge status={c.status} /></td>
                            <td style={{ padding: "16px 24px", textAlign: "right" }}>
                              {c.status === "pending" && (
                                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                  <button onClick={() => handleAction("users", c.id, "courierStatus", "approved", "Kurir disetujui")} style={{ background: "var(--c-ink)", color: "var(--c-surface)", border: "none", padding: "6px 12px", borderRadius: "6px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Terima</button>
                                  <button onClick={() => handleAction("users", c.id, "courierStatus", "rejected", "Kurir ditolak")} style={{ background: "transparent", color: "var(--c-muted)", border: "1px solid var(--c-faint)", padding: "5px 12px", borderRadius: "6px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Tolak</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ══════ TRANSACTIONS ══════ */}
              {tab === "transactions" && (
                <div className="elite-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "var(--c-faint)", color: "var(--c-muted)" }}>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>ID Pesanan</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Tanggal</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Item</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Total Harga</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--c-muted)" }}>Tidak ada transaksi.</td></tr>
                        ) : filteredOrders.map(o => (
                          <tr key={o.id} style={{ borderBottom: "1px solid var(--c-border)" }}>
                            <td style={{ padding: "16px 24px", fontFamily: "monospace", color: "var(--c-muted)" }}>{o.id.substring(0,8).toUpperCase()}</td>
                            <td style={{ padding: "16px 24px" }}>{formatDate(o.createdAt)}</td>
                            <td style={{ padding: "16px 24px" }}>
                              <div style={{ fontWeight: 600 }}>{o.foodName || "Pesanan ResQ"}</div>
                              <div style={{ fontSize: 12, color: "var(--c-muted)" }}>Mitra: {o.donorName || "Tidak diketahui"}</div>
                            </td>
                            <td style={{ padding: "16px 24px", fontWeight: 600 }}>{formatRupiah(o.totalPrice)}</td>
                            <td style={{ padding: "16px 24px" }}><StatusBadge status={o.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ══════ USERS ══════ */}
              {tab === "users" && (
                <div className="elite-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: "var(--c-faint)", color: "var(--c-muted)" }}>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Pengguna</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Tier</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Total Hemat</th>
                          <th style={{ padding: "12px 24px", fontWeight: 600 }}>Dampak CO2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", color: "var(--c-muted)" }}>Tidak ada data.</td></tr>
                        ) : filteredUsers.map(u => (
                          <tr key={u.id} style={{ borderBottom: "1px solid var(--c-border)" }}>
                            <td style={{ padding: "16px 24px" }}>
                              <div style={{ fontWeight: 600 }}>{u.name || "Anonim"}</div>
                              <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{u.email}</div>
                            </td>
                            <td style={{ padding: "16px 24px" }}>
                              <span style={{ padding: "4px 8px", background: "var(--c-faint)", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                {u.tier || "BRONZE"}
                              </span>
                            </td>
                            <td style={{ padding: "16px 24px", fontWeight: 600 }}>{formatRupiah(u.totalSaved || 0)}</td>
                            <td style={{ padding: "16px 24px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#059669", fontWeight: 600 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                {u.totalCO2 || 0} kg
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ══════ SETTINGS ══════ */}
              {tab === "settings" && (
                <div className="elite-card" style={{ padding: "32px", maxWidth: 600 }}>
                  <h3 className="t-h3" style={{ marginBottom: 24 }}>Konfigurasi Sistem Platform</h3>
                  
                  <div className="elite-input-group" style={{ marginBottom: 24 }}>
                    <label className="elite-input-label">Komisi Platform (Rp)</label>
                    <input type="number" className="elite-input-field" value={feePercent} onChange={e => setFeePercent(e.target.value)} />
                    <p style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 4 }}>Biaya komisi flat (rupiah) dari setiap transaksi selesai.</p>
                  </div>
                  
                  <div className="elite-input-group" style={{ marginBottom: 32 }}>
                    <label className="elite-input-label">Margin Ongkos Kirim (IDR)</label>
                    <input type="number" className="elite-input-field" value={deliveryMargin} onChange={e => setDeliveryMargin(e.target.value)} />
                    <p style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 4 }}>Margin tambahan untuk platform di luar tarif dasar kurir.</p>
                  </div>

                  <button className="elite-btn-primary" onClick={handleSaveSettings} disabled={!!actionLoading}>
                    {actionLoading === "saveSettings" ? "Menyimpan..." : "Simpan Pengaturan"}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
        
        {/* Global Toast */}
        {toast && (
          <div style={{ position: "fixed", bottom: 32, right: 32, background: "var(--c-ink)", color: "var(--c-surface)", padding: "12px 20px", borderRadius: "var(--radius-md)", fontSize: 14, fontWeight: 600, boxShadow: "var(--sh-lg)", zIndex: 9999, display: "flex", alignItems: "center", gap: 8, animation: "fadeSlideUpBasic 0.3s ease forwards" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}
