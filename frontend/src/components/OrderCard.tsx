import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import { ORDER_ACTIONS } from "../utils/orderflow";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";

interface Props {
  order: IOrder;
  onStatusUpdate?: () => void;
}

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
}

const STATUS_CONFIG: { [key: string]: StatusConfig } = {
  placed: {
    label: "Order Placed",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
  },
  accepted: {
    label: "Accepted",
    color: "#f97316",
    bg: "rgba(249,115,22,0.12)",
  },
  preparing: {
    label: "Preparing",
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.12)",
  },
  ready_for_rider: {
    label: "Ready for Rider",
    color: "#818cf8",
    bg: "rgba(99,102,241,0.12)",
  },
  rider_assigned: {
    label: "Rider Assigned",
    color: "#c084fc",
    bg: "rgba(168,85,247,0.12)",
  },
  picked_up: {
    label: "Picked Up",
    color: "#2dd4bf",
    bg: "rgba(20,184,166,0.12)",
  },
  delivered: {
    label: "Delivered",
    color: "#4ade80",
    bg: "rgba(34,197,94,0.12)",
  },
  cancelled: {
    label: "Cancelled",
    color: "#f87171",
    bg: "rgba(239,68,68,0.12)",
  },
};

const ACTION_LABELS: { [key: string]: string } = {
  accepted: "Accept Order",
  preparing: "Start Preparing",
  ready_for_rider: "Mark Ready",
};

const OrderCard = ({ order, onStatusUpdate }: Props) => {
  const [loading, setLoading] = useState(false);
  const [retryVisible, setRetryVisible] = useState(false);
  const actions: string[] = ORDER_ACTIONS[order.status] || [];
  const config: StatusConfig = STATUS_CONFIG[order.status] || {
    label: order.status,
    color: "#888",
    bg: "rgba(255,255,255,0.06)",
  };

  useEffect(() => {
    if (order.status !== "ready_for_rider") {
      setRetryVisible(false);
      return;
    }
    const timer = setTimeout(() => setRetryVisible(true), 10000);
    return () => clearTimeout(timer);
  }, [order.status]);

  const updateStatus = async (status: string) => {
    try {
      setLoading(true);
      setRetryVisible(false);
      await axios.put(
        `${restaurantService}/api/order/${order.id}`,
        { status },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Order updated");
      onStatusUpdate?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const isCodPending = order.paymentStatus === "cod_pending";
  const isPaid = order.paymentStatus === "paid";
  const canAct = (isPaid || isCodPending) && actions.length > 0;

  return (
    <div
      style={{
        background: "#161616",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 18,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "border 0.2s",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
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
            #{order.id.slice(-8).toUpperCase()}
          </p>
          <p style={{ fontSize: 11, color: "#444" }}>
            {new Date(order.createdAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: config.color,
            background: config.bg,
            padding: "5px 12px",
            borderRadius: 99,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
        >
          {config.label}
        </span>
      </div>

      {/* Items */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {order.items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 0",
              borderBottom:
                i < order.items.length - 1
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#FF4D1C",
                  background: "rgba(255,77,28,0.1)",
                  padding: "1px 6px",
                  borderRadius: 5,
                }}
              >
                ×{item.quauntity}
              </span>
              <span style={{ fontSize: 12, color: "#ccc" }}>{item.name}</span>
            </div>
            <span style={{ fontSize: 12, color: "#666" }}>
              ₹{item.price * item.quauntity}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: 6,
              background: isPaid
                ? "rgba(34,197,94,0.1)"
                : isCodPending
                  ? "rgba(59,130,246,0.1)"
                  : "rgba(245,158,11,0.1)",
              color: isPaid ? "#4ade80" : isCodPending ? "#60a5fa" : "#f59e0b",
              textTransform: "capitalize",
            }}
          >
            {isCodPending ? "COD" : order.paymentStatus}
          </span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#FF4D1C" }}>
          ₹{order.totalAmount}
        </span>
      </div>

      {/* Action buttons */}
      {canAct && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {actions.map((status: string) => (
            <button
              key={status}
              disabled={loading}
              onClick={() => updateStatus(status)}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(255,77,28,0.1)",
                border: "1px solid rgba(255,77,28,0.25)",
                color: "#FF4D1C",
                fontSize: 12,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: loading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,77,28,0.18)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,77,28,0.1)";
              }}
            >
              {loading ? (
                <div
                  className="spin"
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(255,77,28,0.2)",
                    borderTopColor: "#FF4D1C",
                  }}
                />
              ) : null}
              {ACTION_LABELS[status] || status.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      )}

      {/* Retry button */}
      {order.status === "ready_for_rider" && retryVisible && (
        <button
          onClick={() => updateStatus("ready_for_rider")}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 10,
            background: "transparent",
            border: "1px dashed rgba(255,77,28,0.3)",
            color: "#FF4D1C",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,77,28,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          ↻ Retry — Find Rider
        </button>
      )}
    </div>
  );
};

export default OrderCard;
