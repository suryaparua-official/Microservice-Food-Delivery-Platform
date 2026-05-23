import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import UserOrderMap from "../components/UserOrderMap";
import toast from "react-hot-toast";

const STEPS = [
  { key: "placed", label: "Order Placed", icon: "📋" },
  { key: "accepted", label: "Accepted", icon: "✅" },
  { key: "preparing", label: "Preparing", icon: "👨‍🍳" },
  { key: "ready_for_rider", label: "Ready for Pickup", icon: "📦" },
  { key: "rider_assigned", label: "Rider Assigned", icon: "🏍️" },
  { key: "picked_up", label: "On the Way", icon: "🚀" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
];

const getStepIndex = (status: string) =>
  STEPS.findIndex((s) => s.key === status);

// Payment badge helper
function getPaymentBadge(paymentStatus: string) {
  if (paymentStatus === "paid") {
    return {
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.2)",
      color: "#4ade80",
      icon: "✓",
      label: "Paid",
    };
  }
  if (paymentStatus === "refund_pending") {
    return {
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.2)",
      color: "#60a5fa",
      icon: "↩",
      label: "Refund Pending",
    };
  }
  if (paymentStatus === "cod_pending") {
    return {
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.2)",
      color: "#60a5fa",
      icon: "⏳",
      label: "COD",
    };
  }
  if (paymentStatus === "refunded") {
    return {
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.2)",
      color: "#4ade80",
      icon: "✓",
      label: "Refunded",
    };
  }
  return {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    color: "#f59e0b",
    icon: "⏳",
    label: paymentStatus,
  };
}

// Header badge helper
function getHeaderBadge(status: string) {
  if (status === "delivered") {
    return {
      bg: "rgba(34,197,94,0.12)",
      border: "rgba(34,197,94,0.25)",
      color: "#4ade80",
      label: "✓ Delivered",
    };
  }
  if (status === "cancelled") {
    return {
      bg: "rgba(239,68,68,0.12)",
      border: "rgba(239,68,68,0.25)",
      color: "#f87171",
      label: "✕ Cancelled",
    };
  }
  return {
    bg: "rgba(255,77,28,0.12)",
    border: "rgba(255,77,28,0.25)",
    color: "#FF4D1C",
    label: "● Live",
  };
}

