import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../main";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";

type PartnerType = "seller" | "rider" | null;

const PARTNERS = [
  {
    type: "seller" as const,
    icon: "🍽️",
    title: "Restaurant Partner",
    desc: "List your restaurant, manage menu and orders from your own dashboard.",
    perks: [
      "Your own restaurant dashboard",
      "Menu & order management",
      "Real-time order tracking",
      "Earnings analytics",
    ],
    color: "#FF4D1C",
    bg: "rgba(255,77,28,0.08)",
    border: "rgba(255,77,28,0.25)",
  },
  {
    type: "rider" as const,
    icon: "🏍️",
    title: "Delivery Partner",
    desc: "Deliver food on your schedule and earn money with every order.",
    perks: [
      "Flexible working hours",
      "Earn per delivery",
      "Live order navigation",
      "Weekly payouts",
    ],
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.25)",
  },
];

const Partner = () => {
  const [selected, setSelected] = useState<PartnerType>(null);
  const [loading, setLoading] = useState(false);
  const { setUser, setIsAuth } = useAppData();
  const navigate = useNavigate();

  const responseGoogle = async (authResult: any) => {
    if (!selected) return;
    setLoading(true);
    try {
      // Step 1 — login
      const loginRes = await axios.post(`${authService}/api/auth/login`, {
        code: authResult["code"],
      });
      const token = loginRes.data.token;
      localStorage.setItem("token", token);

      // Step 2 — set role
      const roleRes = await axios.put(
        `${authService}/api/auth/add/role`,
        { role: selected },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      localStorage.setItem("token", roleRes.data.token);
      setUser(roleRes.data.user);
      setIsAuth(true);
      toast.success(
        `Welcome aboard as a ${selected === "seller" ? "Restaurant Partner" : "Delivery Partner"}!`,
      );
      // App.tsx automatically renders seller/rider dashboard
      navigate("/");
    } catch (error: any) {
      // already has a role
      const msg = error?.response?.data?.message || "";
      if (
        msg.toLowerCase().includes("role") ||
        error?.response?.status === 400
      ) {
        toast.error(
          "This account already has a role. Please use the main Sign in.",
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });

  const activePartner = PARTNERS.find((p) => p.type === selected);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow blobs */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,77,28,0.06) 0%, transparent 70%)",
          top: -200,
          left: -200,
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
            "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
          bottom: -100,
          right: -100,
          pointerEvents: "none",
        }}
      />

      {/* Navbar */}
      <div
        style={{
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <a
          href="/"
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#FF4D1C",
            textDecoration: "none",
            letterSpacing: "-0.5px",
          }}
        >
          zestify
          <span style={{ color: "rgba(255,77,28,0.4)", fontSize: 26 }}>.</span>
        </a>
        <a
          href="/"
          style={{
            fontSize: 13,
            color: "#555",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f0f0")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
        >
          ← Back to app
        </a>
      </div>

      <div
        style={{ maxWidth: 960, margin: "0 auto", padding: "52px 24px 80px" }}
      >
        {/* Header */}
        <div
          className="fade-up"
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 99,
              background: "rgba(255,77,28,0.1)",
              border: "1px solid rgba(255,77,28,0.2)",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#FF4D1C",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Partner Program
            </span>
          </div>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: "#f0f0f0",
              letterSpacing: "-1px",
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Grow your business
            <br />
            <span style={{ color: "#FF4D1C" }}>with zestify.</span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "#555",
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Join thousands of restaurant owners and delivery partners already
            earning with us.
          </p>
        </div>

        {/* Partner cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 40,
          }}
        >
          {PARTNERS.map((partner) => {
            const isSelected = selected === partner.type;
            return (
              <div
                key={partner.type}
                onClick={() => setSelected(partner.type)}
                style={{
                  padding: 28,
                  borderRadius: 22,
                  background: isSelected
                    ? partner.bg
                    : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isSelected ? partner.border : "rgba(255,255,255,0.07)"}`,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,255,255,0.12)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(255,255,255,0.02)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,255,255,0.07)";
                  }
                }}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: partner.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: "#fff",
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </div>
                )}

                {/* Icon */}
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    background: isSelected
                      ? `${partner.color}20`
                      : "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                    marginBottom: 20,
                    transition: "all 0.25s",
                  }}
                >
                  {partner.icon}
                </div>

                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: isSelected ? partner.color : "#f0f0f0",
                    marginBottom: 8,
                    transition: "color 0.25s",
                  }}
                >
                  {partner.title}
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: "#555",
                    lineHeight: 1.6,
                    marginBottom: 20,
                  }}
                >
                  {partner.desc}
                </p>

                {/* Perks */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {partner.perks.map((perk) => (
                    <div
                      key={perk}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: isSelected
                            ? `${partner.color}20`
                            : "rgba(255,255,255,0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          color: isSelected ? partner.color : "#444",
                          flexShrink: 0,
                          transition: "all 0.25s",
                        }}
                      >
                        ✓
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: isSelected ? "#ccc" : "#444",
                        }}
                      >
                        {perk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div
          className="fade-up"
          style={{
            maxWidth: 440,
            margin: "0 auto",
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 24,
            padding: "32px 36px",
            textAlign: "center",
          }}
        >
          {selected ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 12 }}>
                {activePartner?.icon}
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#f0f0f0",
                  marginBottom: 6,
                }}
              >
                Join as {activePartner?.title}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "#555",
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                Sign in with Google to create your partner account. Your
                dashboard will be ready instantly.
              </p>

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
                  background: activePartner?.color,
                  border: "none",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  opacity: loading ? 0.7 : 1,
                  marginBottom: 12,
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
                        border: "2px solid rgba(255,255,255,0.2)",
                        borderTopColor: "#fff",
                      }}
                    />
                    Setting up your account...
                  </>
                ) : (
                  <>
                    <FcGoogle size={20} />
                    Continue with Google
                  </>
                )}
              </button>

              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#444",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
              >
                ← Choose a different option
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>👆</div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#f0f0f0",
                  marginBottom: 8,
                }}
              >
                Choose your partner type
              </h3>
              <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>
                Select one of the options above to get started with your partner
                account.
              </p>
            </>
          )}
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#333",
            marginTop: 32,
          }}
        >
          Already a partner?{" "}
          <a href="/login" style={{ color: "#FF4D1C", textDecoration: "none" }}>
            Sign in here →
          </a>
        </p>
      </div>
    </div>
  );
};

export default Partner;
