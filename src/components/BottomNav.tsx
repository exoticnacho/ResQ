"use client";
import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccountMode } from "@/context/AccountModeContext";

const CONSUMER_TABS = [
  { href: "/", icon: "Home", match: (p: string) => p === "/" },
  { href: "/explore", icon: "Search", match: (p: string) => p.startsWith("/explore") },
  { href: "/orders", icon: "Map", match: (p: string) => p.startsWith("/orders") },
  { href: "/leaderboard", icon: "Trophy", match: (p: string) => p.startsWith("/leaderboard") },
  { href: "/profile", icon: "User", match: (p: string) => p.startsWith("/profile") },
];

const MERCHANT_TABS = [
  { href: "/donor", icon: "Dashboard", match: (p: string) => p === "/donor" || p.startsWith("/donor") },
  { href: "/leaderboard", icon: "Trophy", match: (p: string) => p.startsWith("/leaderboard") },
  { href: "/profile", icon: "User", match: (p: string) => p.startsWith("/profile") },
];

const COURIER_TABS = [
  { href: "/courier", icon: "Dashboard", match: (p: string) => p === "/courier" || p.startsWith("/courier") },
  { href: "/profile", icon: "User", match: (p: string) => p.startsWith("/profile") },
];

const HIDE_ON = ["/auth", "/food"];

interface BottomNavProps {
  onSwitchAccount?: () => void;
}

export default function BottomNav({ onSwitchAccount }: BottomNavProps) {
  const pathname = usePathname();
  const { mode } = useAccountMode();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  const tabs = mode === "kurir" ? COURIER_TABS : mode === "merchant" ? MERCHANT_TABS : CONSUMER_TABS;

  const handleProfilePointerDown = () => {
    if (!onSwitchAccount) return;
    longPressTimer.current = setTimeout(() => {
      onSwitchAccount();
    }, 500); // 500ms long-press
  };

  const handleProfilePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <nav className="elite-dock">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const isProfile = tab.icon === "User";

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`dock-item ${active ? "active" : ""}`}
            style={{ textDecoration: "none" }}
            onPointerDown={isProfile ? handleProfilePointerDown : undefined}
            onPointerUp={isProfile ? handleProfilePointerUp : undefined}
            onPointerLeave={isProfile ? handleProfilePointerUp : undefined}
            onContextMenu={(e) => { if (isProfile) e.preventDefault(); }}
          >
            {getIcon(tab.icon, active)}
          </Link>
        );
      })}
    </nav>
  );
}

function getIcon(name: string, active: boolean) {
  const s = active ? "var(--c-ink)" : "var(--c-muted)";
  const sw = active ? "2.5" : "2";

  if (name === "Home")
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s ease" }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );

  if (name === "Search")
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s ease" }}>
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    );

  if (name === "Map")
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s ease" }}>
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    );

  if (name === "Trophy")
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s ease" }}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7c0 3.31 2.69 6 6 6s6-2.69 6-6V2z" />
      </svg>
    );

  if (name === "User")
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s ease" }}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );

  if (name === "Dashboard")
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.3s ease" }}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
}
