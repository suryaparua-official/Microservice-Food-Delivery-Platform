import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { restaurantService } from "../main";

const ACTIVE_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const statusLabel: Record<string, string> = {
  placed: "Order Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready_for_rider: "Ready for Rider",
  rider_assigned: "Rider Assigned",
  picked_up: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusBadgeClass: Record<string, string> = {
  placed: "badge badge-placed",
  accepted: "badge badge-accepted",
  preparing: "badge badge-preparing",
  ready_for_rider: "badge badge-ready",
  rider_assigned: "badge badge-rider",
  picked_up: "badge badge-picked",
  delivered: "badge badge-delivered",
  cancelled: "badge badge-cancelled",
};

const Orders = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/order/myorder`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setOrders(data.orders || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = () => fetchOrders();
    socket.on("order:update", onUpdate);
    socket.on("order:rider_assigned", onUpdate);
    return () => {
      socket.off("order:update", onUpdate);
      socket.off("order:rider_assigned", onUpdate);
    };
  }, [socket]);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completedOrders = orders.filter(
    (o) => !ACTIVE_STATUSES.includes(o.status),
  );

  if (loading) {
    return (
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px" }}>
        <div
          className="shimmer"
          style={{ height: 32, width: 160, borderRadius: 8, marginBottom: 28 }}
        />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="shimmer"
            style={{ height: 100, borderRadius: 16, marginBottom: 12 }}
          />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <div style={{ fontSize: 52 }}>📦</div>
        <p style={{ fontSize: 18, fontWeight: 600, color: "#f0f0f0" }}>
          No orders yet
        </p>
        <p style={{ fontSize: 13, color: "#555" }}>
          Your order history will appear here
        </p>
        <button
          className="btn-accent"
          onClick={() => navigate("/")}
          style={{ padding: "12px 28px", marginTop: 8 }}
        >
          Order Now
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px 60px" }}>
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#f0f0f0",
            letterSpacing: "-0.5px",
          }}
        >
          My Orders
        </h1>
        <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
          {orders.length} order{orders.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Active */}
      {activeOrders.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div className="pulse-dot" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>
              Active Orders
            </h2>
            <span
              style={{
                fontSize: 11,
                color: "#4ade80",
                background: "rgba(74,222,128,0.1)",
                padding: "2px 8px",
                borderRadius: 99,
                fontWeight: 600,
              }}
            >
              {activeOrders.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeOrders.map((order) => (
              <OrderRow
                key={order._id}
                order={order}
                onClick={() => navigate(`/order/${order._id}`)}
                statusLabel={statusLabel}
                statusBadgeClass={statusBadgeClass}
                isActive
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedOrders.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#555",
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Past Orders
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {completedOrders.map((order) => (
              <OrderRow
                key={order._id}
                order={order}
                onClick={() => navigate(`/order/${order._id}`)}
                statusLabel={statusLabel}
                statusBadgeClass={statusBadgeClass}
                isActive={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const OrderRow = ({
  order,
  onClick,
  statusLabel,
  statusBadgeClass,
  isActive,
}: {
  order: IOrder;
  onClick: () => void;
  statusLabel: Record<string, string>;
  statusBadgeClass: Record<string, string>;
  isActive: boolean;
}) => (
  <div
    onClick={onClick}
    style={{
      padding: "18px 20px",
      borderRadius: 16,
      background: "#161616",
      border: isActive
        ? "1px solid rgba(255,77,28,0.2)"
        : "1px solid rgba(255,255,255,0.06)",
      cursor: "pointer",
      transition: "all 0.2s",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLDivElement).style.background = "#1e1e1e";
      (e.currentTarget as HTMLDivElement).style.borderColor = isActive
        ? "rgba(255,77,28,0.35)"
        : "rgba(255,255,255,0.1)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.background = "#161616";
      (e.currentTarget as HTMLDivElement).style.borderColor = isActive
        ? "rgba(255,77,28,0.2)"
        : "rgba(255,255,255,0.06)";
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#f0f0f0",
            marginBottom: 3,
          }}
        >
          {order.restaurantName}
        </p>
        <p style={{ fontSize: 11, color: "#444" }}>
          #{order._id.slice(-8).toUpperCase()}
        </p>
      </div>
      <span className={statusBadgeClass[order.status] || "badge"}>
        {statusLabel[order.status] || order.status}
      </span>
    </div>

    <p
      style={{ fontSize: 12, color: "#555", marginBottom: 12, lineHeight: 1.6 }}
    >
      {order.items.map((i) => `${i.name} ×${i.quauntity}`).join(" · ")}
    </p>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: 12, color: "#444" }}>
        {new Date(order.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </span>
      <span style={{ fontSize: 15, fontWeight: 800, color: "#FF4D1C" }}>
        ₹{order.totalAmount}
      </span>
    </div>
  </div>
);

export default Orders;
