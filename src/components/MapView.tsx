"use client";
import dynamic from "next/dynamic";
import { FoodListing } from "@/lib/seedData";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 0 }} />
  ),
});

interface MapViewProps {
  listings: FoodListing[];
  center?: [number, number];
  height?: number;
  selectedId?: string;
  onMarkerClick?: (id: string) => void;
}

export default function MapView({ listings, center, height = 240, selectedId, onMarkerClick }: MapViewProps) {
  return (
    <div style={{ width: "100%", height }}>
      <MapInner listings={listings} center={center} selectedId={selectedId} onMarkerClick={onMarkerClick} />
    </div>
  );
}
