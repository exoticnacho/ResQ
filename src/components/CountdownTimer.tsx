"use client";
import { useEffect, useState } from "react";

export default function CountdownTimer({ expiresAt }: { expiresAt: number }) {
  const [label, setLabel] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = expiresAt - Date.now();
      if (diff <= 0) { setLabel("Habis"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setUrgent(diff < 3_600_000);
      setLabel(h > 0 ? `${h}j ${m}m` : m > 0 ? `${m}m ${s}d` : `${s}d`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <span
      className={`pill ${urgent ? "pill-urgent" : "pill-yellow"}`}
      style={{ fontSize: 10, padding: "3px 9px" }}
    >
      ⏱ {label}
    </span>
  );
}
