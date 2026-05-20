import { useState } from "react";
import { useAppData } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authService } from "../main";

type Role = "customer" | "rider" | "seller" | null;

const roles: { value: Role; label: string; desc: string; icon: string }[] = [
  {
    value: "customer",
    label: "Customer",
    desc: "Order food from restaurants near you",
    icon: "🛵",
  },
  {
    value: "rider",
    label: "Rider",
    desc: "Deliver orders and earn money",
    icon: "🏍️",
  },
  {
    value: "seller",
    label: "Restaurant Owner",
    desc: "List your restaurant and manage orders",
    icon: "🍽️",
  },
];

const SelectRole = () => {
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAppData();
  const navigate = useNavigate();

  const addRole = async () => {
    if (!role) return;
    setLoading(true);
    try {
      const { data } = await axios.put(
        `${authService}/api/auth/add/role`,
        { role },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      localStorage.setItem("token", data.token);
      setUser(data.user);
      navigate("/", { replace: true });
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,77,28,0.08) 0%, transparent 70%)",
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
          maxWidth: 440,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#FF4D1C",
              letterSpacing: "-1px",
              marginBottom: 12,
            }}
          >
            tomato
            <span style={{ color: "rgba(255,77,28,0.35)", fontSize: 40 }}>
              .
            </span>
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#f0f0f0",
              marginBottom: 8,
            }}
          >
            How will you use Tomato?
          </h1>
          <p style={{ fontSize: 13, color: "#555" }}>
            Choose your role to get started
          </p>
        </div>

        {/* Role Cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {roles.map((r) => {
            const isSelected = role === r.value;
            return (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 20px",
                  borderRadius: 16,
                  background: isSelected
                    ? "rgba(255,77,28,0.1)"
                    : "rgba(255,255,255,0.03)",
                  border: isSelected
                    ? "1px solid rgba(255,77,28,0.5)"
                    : "1px solid rgba(255,255,255,0.07)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                  width: "100%",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: isSelected
                      ? "rgba(255,77,28,0.15)"
                      : "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  {r.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: isSelected ? "#FF4D1C" : "#f0f0f0",
                      marginBottom: 3,
                      transition: "color 0.2s",
                    }}
                  >
                    {r.label}
                  </div>
                  <div style={{ fontSize: 12, color: "#555" }}>{r.desc}</div>
                </div>

                {/* Radio dot */}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: isSelected
                      ? "2px solid #FF4D1C"
                      : "2px solid rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#FF4D1C",
                      }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <button
          disabled={!role || loading}
          onClick={addRole}
          className="btn-accent"
          style={{
            width: "100%",
            padding: "15px 20px",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {loading ? (
            <>
              <div
                className="spin"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderTopColor: "#fff",
                }}
              />
              Setting up...
            </>
          ) : (
            "Continue →"
          )}
        </button>
      </div>
    </div>
  );
};

export default SelectRole;
