"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--c-bg)" }}>
        <div style={{
          width: 30, height: 30, border: "3px solid var(--c-faint)",
          borderTopColor: "var(--c-brand)", borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
