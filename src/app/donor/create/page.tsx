"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { addListing } from "@/lib/db";

export default function CreateListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    originalPrice: "",
    rescuePrice: "",
    quantity: "",
    expiryHours: "2",
    isPickup: true,
    isDelivery: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = ["Nasi", "Roti & Pastry", "Mie & Pasta", "Jepang", "Ayam & Daging", "Minuman & Snack", "Lainnya"];

  function handleChange(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      alert("Harap login terlebih dahulu!");
      return;
    }
    setSubmitting(true);
    try {
      const now = Date.now();
      const expiresAt = now + parseFloat(form.expiryHours) * 3600000;

      const listingData = {
        name: form.name,
        description: form.description,
        originalPrice: parseInt(form.originalPrice),
        rescuePrice: parseInt(form.rescuePrice),
        quantity: parseInt(form.quantity),
        category: form.category,
        donorName: user.displayName || "Mitra ResQ",
        donorId: user.uid,
        donorAddress: "Lokasi Anda saat ini", // Mock address
        lat: -6.2088,
        lng: 106.8456,
        expiresAt,
        imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80", // Default image
        isPickup: form.isPickup,
        isDelivery: form.isDelivery
      };

      await addListing(listingData);
      setSuccess(true);
      setTimeout(() => router.push("/donor"), 2000);
    } catch (err: any) {
      alert("Gagal membuat listing: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const discountPct = form.originalPrice && form.rescuePrice
    ? Math.round((1 - Number(form.rescuePrice) / Number(form.originalPrice)) * 100)
    : 0;

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        
        <h2 className="font-extrabold text-2xl">Listing Berhasil Dibuat!</h2>
        <p className="text-sm text-muted" style={{ marginTop: 8 }}>Makananmu sudah live dan siap ditemukan konsumen.</p>
      </div>
    );
  }

  return (
    <>
      <header style={{
        position: "sticky", top: 0, zIndex: 90,
        padding: "12px 16px",
        background: "rgba(255,243,230,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-light)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button className="btn-icon" onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="font-bold" style={{ fontSize: 16 }}>Buat Listing Baru</span>
      </header>

      <main style={{ padding: "16px 16px 100px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Nama Makanan */}
          <div className="input-group">
            <label className="input-label" htmlFor="name">Nama Makanan *</label>
            <input id="name" className="input-field" placeholder="cth: Nasi Box Ayam Geprek" required value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
          </div>

          {/* Kategori */}
          <div className="input-group">
            <label className="input-label" htmlFor="category">Kategori *</label>
            <select id="category" className="input-field" required value={form.category} onChange={(e) => handleChange("category", e.target.value)}>
              <option value="">Pilih kategori...</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Deskripsi */}
          <div className="input-group">
            <label className="input-label" htmlFor="desc">Deskripsi</label>
            <textarea
              id="desc" className="input-field" placeholder="Jelaskan isi makanan, kondisi, dll..."
              rows={3} value={form.description} onChange={(e) => handleChange("description", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Harga */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="orig">Harga Normal (Rp) *</label>
              <input id="orig" className="input-field" type="number" placeholder="35000" required value={form.originalPrice} onChange={(e) => handleChange("originalPrice", e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="rescue">Harga Rescue (Rp) *</label>
              <input id="rescue" className="input-field" type="number" placeholder="12000" required value={form.rescuePrice} onChange={(e) => handleChange("rescuePrice", e.target.value)} />
            </div>
          </div>

          {/* Discount preview */}
          {discountPct > 0 && (
            <div style={{
              background: "var(--terracotta-muted)", borderRadius: "var(--radius-md)",
              padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>️</span>
              <span className="font-semibold" style={{ fontSize: 14, color: "var(--terracotta-dark)" }}>
                Diskon {discountPct}% — konsumen hemat Rp {(Number(form.originalPrice) - Number(form.rescuePrice)).toLocaleString("id-ID")}
              </span>
            </div>
          )}

          {/* Kuantitas + Expiry */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="input-group">
              <label className="input-label" htmlFor="qty">Jumlah Porsi *</label>
              <input id="qty" className="input-field" type="number" min="1" placeholder="5" required value={form.quantity} onChange={(e) => handleChange("quantity", e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="exp">Kadaluarsa (jam)</label>
              <select id="exp" className="input-field" value={form.expiryHours} onChange={(e) => handleChange("expiryHours", e.target.value)}>
                <option value="1">1 jam</option>
                <option value="2">2 jam</option>
                <option value="3">3 jam</option>
                <option value="4">4 jam</option>
                <option value="6">6 jam</option>
              </select>
            </div>
          </div>

          {/* Metode */}
          <div className="input-group">
            <label className="input-label">Metode Pengambilan *</label>
            <div className="flex gap-3">
              {[
                { key: "isPickup", label: " Pickup", desc: "Konsumen datang sendiri" },
                { key: "isDelivery", label: " Delivery", desc: "Kurir antar ke konsumen" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => handleChange(opt.key, !form[opt.key as keyof typeof form])}
                  style={{
                    flex: 1, padding: "12px 8px",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${form[opt.key as keyof typeof form] ? "var(--terracotta)" : "var(--border-light)"}`,
                    background: form[opt.key as keyof typeof form] ? "var(--terracotta-muted)" : "var(--cream-card)",
                    cursor: "pointer", fontFamily: "inherit",
                    textAlign: "center",
                  }}
                >
                  <div className="font-bold" style={{ fontSize: 13, color: form[opt.key as keyof typeof form] ? "var(--terracotta-dark)" : "var(--dark-secondary)" }}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Lokasi placeholder */}
          <div className="input-group">
            <label className="input-label"> Lokasi Pickup</label>
            <div style={{
              height: 120, background: "var(--cream-dark)",
              borderRadius: "var(--radius-md)", border: "1.5px dashed var(--border)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <span style={{ fontSize: 28 }}>️</span>
              <span className="text-sm text-muted">Tap untuk pilih lokasi di peta</span>
              <span className="text-xs text-muted">(Coming soon — gunakan GPS otomatis)</span>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? (
              <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
            ) : " Publish Listing"}
          </button>
        </form>
      </main>
    </>
  );
}
