import axios from "axios";
import { useState } from "react";
import { authService } from "../main";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const responseGoogle = async (authResult: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await axios.post(`${authService}/api/auth/login`, {
        code: authResult["code"],
      });
      const token = result.data.token;
      const user = result.data.user;

      // Only allow admin role through this portal
      if (!user.role || user.role !== "admin") {
        setError(
          user.role
            ? `This is a ${user.role} account. Only admin accounts can access this portal.`
            : "This account has no role assigned. Contact your system administrator.",
        );
        localStorage.removeItem("token");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      toast.success("Welcome, Admin!");
      // Full page reload so AppContext re-fetches the authenticated user
      window.location.href = "/";
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
            "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          pointerEvents: "none",
        }}
      />

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
        {/* Logo + Admin badge */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#FF4D1C",
              letterSpacing: "-1px",
              lineHeight: 1,
              marginBottom: 12,
            }}
          >
            zestify
            <span style={{ color: "rgba(255,77,28,0.35)", fontSize: 38 }}>
              .
            </span>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 99,
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.25)",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>🛡️</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#818cf8",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Admin Portal
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#444", marginTop: 6 }}>
            Restricted access — authorized personnel only
          </p>
        </div>

        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
            marginBottom: 28,
          }}
        />

        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#f0f0f0",
              marginBottom: 6,
            }}
          >
            Admin Sign In
          </h2>
          <p style={{ fontSize: 13, color: "#555" }}>
            Use your admin Google account to continue
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              borderRadius: 12,
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>🚫</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#f87171" }}>
                Access Denied
              </p>
            </div>
            <p style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>
              {error}
            </p>
          </div>
        )}

        {/* Google Button */}
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
            opacity: loading ? 0.6 : 1,
            marginBottom: 16,
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
                  borderTopColor: "#818cf8",
                }}
              />
              Verifying...
            </>
          ) : (
            <>
              <FcGoogle size={20} />
              {error ? "Try another account" : "Continue with Google"}
            </>
          )}
        </button>

        {/* Back link */}
        <div style={{ textAlign: "center" }}>
          <a
            href="/"
            style={{
              fontSize: 12,
              color: "#444",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#888";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#444";
            }}
          >
            ← Back to main site
          </a>
        </div>

        {/* Security note */}
        <div
          style={{
            marginTop: 24,
            padding: "12px 14px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <p style={{ fontSize: 11, color: "#333", lineHeight: 1.6 }}>
            🔒 This portal is for internal use only. All login attempts are
            logged. Unauthorized access is strictly prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
