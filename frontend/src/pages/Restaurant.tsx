import { useEffect, useState } from "react";
import type { IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import AddMenuItem from "../components/AddMenuItem";
import RestaurantOrders from "../components/RestaurantOrders";

type SellerTab = "orders" | "menu" | "add-item";

const TABS: { key: SellerTab; label: string; icon: string }[] = [
  { key: "orders", label: "Orders", icon: "📋" },
  { key: "menu", label: "Menu", icon: "🍴" },
  { key: "add-item", label: "Add Item", icon: "＋" },
];

const Restaurant = () => {
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SellerTab>("orders");
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);

  const fetchMyRestaurant = async () => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/my`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setRestaurant(data.restaurant || null);
      if (data.token) {
        localStorage.setItem("token", data.token);
        window.location.reload();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (restaurantId: string) => {
    try {
      const { data } = await axios.get(
        `${restaurantService}/api/item/all/${restaurantId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setMenuItems(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchMyRestaurant();
  }, []);
  useEffect(() => {
    if (restaurant?._id) fetchMenuItems(restaurant._id);
  }, [restaurant]);

  // Loading
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
        <p style={{ color: "#444", fontSize: 13 }}>
          Loading your restaurant...
        </p>
      </div>
    );
  }

  // No restaurant — show registration
  if (!restaurant)
    return <AddRestaurant fetchMyRestaurant={fetchMyRestaurant} />;

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
        <span style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>
          Restaurant Dashboard
        </span>
      </div>

      <div
        style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 60px" }}
      >
        {/* Restaurant profile */}
        <div className="fade-up" style={{ marginBottom: 20 }}>
          <RestaurantProfile
            restaurant={restaurant}
            onUpdate={setRestaurant}
            isSeller={true}
          />
        </div>

        {/* Tab section */}
        <div
          style={{
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {TABS.map((t) => {
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    flex: 1,
                    padding: "16px 12px",
                    background: "transparent",
                    border: "none",
                    borderBottom: isActive
                      ? "2px solid #FF4D1C"
                      : "2px solid transparent",
                    color: isActive ? "#FF4D1C" : "#555",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#888";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#555";
                  }}
                >
                  <span style={{ fontSize: 15 }}>{t.icon}</span>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ padding: 24 }}>
            {tab === "orders" && (
              <RestaurantOrders restaurantId={restaurant._id} />
            )}
            {tab === "menu" &&
              (menuItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🍴</div>
                  <p
                    style={{
                      fontSize: 15,
                      color: "#555",
                      fontWeight: 500,
                      marginBottom: 8,
                    }}
                  >
                    No menu items yet
                  </p>
                  <p style={{ fontSize: 13, color: "#333" }}>
                    Switch to "Add Item" tab to add your first dish
                  </p>
                </div>
              ) : (
                <MenuItems
                  items={menuItems}
                  onItemDeleted={() => fetchMenuItems(restaurant._id)}
                  isSeller={true}
                />
              ))}
            {tab === "add-item" && (
              <AddMenuItem
                onItemAdded={() => {
                  fetchMenuItems(restaurant._id);
                  setTab("menu");
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Restaurant;