const OrderPage = () => {
  const { id } = useParams();
  const { socket } = useSocket();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(
    null,
  );
  const [deliveryOtp, setDeliveryOtp] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/order/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOrder(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = () => fetchOrder();
    socket.on("order:update", onUpdate);
    socket.on("order:rider_assigned", onUpdate);
    return () => {
      socket.off("order:update", onUpdate);
      socket.off("order:rider_assigned", onUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("join", `user:${id}`);
    return () => {
      socket.emit("leave", `user:${id}`);
    };
  }, [socket, id]);

  useEffect(() => {
    if (!socket) return;
    const onRiderLocation = ({ latitude, longitude }: any) => {
      setRiderLocation([latitude, longitude]);
    };
    socket.on("rider:location", onRiderLocation);
    return () => {
      socket.off("rider:location", onRiderLocation);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const onOtp = ({ otp }: { otp: string }) => {
      setDeliveryOtp(otp);
    };
    socket.on("order:otp", onOtp);
    return () => {
      socket.off("order:otp", onOtp);
    };
  }, [socket]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      const { data } = await axios.post(
        `${restaurantService}/api/order/cancel/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Order cancelled successfully");
      if (data.refundMessage) {
        toast(data.refundMessage, { icon: "💳", duration: 5000 });
      }
      fetchOrder();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>
        <div
          className="shimmer"
          style={{ height: 28, width: 200, borderRadius: 8, marginBottom: 24 }}
        />
        <div
          className="shimmer"
          style={{ height: 80, borderRadius: 16, marginBottom: 16 }}
        />
        <div
          className="shimmer"
          style={{ height: 200, borderRadius: 16, marginBottom: 16 }}
        />
        <div className="shimmer" style={{ height: 140, borderRadius: 16 }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 48 }}>📦</div>
        <p style={{ color: "#555", fontSize: 16 }}>Order not found</p>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === "cancelled";
  const canCancel = order.status === "placed" || order.status === "accepted";
  const headerBadge = getHeaderBadge(order.status);
  const paymentBadge = getPaymentBadge(order.paymentStatus);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 60px" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#f0f0f0",
                letterSpacing: "-0.5px",
              }}
            >
              {order.restaurantName}
            </h1>
            <p style={{ fontSize: 12, color: "#444", marginTop: 4 }}>
              Order #{order._id.slice(-8).toUpperCase()}
            </p>
          </div>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 700,
              background: headerBadge.bg,
              color: headerBadge.color,
              border: `1px solid ${headerBadge.border}`,
            }}
          >
            {headerBadge.label}
          </div>
        </div>
      </div>

      {/* Refund pending banner */}
      {order.paymentStatus === "refund_pending" && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 14,
            background: "rgba(59,130,246,0.07)",
            border: "1px solid rgba(59,130,246,0.2)",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20 }}>💳</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#60a5fa" }}>
              Refund Initiated
            </p>
            <p style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
              ₹{order.totalAmount} will be refunded in 5-7 business days
            </p>
          </div>
        </div>
      )}

      {/* Progress Tracker */}
      {!isCancelled && (
        <div
          style={{
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: "24px 20px",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#f0f0f0",
              marginBottom: 24,
            }}
          >
            Order Progress
          </h2>
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                top: 18,
                left: 18,
                right: 18,
                height: 2,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 99,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 18,
                left: 18,
                height: 2,
                borderRadius: 99,
                background: "linear-gradient(90deg, #FF4D1C, #ff8c6b)",
                width: `${Math.max(0, (currentStep / (STEPS.length - 1)) * 100)}%`,
                transition: "width 0.6s ease",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              {STEPS.map((step, idx) => {
                const done = idx <= currentStep;
                const active = idx === currentStep;
                const circleBg = done
                  ? active
                    ? "rgba(255,77,28,0.2)"
                    : "rgba(255,77,28,0.1)"
                  : "rgba(255,255,255,0.04)";
                const circleBorder = done
                  ? active
                    ? "2px solid #FF4D1C"
                    : "2px solid rgba(255,77,28,0.4)"
                  : "2px solid rgba(255,255,255,0.08)";
                const labelColor = done
                  ? active
                    ? "#FF4D1C"
                    : "#888"
                  : "#333";
                return (
                  <div
                    key={step.key}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: active ? 18 : 14,
                        background: circleBg,
                        border: circleBorder,
                        transition: "all 0.3s ease",
                        boxShadow: active
                          ? "0 0 16px rgba(255,77,28,0.3)"
                          : "none",
                      }}
                    >
                      {done ? step.icon : "○"}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: active ? 700 : 400,
                        color: labelColor,
                        textAlign: "center",
                        lineHeight: 1.3,
                        maxWidth: 56,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cancel button */}
      {canCancel && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171",
              fontSize: 13,
              fontWeight: 600,
              cursor: cancelling ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: cancelling ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!cancelling)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(239,68,68,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,0.07)";
            }}
          >
            {cancelling ? (
              <div
                className="spin"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid rgba(239,68,68,0.2)",
                  borderTopColor: "#f87171",
                }}
              />
            ) : (
              "✕"
            )}
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
          <p
            style={{
              fontSize: 11,
              color: "#444",
              textAlign: "center",
              marginTop: 6,
            }}
          >
            {order.paymentMethod === "cod"
              ? "COD order — no charge on cancellation"
              : "💳 Online payment — refund in 5-7 business days if cancelled"}
          </p>
        </div>
      )}

      {/* OTP Box */}
      {order.status === "picked_up" && deliveryOtp && (
        <div
          style={{
            background: "#161616",
            border: "1px solid rgba(255,77,28,0.3)",
            borderRadius: 20,
            padding: 24,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
            🔐 Share this OTP with your delivery partner to confirm delivery
          </p>
          <div
            style={{
              fontSize: 42,
              fontWeight: 800,
              letterSpacing: 14,
              color: "#FF4D1C",
              fontFamily: "monospace",
              margin: "16px 0",
            }}
          >
            {deliveryOtp}
          </div>
          <p style={{ fontSize: 11, color: "#444" }}>
            Valid for 10 minutes · Do not share with anyone else
          </p>
        </div>
      )}

      {/* Live Map */}
      {(order.status === "rider_assigned" || order.status === "picked_up") && (
        <div
          style={{
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div className="pulse-dot" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>
              Live Tracking
            </h2>
          </div>
          {riderLocation ? (
            <UserOrderMap
              riderLocation={riderLocation}
              deliveryLocation={[
                order.deliveryAddress.latitude!,
                order.deliveryAddress.longitude!,
              ]}
            />
          ) : (
            <div style={{ padding: "28px 20px", textAlign: "center" }}>
              <div
                className="spin"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,77,28,0.2)",
                  borderTopColor: "#FF4D1C",
                  margin: "0 auto 12px",
                }}
              />
              <p style={{ fontSize: 13, color: "#555" }}>
                Connecting to rider location...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Two col bottom */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Items */}
        <div
          style={{
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: 20,
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#f0f0f0",
              marginBottom: 14,
            }}
          >
            Items Ordered
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {order.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#FF4D1C",
                      background: "rgba(255,77,28,0.1)",
                      padding: "2px 6px",
                      borderRadius: 5,
                    }}
                  >
                    ×{item.quauntity}
                  </span>
                  <span style={{ fontSize: 12, color: "#ccc" }}>
                    {item.name}
                  </span>
                </div>
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: "#f0f0f0" }}
                >
                  ₹{item.price * item.quauntity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bill + Address */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: 20,
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#f0f0f0",
                marginBottom: 14,
              }}
            >
              Payment
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Subtotal", value: `₹${order.subtotal}` },
                { label: "Delivery", value: `₹${order.deliveryFee}` },
                { label: "Platform", value: `₹${order.platfromFee}` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: 12, color: "#555" }}>{label}</span>
                  <span style={{ fontSize: 12, color: "#888" }}>{value}</span>
                </div>
              ))}
              <div
                style={{
                  height: 1,
                  background: "rgba(255,255,255,0.06)",
                  margin: "4px 0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}
                >
                  Total
                </span>
                <span
                  style={{ fontSize: 16, fontWeight: 800, color: "#FF4D1C" }}
                >
                  ₹{order.totalAmount}
                </span>
              </div>
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: paymentBadge.bg,
                  border: `1px solid ${paymentBadge.border}`,
                }}
              >
                <span style={{ fontSize: 10 }}>{paymentBadge.icon}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: paymentBadge.color,
                  }}
                >
                  {paymentBadge.label} · {order.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: 20,
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#f0f0f0",
                marginBottom: 12,
              }}
            >
              Delivery Address
            </h2>
            <p style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>
              {order.deliveryAddress.fromattedAddress}
            </p>
            <p style={{ fontSize: 11, color: "#555", marginTop: 6 }}>
              📞 {order.deliveryAddress.mobile}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
