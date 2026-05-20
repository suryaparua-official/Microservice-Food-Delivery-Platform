import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { utilsService } from "../main";
import toast from "react-hot-toast";

const OrderSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setVerifying(false);
        return;
      }
      try {
        await axios.post(`${utilsService}/api/payment/stripe/verify`, {
          sessionId,
        });
        setSuccess(true);
        toast.success("Payment successful 🎉");
      } catch (error) {
        toast.error("Stripe verification failed");
        setSuccess(false);
      } finally {
        setVerifying(false);
      }
    };
    verifyPayment();
  }, [sessionId]);

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
          background: verifying
            ? "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)"
            : success
              ? "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          transition: "background 0.5s ease",
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
        {verifying ? (
          <>
            <div
              className="spin"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: "3px solid rgba(59,130,246,0.15)",
                borderTopColor: "#3b82f6",
                margin: "0 auto 24px",
              }}
            />
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#f0f0f0",
                marginBottom: 10,
              }}
            >
              Verifying Payment
            </h1>
            <p style={{ fontSize: 13, color: "#555" }}>
              Please wait while we confirm your payment...
            </p>
          </>
        ) : success ? (
          <>
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
              Order Confirmed
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#555",
                lineHeight: 1.7,
                marginBottom: 28,
              }}
            >
              Your Stripe payment was verified successfully. The restaurant has
              been notified.
            </p>

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
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#f0f0f0";
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
          </>
        ) : (
          <>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.1)",
                border: "2px solid rgba(239,68,68,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: 38,
              }}
            >
              ❌
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#f0f0f0",
                marginBottom: 10,
              }}
            >
              Verification Failed
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#555",
                lineHeight: 1.7,
                marginBottom: 28,
              }}
            >
              We couldn't verify your payment. Please contact support if money
              was deducted.
            </p>
            <button
              onClick={() => navigate("/")}
              className="btn-accent"
              style={{ width: "100%", padding: "14px", fontSize: 14 }}
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderSuccess;
