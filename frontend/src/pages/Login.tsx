import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../main";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useAppData } from "../context/AppContext";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setIsAuth } = useAppData();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const responseGoogle = async (authResult: any) => {
    setLoading(true);
    try {
      const result = await axios.post(`${authService}/api/auth/login`, {
        code: authResult["code"],
      });
      localStorage.setItem("token", result.data.token);
      toast.success(result.data.message);
      setUser(result.data.user);
      setIsAuth(true);
      navigate("/");
    } catch (error) {
      toast.error("Problem while login");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });

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
      {/* Background glow blobs */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,77,28,0.12) 0%, transparent 70%)",
          top: -100,
          left: -100,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,77,28,0.07) 0%, transparent 70%)",
          bottom: -80,
          right: -80,
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        className="fade-up"
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#161616",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: "44px 40px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#FF4D1C",
              letterSpacing: "-1px",
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            tomato
            <span style={{ color: "rgba(255,77,28,0.35)", fontSize: 44 }}>
              .
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#555", marginTop: 6 }}>
            Food delivery, redefined
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
            marginBottom: 32,
          }}
        />

        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#f0f0f0",
              marginBottom: 6,
            }}
          >
            Welcome back
          </h2>
          <p style={{ fontSize: 13, color: "#666" }}>
            Sign in to continue ordering
          </p>
        </div>

        {/* Google Button */}
        <button
          onClick={googleClientId ? googleLogin : undefined}
          disabled={loading || !googleClientId}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "14px 20px",
            borderRadius: 12,
            background: loading
              ? "rgba(255,255,255,0.03)"
              : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#f0f0f0",
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "Inter, sans-serif",
            cursor: loading || !googleClientId ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading)
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.08)";
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
                  border: "2px solid rgba(255,255,255,0.15)",
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

        {!googleClientId && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <p style={{ fontSize: 12, color: "#f87171", lineHeight: 1.6 }}>
              Google OAuth not configured. Set{" "}
              <code
                style={{
                  background: "rgba(255,255,255,0.08)",
                  padding: "1px 5px",
                  borderRadius: 4,
                }}
              >
                VITE_GOOGLE_CLIENT_ID
              </code>{" "}
              in your .env file.
            </p>
          </div>
        )}

        {/* Footer */}
        <p
          style={{
            marginTop: 28,
            textAlign: "center",
            fontSize: 11,
            color: "#444",
            lineHeight: 1.8,
          }}
        >
          By continuing, you agree to our{" "}
          <span style={{ color: "#FF4D1C", cursor: "pointer" }}>
            Terms of Service
          </span>{" "}
          &{" "}
          <span style={{ color: "#FF4D1C", cursor: "pointer" }}>
            Privacy Policy
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
