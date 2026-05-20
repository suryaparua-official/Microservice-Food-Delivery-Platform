import axios from "axios";
import { useEffect, useState } from "react";
import { adminService } from "../main";
import AdminRestaurantCard from "../components/AdminRestaurantCard";
import RiderAdmin from "../components/RiderAdmin";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";

type Tab = "restaurant" | "rider";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "restaurant", label: "Restaurants", icon: "🍽️" },
  { key: "rider", label: "Riders", icon: "🏍️" },
];

const Admin = () => {
  const { setIsAuth, setUser } = useAppData();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("restaurant");

  const fetchData = async () => {
    try {
      const [resData, riderData] = await Promise.all([
        axios.get(`${adminService}/api/v1/admin/restaurant/pending`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        axios.get(`${adminService}/api/v1/admin/rider/pending`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);
      setRestaurants(resData.data.restaurants || []);
      setRiders(riderData.data.riders || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const logoutHandler = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
    setUser(null);
    toast.success("Logged out successfully");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d0d0d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          className="spin"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "3px solid rgba(255,77,28,0.15)",
            borderTopColor: "#FF4D1C",
          }}
        />
        <p style={{ color: "#444", fontSize: 13 }}>Loading admin panel...</p>
      </div>
    );
  }

  const pendingCount =
    tab === "restaurant" ? restaurants.length : riders.length;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>
      {/* Top bar */}
      <div
        style={{
          background: "rgba(22,22,22,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#FF4D1C",
            letterSpacing: "-0.5px",
          }}
        >
          tomato
          <span style={{ color: "rgba(255,77,28,0.35)", fontSize: 24 }}>.</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#444", fontWeight: 500 }}>
            Admin Panel
          </span>
          <button
            onClick={logoutHandler}
            style={{
              padding: "7px 14px",
              borderRadius: 9,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              color: "#f87171",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,0.08)";
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div
        style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px" }}
      >
        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#f0f0f0",
              letterSpacing: "-0.5px",
              marginBottom: 6,
            }}
          >
            Verification Panel
          </h1>
          <p style={{ fontSize: 13, color: "#555" }}>
            Review and verify pending restaurant and rider applications
          </p>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 24,
            maxWidth: 480,
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 16,
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#444",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Pending Restaurants
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: restaurants.length > 0 ? "#FF4D1C" : "#333",
              }}
            >
              {restaurants.length}
            </p>
          </div>
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 16,
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "#444",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Pending Riders
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: riders.length > 0 ? "#FF4D1C" : "#333",
              }}
            >
              {riders.length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {TABS.map((t) => {
            const isActive = tab === t.key;
            const count =
              t.key === "restaurant" ? restaurants.length : riders.length;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 12,
                  background: isActive
                    ? "rgba(255,77,28,0.1)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? "rgba(255,77,28,0.3)" : "rgba(255,255,255,0.07)"}`,
                  color: isActive ? "#FF4D1C" : "#555",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.03)";
                }}
              >
                <span>{t.icon}</span>
                {t.label}
                {count > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: isActive ? "#FF4D1C" : "#444",
                      background: isActive
                        ? "rgba(255,77,28,0.15)"
                        : "rgba(255,255,255,0.06)",
                      padding: "2px 7px",
                      borderRadius: 99,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {pendingCount === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#f0f0f0",
                marginBottom: 6,
              }}
            >
              All caught up!
            </p>
            <p style={{ fontSize: 13, color: "#444" }}>
              No pending {tab === "restaurant" ? "restaurant" : "rider"}{" "}
              applications
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {tab === "restaurant" &&
              restaurants.map((r) => (
                <AdminRestaurantCard
                  key={r._id}
                  restaurant={r}
                  onVerify={fetchData}
                />
              ))}
            {tab === "rider" &&
              riders.map((r) => (
                <RiderAdmin key={r._id} rider={r} onVerify={fetchData} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
