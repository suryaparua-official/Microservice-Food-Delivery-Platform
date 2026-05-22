import axios from "axios";
import type { IOrder } from "../types";
import { riderService } from "../main";
import toast from "react-hot-toast";
import { useState } from "react";
import { BiPhone } from "react-icons/bi";
import { TbNavigation } from "react-icons/tb";

interface Props {
  order: IOrder;
  onStatusUpdate: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  rider_assigned: {
    label: "Head to Restaurant",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
  },
  picked_up: {
    label: "Out for Delivery",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.25)",
  },
  delivered: {
    label: "Delivered",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
  },
};

const RiderCurrentOrder = ({ order, onStatusUpdate }: Props) => {
  const [updating, setUpdating] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG["rider_assigned"];

  const updateStatus = async () => {
    setUpdating(true);
    try {
      await axios.put(
        `${riderService}/api/rider/order/update/${order._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Order status updated");
      onStatusUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }
    setVerifying(true);
    try {
      await axios.post(
        `${riderService}/api/rider/order/verify/${order._id}`,
        { otp },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Order delivered successfully! 🎉");
      onStatusUpdate();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className="fade-up"
      style={{
        background: "#161616",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {/* Status banner */}
      <div
        style={{
          padding: "14px 20px",
          background: config.bg,
          borderBottom: `1px solid ${config.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div className="pulse-dot" style={{ background: config.color }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: config.color }}>
          {config.label}
        </span>
      </div>

      <div
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Order ID */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#444",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Current Order
          </p>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#555",
              fontFamily: "monospace",
            }}
          >
            #{order._id.slice(-8).toUpperCase()}
          </span>
        </div>

        {/* Route */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 3,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#FF4D1C",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  width: 2,
                  height: 28,
                  background: "rgba(255,255,255,0.07)",
                  margin: "3px 0",
                }}
              />
            </div>
            <div style={{ flex: 1, paddingBottom: 12 }}>
              <p
                style={{
                  fontSize: 10,
                  color: "#444",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 3,
                }}
              >
                Pickup
              </p>
              <p style={{ fontSize: 13, color: "#f0f0f0", fontWeight: 600 }}>
                {order.restaurantName}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ paddingTop: 3 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: "#22c55e",
                  flexShrink: 0,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 10,
                  color: "#444",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 3,
                }}
              >
                Drop
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "#f0f0f0",
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                {order.deliveryAddress.fromattedAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Earnings */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "#444",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              Order Total
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#f0f0f0" }}>
              ₹{order.totalAmount}
            </p>
          </div>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.15)",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "#4ade80",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
                opacity: 0.7,
              }}
            >
              Your Earning
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}>
              ₹{order.riderAmount}
            </p>
          </div>
        </div>

        {/* Customer contact */}
        {order.deliveryAddress.mobile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  color: "#444",
                  fontWeight: 600,
                  marginBottom: 3,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Customer
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>
                {order.deliveryAddress.mobile}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={`tel:${order.deliveryAddress.mobile}`}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  color: "#60a5fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
              >
                <BiPhone size={16} />
              </a>
              {order.deliveryAddress.latitude &&
                order.deliveryAddress.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${order.deliveryAddress.latitude},${order.deliveryAddress.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      color: "#4ade80",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                  >
                    <TbNavigation size={16} />
                  </a>
                )}
            </div>
          </div>
        )}

        {/* Picked up button */}
        {order.status === "rider_assigned" && (
          <button
            onClick={updateStatus}
            disabled={updating}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              background: updating
                ? "rgba(245,158,11,0.05)"
                : "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.3)",
              color: "#f59e0b",
              fontSize: 14,
              fontWeight: 700,
              cursor: updating ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: updating ? 0.6 : 1,
            }}
          >
            {updating ? (
              <>
                <div
                  className="spin"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: "2px solid rgba(245,158,11,0.2)",
                    borderTopColor: "#f59e0b",
                  }}
                />
                Updating...
              </>
            ) : (
              "🏍️  Reached Restaurant — Picked Up"
            )}
          </button>
        )}

        {/* OTP verify — picked_up হলে */}
        {order.status === "picked_up" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 13, color: "#555", textAlign: "center" }}>
              🔐 Ask customer for OTP to confirm delivery
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                className="input-dark"
                style={{
                  flex: 1,
                  height: 52,
                  textAlign: "center",
                  fontSize: 22,
                  letterSpacing: 8,
                  fontWeight: 700,
                }}
              />
              <button
                onClick={handleVerifyOtp}
                disabled={verifying || otp.length !== 6}
                style={{
                  padding: "0 20px",
                  borderRadius: 12,
                  background:
                    otp.length === 6
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(255,255,255,0.04)",
                  border: `1px solid ${otp.length === 6 ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`,
                  color: otp.length === 6 ? "#4ade80" : "#444",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor:
                    verifying || otp.length !== 6 ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.2s",
                  height: 52,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {verifying ? (
                  <div
                    className="spin"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: "2px solid rgba(34,197,94,0.2)",
                      borderTopColor: "#4ade80",
                    }}
                  />
                ) : (
                  "Verify ✓"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderCurrentOrder;
