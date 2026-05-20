import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import { BiLogOut, BiMapPin, BiPackage } from "react-icons/bi";

const menuItems = [
  {
    icon: BiPackage,
    label: "Your Orders",
    desc: "Track and view your order history",
    path: "/orders",
    color: "#FF4D1C",
    bg: "rgba(255,77,28,0.1)",
  },
  {
    icon: BiMapPin,
    label: "Saved Addresses",
    desc: "Manage your delivery addresses",
    path: "/address",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
  },
];

const Account = () => {
  const { user, setUser, setIsAuth } = useAppData();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const logoutHandler = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuth(false);
    navigate("/");
    toast.success("Logged out successfully");
  };

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "0 auto",
        padding: "40px 20px 60px",
      }}
    >
      {/* Profile card */}
      <div
        className="fade-up"
        style={{
          background: "#161616",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 24,
          padding: 28,
          marginBottom: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,77,28,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            position: "relative",
          }}
        >
          {/* Avatar */}
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255,77,28,0.3)",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FF4D1C, #ff8c6b)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#f0f0f0",
                letterSpacing: "-0.3px",
                marginBottom: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "#555",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.email}
            </p>

            {user.role && (
              <span
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#FF4D1C",
                  background: "rgba(255,77,28,0.1)",
                  padding: "3px 10px",
                  borderRadius: 99,
                  textTransform: "capitalize",
                  letterSpacing: "0.03em",
                }}
              >
                {user.role}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 10,
        }}
      >
        {menuItems.map(({ icon: Icon, label, desc, path, color, bg }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "18px 20px",
              borderRadius: 18,
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "left",
              width: "100%",
              fontFamily: "Inter, sans-serif",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#1e1e1e";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(255,255,255,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#161616";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(255,255,255,0.07)";
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={20} color={color} />
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#f0f0f0",
                  marginBottom: 2,
                }}
              >
                {label}
              </p>
              <p style={{ fontSize: 12, color: "#555" }}>{desc}</p>
            </div>
            <span style={{ fontSize: 16, color: "#333" }}>›</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={logoutHandler}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "18px 20px",
          borderRadius: 18,
          background: "rgba(239,68,68,0.05)",
          border: "1px solid rgba(239,68,68,0.12)",
          cursor: "pointer",
          transition: "all 0.2s",
          textAlign: "left",
          width: "100%",
          fontFamily: "Inter, sans-serif",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(239,68,68,0.1)";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "rgba(239,68,68,0.2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(239,68,68,0.05)";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "rgba(239,68,68,0.12)";
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(239,68,68,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BiLogOut size={20} color="#f87171" />
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#f87171",
              marginBottom: 2,
            }}
          >
            Logout
          </p>
          <p style={{ fontSize: 12, color: "#555" }}>
            Sign out of your account
          </p>
        </div>
      </button>
    </div>
  );
};

export default Account;
