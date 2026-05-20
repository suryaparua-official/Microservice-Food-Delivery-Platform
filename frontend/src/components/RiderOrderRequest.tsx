import { useEffect, useState } from "react";
import { riderService } from "../main";
import axios from "axios";
import toast from "react-hot-toast";

interface Props {
  orderId: string;
  onAccepted: () => void;
}

const RiderOrderRequest = ({ orderId, onAccepted }: Props) => {
  const [accepting, setAccepting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onAccepted();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onAccepted]);

  const acceptOrder = async () => {
    setAccepting(true);
    try {
      await axios.post(
        `${riderService}/api/rider/accept/${orderId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Order Accepted!");
      onAccepted();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to accept");
      onAccepted();
    } finally {
      setAccepting(false);
    }
  };

  const progress = (secondsLeft / 10) * 100;

  return (
    <div
      className="fade-up"
      style={{
        background: "#161616",
        border: "1px solid rgba(34,197,94,0.25)",
        borderRadius: 18,
        padding: 20,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Progress bar top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "rgba(255,255,255,0.05)",
          borderRadius: "18px 18px 0 0",
        }}
      >
        <div
          style={{
            height: "100%",
            background: secondsLeft > 5 ? "#22c55e" : "#f59e0b",
            width: `${progress}%`,
            transition: "width 1s linear, background 0.3s",
            borderRadius: "18px 18px 0 0",
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="pulse-dot" style={{ background: "#22c55e" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>
            New Delivery Request
          </span>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background:
              secondsLeft > 5 ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
            border: `2px solid ${secondsLeft > 5 ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            color: secondsLeft > 5 ? "#4ade80" : "#f59e0b",
            transition: "all 0.3s",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {secondsLeft}
        </div>
      </div>

      {/* Order info */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
          marginBottom: 14,
        }}
      >
        <p style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>Order ID</p>
        <p
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#f0f0f0",
            fontFamily: "monospace",
          }}
        >
          #{orderId.slice(-8).toUpperCase()}
        </p>
      </div>

      {/* Accept button */}
      <button
        disabled={accepting}
        onClick={acceptOrder}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: 12,
          background: accepting
            ? "rgba(34,197,94,0.05)"
            : "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.3)",
          color: "#4ade80",
          fontSize: 14,
          fontWeight: 700,
          cursor: accepting ? "not-allowed" : "pointer",
          fontFamily: "Inter, sans-serif",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: accepting ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!accepting)
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(34,197,94,0.2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(34,197,94,0.12)";
        }}
      >
        {accepting ? (
          <>
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
            Accepting...
          </>
        ) : (
          "✓ Accept Order"
        )}
      </button>
    </div>
  );
};

export default RiderOrderRequest;
