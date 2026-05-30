"use client";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { subscribeToMyListings, addListing, updateListing, deleteListing, subscribeToDonorOrders, updateOrderStatus, Order } from "@/lib/db";
import { FoodListing, CATEGORIES } from "@/lib/seedData";
import AccountSwitcherSheet from "@/components/AccountSwitcherSheet";

export default function DonorDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [rescuePrice, setRescuePrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState(CATEGORIES[1]); // Default to "Nasi"
  const [isPickup, setIsPickup] = useState(true);
  const [isDelivery, setIsDelivery] = useState(true);
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80"); // Mock image
  const [loading, setLoading] = useState(false);
  const [editListingId, setEditListingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubListings = subscribeToMyListings(user.uid, (data) => {
      setListings(data);
    });
    const unsubOrders = subscribeToDonorOrders(user.uid, (data) => {
      setOrders(data);
    });
    return () => {
      unsubListings();
      unsubOrders();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const now = Date.now();
      const expiresAt = now + 4 * 3600000; // Default expire in 4 hours
      
      const listingData = {
        name,
        description,
        originalPrice: parseInt(originalPrice),
        rescuePrice: parseInt(rescuePrice),
        quantity: parseInt(quantity),
        category,
        donorName: user.displayName || "Mitra ResQ",
        donorId: user.uid,
        donorAddress: "Lokasi Anda saat ini", // Mock address
        lat: -6.2088,
        lng: 106.8456,
        expiresAt,
        imageUrl,
        isPickup,
        isDelivery
      };

      if (editListingId) {
        await updateListing(editListingId, listingData);
      } else {
        await addListing(listingData);
      }

      setShowForm(false);
      setName("");
      setDescription("");
      setOriginalPrice("");
      setRescuePrice("");
      setQuantity("1");
      setImageUrl("https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80");
      setEditListingId(null);
    } catch (err: any) {
      alert("Gagal memproses makanan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editListingId) return;
    if (!confirm("Apakah Anda yakin ingin menghapus listing makanan ini?")) return;
    setLoading(true);
    try {
      await deleteListing(editListingId);
      setShowForm(false);
      setName("");
      setDescription("");
      setOriginalPrice("");
      setRescuePrice("");
      setQuantity("1");
      setImageUrl("https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80");
      setEditListingId(null);
    } catch (err: any) {
      alert("Gagal menghapus makanan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: "active" | "ready" | "completed" | "cancelled") => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (err: any) {
      alert("Gagal memperbarui status pesanan: " + err.message);
    }
  };

  // Financial and CO2 Stats Calculations
  const completedOrReadyOrders = orders.filter(o => o.status === "completed" || o.status === "ready");
  const totalRevenue = completedOrReadyOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalPortionsSold = completedOrReadyOrders.reduce((sum, o) => sum + o.quantity, 0);
  const totalCO2Saved = parseFloat((totalPortionsSold * 0.8).toFixed(1));

  const incomingOrders = orders.filter(o => o.status === "active" || o.status === "ready");
  const pastOrders = orders.filter(o => o.status === "completed" || o.status === "cancelled");

  return (
    <ProtectedRoute>
      <div style={{ padding: "40px 24px", paddingBottom: 100, position: "relative", zIndex: 10 }}>
        
        {/* Header */}
        <header className="flex items-center gap-4" style={{ marginBottom: 24 }}>
          <div style={{ 
            width: 46, height: 46, borderRadius: "50%", 
            overflow: "hidden", border: "2.5px solid #fff", boxShadow: "var(--sh-md)" 
          }}>
            <img src={user?.photoURL || "https://i.pravatar.cc/150?img=11"} alt="Store" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <h1 className="t-h1 c-ink">Mitra ResQ</h1>
            <p className="t-xs c-muted" style={{ marginTop: 2, fontSize: 12 }}>Dasbor Penjual</p>
          </div>
        </header>

        {/* ────────────────────────────────────────────────────────
            FINANCIAL & ENVIRONMENTAL REPORTS PANEL (Bento-Style)
        ──────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 28 }} className="fade-up">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 8
          }}>
            <div className="elite-glass" style={{ padding: "16px 12px", textAlign: "center", borderRadius: "var(--radius-xl)" }}>
              
              <h4 className="t-xs c-muted" style={{ marginTop: 8, fontSize: 10 }}>PEMASUKAN</h4>
              <div className="t-h3 c-ink" style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>
                Rp {totalRevenue >= 1000 ? `${(totalRevenue/1000).toFixed(0)}k` : totalRevenue}
              </div>
            </div>
            
            <div className="elite-glass" style={{ padding: "16px 12px", textAlign: "center", borderRadius: "var(--radius-xl)" }}>
              
              <h4 className="t-xs c-muted" style={{ marginTop: 8, fontSize: 10 }}>TERJUAL</h4>
              <div className="t-h3 c-ink" style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>
                {totalPortionsSold} Porsi
              </div>
            </div>

            <div className="elite-glass" style={{ padding: "16px 12px", textAlign: "center", borderRadius: "var(--radius-xl)" }}>
              
              <h4 className="t-xs c-muted" style={{ marginTop: 8, fontSize: 10 }}>TEKAN CO₂</h4>
              <div className="t-h3 c-ink" style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>
                {totalCO2Saved} kg
              </div>
            </div>
          </div>
        </section>

        {/* Form Modal (Glass Overlay) */}
        {showForm && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)",
            display: "flex", flexDirection: "column", justifyContent: "flex-end"
          }}>
            <div style={{
              background: "var(--c-bg)", padding: "24px 24px 120px",
              borderRadius: "32px 32px 0 0", maxHeight: "85vh", overflowY: "auto"
            }} className="fade-up">
              <div className="flex justify-between items-center" style={{ marginBottom: 24 }}>
                <h3 className="t-h3 c-ink">{editListingId ? "Edit Makanan Sisa" : "Tambah Makanan Sisa"}</h3>
                <button onClick={() => { setShowForm(false); setEditListingId(null); }} className="elite-icon-btn" style={{ background: "var(--c-surface)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="elite-input-group">
                  <label className="elite-input-label">Foto Hidangan</label>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: "var(--radius-lg)",
                      border: "1.5px solid var(--c-border)", overflow: "hidden", background: "var(--c-surface)"
                    }}>
                      <img src={imageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="donor-photo-upload" 
                        style={{ display: "none" }} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === "string") {
                                setImageUrl(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor="donor-photo-upload" 
                        className="elite-icon-btn" 
                        style={{ 
                          width: "auto", display: "inline-flex", padding: "8px 16px", 
                          height: "auto", borderRadius: "var(--radius-pill)", fontSize: 13, 
                          fontWeight: 700, cursor: "pointer", background: "var(--c-surface)" 
                        }}
                      >
                         Unggah Foto
                      </label>
                      <p className="t-xs c-muted" style={{ marginTop: 4, textTransform: "none" }}>Maks 5MB. Format JPG, PNG.</p>
                    </div>
                  </div>
                </div>

                <div className="elite-input-group">
                  <label className="elite-input-label">Nama Hidangan</label>
                  <input className="elite-input-field" value={name} onChange={e => setName(e.target.value)} required placeholder="Cth: Roti Sisa Hari Ini" />
                </div>
                
                <div className="elite-input-group">
                  <label className="elite-input-label">Deskripsi</label>
                  <textarea className="elite-input-field" value={description} onChange={e => setDescription(e.target.value)} required rows={2} placeholder="Kondisi makanan..." />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div className="elite-input-group" style={{ flex: 1 }}>
                    <label className="elite-input-label">Harga Asli (Rp)</label>
                    <input className="elite-input-field" type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} required placeholder="50000" />
                  </div>
                  <div className="elite-input-group" style={{ flex: 1 }}>
                    <label className="elite-input-label">Harga ResQ (Rp)</label>
                    <input className="elite-input-field" type="number" value={rescuePrice} onChange={e => setRescuePrice(e.target.value)} required placeholder="15000" />
                  </div>
                </div>

                {/* Platform Commission Notice */}
                {rescuePrice && (
                  <div style={{
                    background: "var(--c-surface)",
                    border: "1.5px solid var(--c-border)",
                    padding: "14px 18px",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginTop: -4
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--c-muted)", fontWeight: 600 }}>
                      <span>Komisi ResQ (Platform)</span>
                      <span style={{ color: "var(--c-brand)", fontWeight: 700 }}>-Rp 2.000</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--c-ink)", fontWeight: 800, borderTop: "1px dashed var(--c-border)", paddingTop: 8 }}>
                      <span>Pendapatan Bersih (Net)</span>
                      <span style={{ color: "#10B981" }}>Rp {Math.max(0, parseInt(rescuePrice) - 2000).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <div className="elite-input-group" style={{ flex: 1 }}>
                    <label className="elite-input-label">Porsi (Qty)</label>
                    <input className="elite-input-field" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required min="1" />
                  </div>
                  <div className="elite-input-group" style={{ flex: 1 }}>
                    <label className="elite-input-label">Kategori</label>
                    <select className="elite-input-field" value={category} onChange={e => setCategory(e.target.value)}>
                      {CATEGORIES.filter(c => c !== "Semua").map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" className="elite-btn-primary" disabled={loading} style={{ marginTop: 12 }}>
                  {loading ? "Menyimpan..." : editListingId ? "Simpan Perubahan" : "Rilis ke Publik"}
                </button>
                
                {editListingId && (
                  <button 
                    type="button" 
                    onClick={handleDelete} 
                    className="elite-btn-secondary" 
                    disabled={loading} 
                    style={{ 
                      marginTop: 4, background: "var(--c-surface)", color: "#EF4444", 
                      border: "1px solid var(--c-border)", display: "flex", 
                      alignItems: "center", justifyContent: "center", gap: 8 
                    }}
                  >
                    ️ Hapus Listing
                  </button>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            INCOMING ORDERS LIST (Live Action)
        ──────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 28 }} className="fade-up delay-1">
          <h3 className="t-h3 c-ink" style={{ marginBottom: 12 }}>Pesanan Masuk ({incomingOrders.length})</h3>
          {incomingOrders.length === 0 ? (
            <div className="elite-card" style={{ padding: 20, textAlign: "center", background: "var(--c-surface)" }}>
              <p className="t-sm c-muted">Belum ada pesanan aktif dari pelanggan.</p>
            </div>
          ) : (
            <div className="flex-col gap-4">
              {incomingOrders.map(o => (
                <div key={o.id} className="elite-card flex-col" style={{ padding: 16, gap: 12 }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="t-xs c-muted">ORDER ID: #{o.id?.slice(0, 6).toUpperCase()}</span>
                      <h4 className="t-sm c-ink" style={{ fontWeight: 800, marginTop: 2 }}>{o.foodName}</h4>
                      <p className="t-xs c-muted" style={{ textTransform: "none", marginTop: 2 }}>{o.quantity} porsi • Rp {o.totalPrice.toLocaleString("id-ID")}</p>
                    </div>
                    <span className={`tag ${o.status === 'ready' ? 'tag-green' : 'tag-yellow'}`}>
                      {o.status === 'ready' ? 'Siap Diambil' : 'Sedang Diproses'}
                    </span>
                  </div>

                  <div className="flex gap-2" style={{ marginTop: 4 }}>
                    {o.status === "active" && (
                      <button
                        onClick={() => handleUpdateStatus(o.id!, "ready")}
                        className="elite-btn-primary"
                        style={{ padding: "8px 16px", fontSize: 12, flex: 1, height: "auto" }}
                      >
                        Tandai Siap Diambil 
                      </button>
                    )}
                    {o.status === "ready" && (
                      <button
                        onClick={() => handleUpdateStatus(o.id!, "completed")}
                        className="elite-btn-primary"
                        style={{ padding: "8px 16px", fontSize: 12, flex: 1, height: "auto", background: "#10B981" }}
                      >
                        Konfirmasi Diambil 
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(o.id!, "cancelled")}
                      style={{
                        padding: "8px 12px", borderRadius: "var(--radius-pill)",
                        background: "var(--c-faint)", color: "#EF4444", fontSize: 12,
                        border: "1px solid var(--c-border)", cursor: "pointer", fontWeight: 700
                      }}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Dashboard Content (Active Listings) */}
        <section className="fade-up delay-2" style={{ marginBottom: 28 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <h3 className="t-h3 c-ink">Listing Makanan Anda ({listings.length})</h3>
          </div>
          
          {listings.length === 0 ? (
            <div className="elite-card flex-col items-center justify-center" style={{ padding: 40, textAlign: "center", background: "var(--c-surface)" }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>️</div>
              <div className="t-h3 c-ink" style={{ marginBottom: 6 }}>Belum Ada Makanan</div>
              <div className="t-body c-muted">Tambahkan makanan sisa agar bisa diselamatkan.</div>
            </div>
          ) : (
            <div className="flex-col gap-4">
              {listings.map(l => (
                <div 
                  key={l.id} 
                  className="elite-card" 
                  onClick={() => {
                    setEditListingId(l.id);
                    setName(l.name);
                    setDescription(l.description);
                    setOriginalPrice(l.originalPrice.toString());
                    setRescuePrice(l.rescuePrice.toString());
                    setQuantity(l.quantity.toString());
                    setCategory(l.category);
                    setImageUrl(l.imageUrl);
                    setShowForm(true);
                  }}
                  style={{ padding: 16, display: "flex", gap: 16, alignItems: "center", cursor: "pointer" }}
                >
                  <div style={{ width: 80, height: 80, borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                    <img src={l.imageUrl} alt={l.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex justify-between items-start">
                      <h4 className="t-sm c-ink" style={{ fontWeight: 700 }}>{l.name}</h4>
                      <span className="tag tag-green">{l.quantity} Porsi</span>
                    </div>
                    <div className="t-xs c-muted" style={{ marginTop: 4 }}>Rp {l.rescuePrice.toLocaleString()} / porsi</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Past Orders History */}
        {pastOrders.length > 0 && (
          <section className="fade-up delay-3">
            <h3 className="t-h3 c-ink" style={{ marginBottom: 12 }}>Riwayat Penjualan</h3>
            <div className="flex-col gap-3">
              {pastOrders.map(o => (
                <div key={o.id} className="elite-card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 className="t-sm c-ink" style={{ fontWeight: 700 }}>{o.foodName}</h4>
                    <span className="t-xs c-muted">{o.quantity} porsi • Rp {o.totalPrice.toLocaleString("id-ID")}</span>
                  </div>
                  <span className={`tag ${o.status === 'completed' ? 'tag-green' : 'tag-yellow'}`} style={{ opacity: 0.8, fontSize: 10 }}>
                    {o.status === 'completed' ? 'Sukses' : 'Dibatalkan'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Floating Action Button */}
        <button 
          onClick={() => {
            setEditListingId(null);
            setName("");
            setDescription("");
            setOriginalPrice("");
            setRescuePrice("");
            setQuantity("1");
            setCategory(CATEGORIES[1]);
            setImageUrl("https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80");
            setShowForm(true);
          }}
          style={{
            position: "fixed", bottom: 100, right: 24, zIndex: 50,
            width: 60, height: 60, borderRadius: "50%",
            background: "var(--c-brand)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 10px 25px rgba(217,101,75,0.4), inset 0 2px 4px rgba(255,255,255,0.4)",
            border: "none", cursor: "pointer", fontSize: 24,
            transition: "transform 0.3s var(--ease-spring)"
          }}
        >
          +
        </button>

      </div>

      {/* Account Switcher Sheet */}
      <AccountSwitcherSheet
        open={showSwitcher}
        onClose={() => setShowSwitcher(false)}
      />

    </ProtectedRoute>
  );
}
