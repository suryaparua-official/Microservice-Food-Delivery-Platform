import axios from "axios";
import { adminService } from "../main";
import toast from "react-hot-toast";
import { useState } from "react";
import { BiMapPin, BiPhone } from "react-icons/bi";

const AdminRestaurantCard = ({
  restaurant,
  onVerify,
}: {
  restaurant: any;
  onVerify: () => void;
}) => {
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    try {
      await axios.patch(
        `${adminService}/api/v1/verify/restaurant/${restaurant._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Restaurant verified successfully");
      onVerify();
    } catch {
      toast.error("Failed to verify restaurant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#161616",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 18,
        overflow: "hidden",
        transition: "border 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(255,255,255,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(255,255,255,0.07)";
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 160, overflow: "hidden" }}>
        <img
          src={restaurant.image}
          alt={restaurant.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(22,22,22,0.8) 0%, transparent 60%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            padding: "4px 10px",
            borderRadius: 99,
            background: "rgba(245,158,11,0.15)",
            border: "1px solid rgba(245,158,11,0.3)",
            fontSize: 10,
            fontWeight: 700,
            color: "#f59e0b",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Pending
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 18 }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#f0f0f0",
            marginBottom: 10,
          }}
        >
          {restaurant.name}
        </h3>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 7,
            marginBottom: 16,
          }}
        >
          {restaurant.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BiPhone size={13} color="#555" />
              <span style={{ fontSize: 12, color: "#666" }}>
                {restaurant.phone}
              </span>
            </div>
          )}
          {restaurant.autoLocation?.formattedAddress && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <BiMapPin
                size={13}
                color="#555"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <span style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>
                {restaurant.autoLocation.formattedAddress}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={verify}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            background: loading
              ? "rgba(34,197,94,0.05)"
              : "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.25)",
            color: "#4ade80",
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "Inter, sans-serif",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading)
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(34,197,94,0.18)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(34,197,94,0.1)";
          }}
        >
          {loading ? (
            <>
              <div
                className="spin"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid rgba(34,197,94,0.2)",
                  borderTopColor: "#4ade80",
                }}
              />
              Verifying...
            </>
          ) : (
            "✓ Verify Restaurant"
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminRestaurantCard;
