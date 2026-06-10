"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FoodListing } from "@/lib/seedData";

// Premium custom map markers
const makeMarker = (color: string, size: number) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 3px 10px rgba(0,0,0,0.28);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });

const defaultIcon = makeMarker("#E07A5F", 34);
const selectedIcon = makeMarker("#D4A843", 40);

// Custom Map tile — Stamen Toner Lite for premium minimal look
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

import { useMap } from "react-leaflet";
import { useEffect } from "react";

function InvalidateMapSize({ showMap }: { showMap?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (showMap) {
      map.invalidateSize();
      const t = setTimeout(() => map.invalidateSize(), 150);
      return () => clearTimeout(t);
    }
  }, [map, showMap]);
  return null;
}

interface MapInnerProps {
  listings: FoodListing[];
  center?: [number, number];
  selectedId?: string;
  onMarkerClick?: (id: string) => void;
  showMap?: boolean;
}

export default function MapInner({ listings, center, selectedId, onMarkerClick, showMap }: MapInnerProps) {
  const mapCenter: [number, number] = center ?? [-6.2088, 106.8456];

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
      scrollWheelZoom={false}
      attributionControl={false}
    >
      <InvalidateMapSize showMap={showMap} />
      <TileLayer url={TILE_URL} />
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.lat, listing.lng]}
          icon={listing.id === selectedId ? selectedIcon : defaultIcon}
          eventHandlers={{
            click: () => onMarkerClick?.(listing.id),
          }}
        >
          <Popup>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: 160, padding: "8px 4px" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{listing.category}</div>
              <strong style={{ fontSize: 13, color: "#111", lineHeight: 1.3, display: "block" }}>
                {listing.name}
              </strong>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{listing.donorName}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#E07A5F", marginTop: 6, letterSpacing: "-0.4px" }}>
                Rp {listing.rescuePrice.toLocaleString("id-ID")}
              </div>
              <div style={{
                display: "inline-block", marginTop: 4,
                padding: "2px 8px", borderRadius: 99,
                background: "rgba(224,122,95,0.12)",
                color: "#C5624A", fontSize: 10, fontWeight: 700,
              }}>
                Hemat {Math.round((1 - listing.rescuePrice / listing.originalPrice) * 100)}%
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
