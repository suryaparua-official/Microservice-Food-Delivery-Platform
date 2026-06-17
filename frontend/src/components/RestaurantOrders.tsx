import { useEffect, useRef, useState } from "react";
import type { IOrder } from "../types";
import { useSocket } from "../context/SocketContext";
import audio from "../assets/quack.mp3";
import axios from "axios";
import { restaurantService } from "../main";
import OrderCard from "./OrderCard";
import { BsBellFill } from "react-icons/bs";

const ACTIVE_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const RestaurantOrders = ({ restaurantId }: { restaurantId: string }) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const { socket } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(audio);
    audioRef.current.load();
  }, []);

  const unlockAudio = () => {
    if (!audioRef.current) return;
    audioRef.current
      .play()
      .then(() => {
        audioRef.current!.pause();
        audioRef.current!.currentTime = 0;
        setAudioUnlocked(true);
      })
      .catch((err) => console.log("Audio unlock failed:", err));
  };

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/order/restaurant/${restaurantId}`,
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
  }, [restaurantId]);

  useEffect(() => {
    if (!socket) return;
    const onNewOrder = () => {
      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      fetchOrders();
    };
    socket.on("order:new", onNewOrder);
    return () => {
      socket.off("order:new", onNewOrder);
    };
  }, [socket, audioUnlocked]);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = () => fetchOrders();
    socket.on("order:rider_assigned", onUpdate);
    return () => {
      socket.off("order:rider_assigned", onUpdate);
    };
  }, [socket]);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completedOrders = orders.filter(
    (o) => !ACTIVE_STATUSES.includes(o.status),
  );

  if (loading) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="shimmer"
            style={{ height: 160, borderRadius: 16 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Sound notification banner */}
      {!audioUnlocked && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "14px 18px",
            borderRadius: 14,
            background: "rgba(59,130,246,0.07)",
            border: "1px solid rgba(59,130,246,0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(59,130,246,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BsBellFill size={16} color="#60a5fa" />
            </div>
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#f0f0f0",
                  marginBottom: 2,
                }}
              >
                Enable Sound Notifications
              </p>
              <p style={{ fontSize: 11, color: "#555" }}>
                Get notified instantly when new orders arrive
              </p>
            </div>
          </div>
          <button
            onClick={unlockAudio}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "#60a5fa",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(59,130,246,0.22)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(59,130,246,0.15)";
            }}
          >
            Enable
          </button>
        </div>
      )}

      {/* Active orders */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div className="pulse-dot" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>
            Active Orders
          </h3>
          {activeOrders.length > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#FF4D1C",
                background: "rgba(255,77,28,0.1)",
                padding: "2px 8px",
                borderRadius: 99,
              }}
            >
              {activeOrders.length}
            </span>
          )}
        </div>

        {activeOrders.length === 0 ? (
          <div
            style={{
              padding: "32px 20px",
              textAlign: "center",
              borderRadius: 14,
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.07)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
            <p style={{ fontSize: 13, color: "#444" }}>
              No active orders right now
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={fetchOrders}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed orders */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#555",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Completed Orders
          </h3>
          {completedOrders.length > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#444",
                background: "rgba(255,255,255,0.05)",
                padding: "2px 8px",
                borderRadius: 99,
              }}
            >
              {completedOrders.length}
            </span>
          )}
        </div>

        {completedOrders.length === 0 ? (
          <div
            style={{
              padding: "24px 20px",
              textAlign: "center",
              borderRadius: 14,
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.06)",
            }}
          >
            <p style={{ fontSize: 13, color: "#333" }}>
              No completed orders yet
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {completedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={fetchOrders}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantOrders;
