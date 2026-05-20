import toast from "react-hot-toast";
import { adminService } from "../main";
import axios from "axios";
import { useState } from "react";
import { BiPhone } from "react-icons/bi";
import { TbId } from "react-icons/tb";

const RiderAdmin = ({
  rider,
  onVerify,
}: {
  rider: any;
  onVerify: () => void;
}) => {
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    try {
      await axios.patch(
        `${adminService}/api/v1/verify/rider/${rider._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Rider verified successfully");
      onVerify();
    } catch {
      toast.error("Failed to verify rider");
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
      {/* Photo */}
      <div style={{ position: "relative", height: 160, overflow: "hidden" }}>
        <img
          src={rider.picture}
          alt="Rider"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(22,22,22,0.85) 0%, transparent 55%)",
          }}
        />

        {/* Pending badge */}
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

        {/* Rider icon bottom */}
        <div style={{ position: "absolute", bottom: 14, left: 16 }}>
          <span style={{ fontSize: 24 }}>🏍️</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 18 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {/* Phone */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(59,130,246,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BiPhone size={14} color="#60a5fa" />
            </div>
            <div>
              <p
                style={{
                  fontSize: 10,
                  color: "#444",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 2,
                }}
              >
                Phone
              </p>
              <p style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>
                {rider.phoneNumber}
              </p>
            </div>
          </div>

          {/* Aadhar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(168,85,247,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <TbId size={14} color="#c084fc" />
            </div>
            <div>
              <p
                style={{
                  fontSize: 10,
                  color: "#444",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 2,
                }}
              >
                Aadhar Number
              </p>
              <p style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>
                {rider.aadharNumber}
              </p>
            </div>
          </div>

          {/* Driving License */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: "rgba(20,184,166,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 13 }}>🪪</span>
            </div>
            <div>
              <p
                style={{
                  fontSize: 10,
                  color: "#444",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 2,
                }}
              >
                Driving License
              </p>
              <p style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>
                {rider.drivingLicenseNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Verify button */}
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
            "✓ Verify Rider"
          )}
        </button>
      </div>
    </div>
  );
};

export default RiderAdmin;
