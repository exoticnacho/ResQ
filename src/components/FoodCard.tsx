import Link from "next/link";
import CountdownTimer from "./CountdownTimer";
import { FoodListing } from "@/lib/seedData";

interface FoodCardProps {
  listing: FoodListing;
  variant?: "grid" | "horizontal";
}

export default function FoodCard({ listing, variant = "grid" }: FoodCardProps) {
  const discountPct = Math.round((1 - listing.rescuePrice / listing.originalPrice) * 100);

  if (variant === "horizontal") {
    return (
      <Link href={`/food/${listing.id}`}>
        <div
          className="card card-hover card-interactive"
          style={{ display: "flex", gap: 14, padding: "14px", minWidth: 300, maxWidth: 320 }}
        >
          {/* Image */}
          <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0 }}>
            <img
              src={listing.imageUrl}
              alt={listing.name}
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                borderRadius: "var(--r-md)",
              }}
            />
            <div
              style={{
                position: "absolute", top: 6, left: 6,
                background: "var(--terracotta)",
                color: "white",
                fontSize: 10, fontWeight: 800,
                padding: "3px 7px",
                borderRadius: "var(--r-full)",
              }}
            >
              -{discountPct}%
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <CountdownTimer expiresAt={listing.expiresAt} />
              <h3
                className="t-h4"
                style={{
                  marginTop: 4, marginBottom: 2,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {listing.name}
              </h3>
              <p className="t-xs clr-muted">{listing.donorName}</p>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 10, color: "var(--muted-2)", textDecoration: "line-through" }}>
                Rp {listing.originalPrice.toLocaleString("id-ID")}
              </span>
              <div className="t-h3 clr-terra" style={{ lineHeight: 1.2 }}>
                Rp {listing.rescuePrice.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant — premium card
  return (
    <Link href={`/food/${listing.id}`} style={{ display: "block" }}>
      <div className="card card-hover card-interactive anim-up">
        {/* Image with gradient overlay */}
        <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
          <img
            src={listing.imageUrl}
            alt={listing.name}
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
              transition: "transform 0.4s ease",
            }}
          />
          {/* Dark gradient from bottom */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(24,20,16,0.75) 0%, rgba(24,20,16,0.1) 50%, transparent 100%)",
          }} />

          {/* Top: Discount badge + Quantity */}
          <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between" }}>
            <div style={{
              background: "var(--terracotta)",
              color: "white",
              fontSize: 11, fontWeight: 800,
              padding: "5px 10px",
              borderRadius: "var(--r-full)",
              boxShadow: "0 2px 8px rgba(224,122,95,0.5)",
            }}>
              -{discountPct}% OFF
            </div>
            <div style={{
              background: "rgba(24,20,16,0.55)",
              backdropFilter: "blur(10px)",
              color: "white",
              fontSize: 10, fontWeight: 700,
              padding: "5px 9px",
              borderRadius: "var(--r-full)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}>
               {listing.quantity} sisa
            </div>
          </div>

          {/* Bottom: Price + Countdown overlaid */}
          <div style={{ position: "absolute", bottom: 10, left: 12, right: 12, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", textDecoration: "line-through", lineHeight: 1 }}>
                Rp {listing.originalPrice.toLocaleString("id-ID")}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "white", lineHeight: 1.2, letterSpacing: "-0.5px" }}>
                Rp {listing.rescuePrice.toLocaleString("id-ID")}
              </div>
            </div>
            <CountdownTimer expiresAt={listing.expiresAt} />
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: "12px 14px 14px" }}>
          {/* Category */}
          <span className="badge badge-mustard" style={{ marginBottom: 6, display: "inline-flex" }}>
            {listing.category}
          </span>

          {/* Name */}
          <h3 className="t-h4" style={{
            marginBottom: 6, lineHeight: 1.35,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {listing.name}
          </h3>

          {/* Donor + Options row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className="t-xs clr-muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
               {listing.donorName}
            </p>
            <div style={{ display: "flex", gap: 4 }}>
              {listing.isPickup && (
                <span className="badge badge-green" style={{ fontSize: 9, padding: "3px 7px" }}>Pickup</span>
              )}
              {listing.isDelivery && (
                <span className="badge badge-blue" style={{ fontSize: 9, padding: "3px 7px" }}>Delivery</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
