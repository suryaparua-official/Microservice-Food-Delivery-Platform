import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import UserOrderMap from "../components/UserOrderMap";

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

const OrderPage = () => {
  const { id } = useParams();
  const { socket } = useSocket();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<[number, number] | null>(
    null,
  );

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
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

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
              background: isDelivered
                ? "rgba(34,197,94,0.12)"
                : isCancelled
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(255,77,28,0.12)",
              color: isDelivered
                ? "#4ade80"
                : isCancelled
                  ? "#f87171"
                  : "#FF4D1C",
              border: `1px solid ${isDelivered ? "rgba(34,197,94,0.25)" : isCancelled ? "rgba(239,68,68,0.25)" : "rgba(255,77,28,0.25)"}`,
            }}
          >
            {isDelivered
              ? "✓ Delivered"
              : isCancelled
                ? "✕ Cancelled"
                : "● Live"}
          </div>
        </div>
      </div>

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
            {/* Track line */}
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
            {/* Filled track */}
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

            {/* Steps */}
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
                        background: done
                          ? active
                            ? "rgba(255,77,28,0.2)"
                            : "rgba(255,77,28,0.1)"
                          : "rgba(255,255,255,0.04)",
                        border: done
                          ? active
                            ? "2px solid #FF4D1C"
                            : "2px solid rgba(255,77,28,0.4)"
                          : "2px solid rgba(255,255,255,0.08)",
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
                        color: done ? (active ? "#FF4D1C" : "#888") : "#333",
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
          {/* Bill */}
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
                  background:
                    order.paymentStatus === "paid"
                      ? "rgba(34,197,94,0.08)"
                      : "rgba(245,158,11,0.08)",
                  border: `1px solid ${order.paymentStatus === "paid" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                }}
              >
                <span style={{ fontSize: 10 }}>
                  {order.paymentStatus === "paid" ? "✓" : "⏳"}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color:
                      order.paymentStatus === "paid" ? "#4ade80" : "#f59e0b",
                    textTransform: "capitalize",
                  }}
                >
                  {order.paymentStatus} · {order.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
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
