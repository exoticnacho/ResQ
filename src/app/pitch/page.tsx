"use client";
import ShowroomClient from "@/components/ShowroomClient";

export default function PitchPage() {
  return (
    <ShowroomClient>
      <iframe
        src="/"
        title="ResQ Live Sandbox"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "var(--c-bg-app)"
        }}
      />
    </ShowroomClient>
  );
}
