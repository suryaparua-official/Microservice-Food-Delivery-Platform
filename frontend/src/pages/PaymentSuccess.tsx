import { useNavigate, useParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect } from "react";

const PaymentSuccess = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { fetchCart } = useAppData();

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="fade-up"
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#161616",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 28,
          padding: "44px 36px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Success ring */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "rgba(34,197,94,0.1)",
            border: "2px solid rgba(34,197,94,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: 38,
          }}
        >
          🎉
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#f0f0f0",
            letterSpacing: "-0.5px",
            marginBottom: 10,
          }}
        >
          Payment Successful
        </h1>

        <p
          style={{
            fontSize: 14,
            color: "#555",
            lineHeight: 1.7,
            marginBottom: 28,
          }}
        >
          Your order has been placed and the restaurant has been notified.
        </p>

        {paymentId && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 28,
            }}
          >
            <p style={{ fontSize: 11, color: "#444", marginBottom: 4 }}>
              Payment ID
            </p>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: "#666",
                wordBreak: "break-all",
              }}
            >
              {paymentId}
            </p>
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
            marginBottom: 24,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => navigate("/orders")}
            className="btn-accent"
            style={{ width: "100%", padding: "14px", fontSize: 14 }}
          >
            Track Your Order →
          </button>

          <button
            onClick={() => navigate("/")}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#888",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLButtonElement).style.color = "#f0f0f0";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.04)";
              (e.currentTarget as HTMLButtonElement).style.color = "#888";
            }}
          >
            Order More Food
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
