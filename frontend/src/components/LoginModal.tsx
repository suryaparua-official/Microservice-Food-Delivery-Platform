import { useNavigate } from "react-router-dom";
import { useLoginModal } from "../context/LoginModalContext";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { authService } from "../main";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

const LoginModal = () => {
  const { showLoginModal, closeLoginModal } = useLoginModal();
  const { setUser, setIsAuth, isAuth } = useAppData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // isAuth হলে modal বন্ধ করো — logout/login উভয় ক্ষেত্রে
  useEffect(() => {
    if (isAuth && showLoginModal) {
      closeLoginModal();
    }
  }, [isAuth]);

  const responseGoogle = async (authResult: any) => {
    setLoading(true);
    try {
      const result = await axios.post(`${authService}/api/auth/login`, {
        code: authResult["code"],
      });
      localStorage.setItem("token", result.data.token);
      toast.success("Signed in successfully");
      setUser(result.data.user);
      setIsAuth(true);
      closeLoginModal();
    } catch {
      toast.error("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });

  // isAuth থাকলে বা modal বন্ধ থাকলে কিছু render করো না
  if (!showLoginModal || isAuth) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeLoginModal}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 999,
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          width: "100%",
          maxWidth: 380,
          padding: "0 16px",
        }}
      >
        <div
          className="fade-up"
          style={{
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24,
            padding: "36px 32px",
            position: "relative",
          }}
        >
          {/* Close button */}
          <button
            onClick={closeLoginModal}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#666",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "all 0.2s",
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#f0f0f0";
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#666";
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.05)";
            }}
          >
            ×
          </button>

          {/* Logo */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#FF4D1C",
                letterSpacing: "-0.5px",
                marginBottom: 8,
              }}
            >
              tomato
              <span style={{ color: "rgba(255,77,28,0.35)", fontSize: 34 }}>
                .
              </span>
            </div>
            <h2
              style={{
                fontSize: 19,
                fontWeight: 700,
                color: "#f0f0f0",
                marginBottom: 6,
              }}
            >
              Sign in to continue
            </h2>
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
              Create an account or sign in to place orders, save addresses, and
              track deliveries.
            </p>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
              marginBottom: 24,
            }}
          />

          {/* Google button */}
          <button
            onClick={() => googleLogin()}
            disabled={loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "14px 20px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#f0f0f0",
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "Inter, sans-serif",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              marginBottom: 12,
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.09)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.05)";
            }}
          >
            {loading ? (
              <>
                <div
                  className="spin"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.1)",
                    borderTopColor: "#FF4D1C",
                  }}
                />
                Signing in...
              </>
            ) : (
              <>
                <FcGoogle size={20} />
                Continue with Google
              </>
            )}
          </button>

          {/* Go to login page */}
          <button
            onClick={() => {
              closeLoginModal();
              navigate("/login");
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              background: "transparent",
              border: "none",
              color: "#555",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#888";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#555";
            }}
          >
            Go to full login page →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default LoginModal;
