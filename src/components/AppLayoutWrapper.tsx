"use client";
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "./BottomNav";
import TopHeader from "./TopHeader";
import SplashScreen from "./SplashScreen";
import { useAuth } from "@/context/AuthContext";
import { AccountModeProvider } from "@/context/AccountModeContext";
import AccountSwitcherSheet from "./AccountSwitcherSheet";

// Pages that do NOT require authentication
const PUBLIC_PATHS = ["/auth", "/pitch", "/admin"];

function InnerWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    if (!splashDone) return;
    if (loading) return;
    if (!user && !PUBLIC_PATHS.includes(pathname)) {
      router.push("/auth");
    }
  }, [splashDone, loading, user, pathname, router]);

  if (pathname === "/pitch" || pathname === "/admin") {
    return (
      <div style={{ width: "100vw", minHeight: "100vh", overflow: "auto" }}>
        {children}
      </div>
    );
  }

  const showSplash = !splashDone;

  return (
    <div className="app-container">
      {showSplash && <SplashScreen onComplete={() => setSplashDone(true)} />}

      <div className="elite-ambient-bg">
        <div className="glow-orb terracotta" />
        <div className="glow-orb mustard" />
        <div className="glow-orb cream" />
      </div>

      <div
        className="scroll-area flex-col"
        style={{
          opacity: showSplash ? 0 : 1,
          transition: "opacity 0.4s var(--ease-fluid)",
          pointerEvents: showSplash ? "none" : "all",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {pathname !== "/auth" && <TopHeader onSwitchAccount={() => setSwitcherOpen(true)} />}
        <div style={{ flex: 1, position: "relative" }}>
          {children}
        </div>
      </div>

      {pathname !== "/auth" && (
        <BottomNav onSwitchAccount={() => setSwitcherOpen(true)} />
      )}

      <AccountSwitcherSheet
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
      />
    </div>
  );
}

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AccountModeProvider>
      <InnerWrapper>{children}</InnerWrapper>
    </AccountModeProvider>
  );
}
