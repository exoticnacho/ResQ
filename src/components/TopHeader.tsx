"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToUserOrders, subscribeToUserStats, Order, UserProfile } from "@/lib/db";

interface Notification {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unread: boolean;
}

interface TopHeaderProps {
  onSwitchAccount?: () => void;
}

export default function TopHeader({ onSwitchAccount: _ }: TopHeaderProps) {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubOrders = subscribeToUserOrders(user.uid, (orders: Order[]) => {
      const unsubStats = subscribeToUserStats(user.uid, (profile: UserProfile | null) => {
        const notifs: Notification[] = [];

        const completed = orders.filter(o => o.status === "completed").slice(0, 2);
        completed.forEach(o => {
          notifs.push({
            id: `completed-${o.id}`,
            title: "Penyelamatan Sukses! ",
            desc: `Kamu berhasil menyelamatkan ${o.foodName} dari ${o.donorName}. Bumi berterima kasih!`,
            icon: "",
            unread: false,
          });
        });

        const active = orders.filter(o => o.status === "active" || o.status === "ready");
        active.forEach(o => {
          const isReady = o.status === "ready";
          notifs.push({
            id: `active-${o.id}`,
            title: isReady ? "Pesanan Siap Diambil! " : "Pesanan Aktif Menunggu",
            desc: isReady
              ? `Hore! ${o.foodName} dari ${o.donorName} sudah siap diambil di lokasi.`
              : `${o.foodName} dari ${o.donorName} siap diambil. Tunjukkan ID pesanan di kasir.`,
            icon: isReady ? "" : "",
            unread: true,
          });
        });

        if (profile && profile.streak > 0) {
          notifs.push({
            id: "streak",
            title: ` ${profile.streak} Hari Streak!`,
            desc: `Kamu sudah menyelamatkan makanan ${profile.streak} hari berturut-turut. Tier kamu: ${profile.tier}.`,
            icon: "",
            unread: profile.streak === 1,
          });
        }

        if (orders.length === 0) {
          notifs.push({
            id: "welcome",
            title: "Selamat Datang di ResQ! ",
            desc: "Mulai selamatkan makanan dari restoran terdekat dan bantu kurangi food waste.",
            icon: "",
            unread: true,
          });
        }

        setNotifications(notifs);
        setHasUnread(notifs.some(n => n.unread));
      });
      return () => unsubStats();
    });

    return () => unsubOrders();
  }, [user]);

  return (
    <>
      {/* ─── Floating Notification Bell ─── */}
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          zIndex: 40,
          pointerEvents: "none",
        }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="elite-icon-btn"
          style={{
            pointerEvents: "auto",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "var(--c-surface-glass)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "var(--sh-md), var(--sh-inner-glass)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
            color: "var(--c-ink)",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {hasUnread && (
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 10,
                width: 8,
                height: 8,
                background: "var(--c-brand)",
                borderRadius: "50%",
                border: "1.5px solid var(--c-surface)",
              }}
            />
          )}
        </button>
      </div>

      {/* ─── Notifications Drawer ─── */}
      <div
        className={`drawer-backdrop ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 99,
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "all" : "none",
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          className={`drawer-content ${drawerOpen ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "85%",
            maxWidth: 360,
            background: "var(--c-surface)",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
            transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "24px 20px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--c-border)",
            }}
          >
            <h2 className="t-h2 c-ink" style={{ fontSize: 20 }}>Notifikasi</h2>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{
                background: "var(--c-bg)",
                border: "none",
                width: 32,
                height: 32,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--c-muted)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  display: "flex",
                  gap: 16,
                  padding: "16px",
                  background: notif.unread ? "rgba(217,101,75,0.05)" : "transparent",
                  borderRadius: "var(--radius-md)",
                  marginBottom: 12,
                  position: "relative",
                  border: notif.unread ? "1px solid var(--c-brand-faint)" : "1px solid transparent",
                }}
              >
                {notif.unread && (
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--c-brand)",
                    }}
                  />
                )}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--c-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {notif.icon}
                </div>
                <div>
                  <h4 className="t-sm c-ink" style={{ fontWeight: 700, marginBottom: 4 }}>{notif.title}</h4>
                  <p className="t-xs c-muted" style={{ textTransform: "none", lineHeight: 1.4 }}>{notif.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
