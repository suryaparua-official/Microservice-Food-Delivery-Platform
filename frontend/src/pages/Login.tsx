import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../main";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useAppData } from "../context/AppContext";

const BLOCKED_ROLES = ["seller", "rider", "admin"];

const ROLE_MESSAGE: Record<
  string,
  { msg: string; link: string; label: string }
> = {
  seller: {
    msg: "This is a Restaurant Partner account.",
    link: "/partner",
    label: "Go to Partner Portal →",
  },
  rider: {
    msg: "This is a Delivery Partner account.",
    link: "/partner",
    label: "Go to Partner Portal →",
  },
  admin: {
    msg: "This is an Admin account.",
    link: "/partner",
    label: "Contact Administrator",
  },
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [blockedRole, setBlockedRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setUser, setIsAuth } = useAppData();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const responseGoogle = async (authResult: any) => {
    setLoading(true);
    setBlockedRole(null);
    try {
      const result = await axios.post(`${authService}/api/auth/login`, {
        code: authResult["code"],
      });
      const token = result.data.token;
      const user = result.data.user;
      localStorage.setItem("token", token);

      // Block seller, rider, and admin roles from customer login
      if (user.role && BLOCKED_ROLES.includes(user.role)) {
        setBlockedRole(user.role);
        localStorage.removeItem("token");
        setLoading(false);
        return;
      }

      // Customer or no role — assign customer role
      if (!user.role) {
        const roleRes = await axios.put(
          `${authService}/api/auth/add/role`,
          { role: "customer" },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        localStorage.setItem("token", roleRes.data.token);
        setUser(roleRes.data.user);
      } else {
        setUser(user);
      }

      setIsAuth(true);
      toast.success("Welcome back!");
      navigate("/");
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
            zestify
            <span style={{ color: "rgba(255,77,28,0.35)", fontSize: 44 }}>
              .
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#555", marginTop: 6 }}>
            Food delivery, redefined
          </p>
        </div>

        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
            marginBottom: 32,
          }}
        />

        {/* Blocked role message */}
        {blockedRole && ROLE_MESSAGE[blockedRole] && (
          <div
            style={{
              marginBottom: 24,
              padding: "16px 18px",
              borderRadius: 14,
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>🚫</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#f87171" }}>
                Wrong portal
              </p>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#888",
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              {ROLE_MESSAGE[blockedRole].msg} You cannot sign in as a customer
              with this account.
            </p>
            <a
              href={ROLE_MESSAGE[blockedRole].link}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 10,
                background: "rgba(255,77,28,0.1)",
                border: "1px solid rgba(255,77,28,0.25)",
                color: "#FF4D1C",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              {ROLE_MESSAGE[blockedRole].label}
            </a>
          </div>
        )}

        {!blockedRole && (
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
        )}

        {/* Google Button */}
        <button
          onClick={googleClientId ? () => googleLogin() : undefined}
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
              {blockedRole ? "Try another account" : "Continue with Google"}
            </>
          )}
        </button>

        {/* Partner link */}
        <div
          style={{
            marginTop: 24,
            textAlign: "center",
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p style={{ fontSize: 12, color: "#444" }}>
            Restaurant owner or delivery partner?{" "}
            <a
              href="/partner"
              style={{
                color: "#FF4D1C",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Join as Partner →
            </a>
          </p>
        </div>

        <p
          style={{
            marginTop: 20,
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
