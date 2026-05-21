import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";

const RestaurantPage = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRestaurant = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/${id}`,
        {
          ...(token && {
            headers: { Authorization: `Bearer ${token}` },
          }),
        },
      );
      setRestaurant(data || null);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${restaurantService}/api/item/all/${id}`,
        {
          ...(token && {
            headers: { Authorization: `Bearer ${token}` },
          }),
        },
      );
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setMenuItems([]);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRestaurant();
      fetchMenuItems();
    }
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 20px",
        }}
      >
        {/* Hero skeleton */}
        <div
          className="shimmer"
          style={{ height: 260, borderRadius: 20, marginBottom: 24 }}
        />
        {/* Grid skeleton */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="shimmer"
              style={{ height: 120, borderRadius: 14 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 48 }}>🍽️</div>
        <p style={{ color: "#555", fontSize: 16 }}>Restaurant not found</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "32px 20px 60px",
      }}
    >
      {/* Restaurant profile */}
      <div className="fade-up">
        <RestaurantProfile
          restaurant={restaurant}
          onUpdate={setRestaurant}
          isSeller={false}
        />
      </div>

      {/* Menu section */}
      <div style={{ marginTop: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#f0f0f0",
            }}
          >
            Menu
          </h2>
          <div
            style={{
              height: 1,
              flex: 1,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.08), transparent)",
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: "#555",
              fontWeight: 500,
            }}
          >
            {menuItems.length} items
          </span>
        </div>

        {menuItems.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 18,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍴</div>
            <p style={{ color: "#555", fontSize: 14 }}>
              No menu items available yet
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "#161616",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20,
              padding: 20,
            }}
          >
            <MenuItems
              isSeller={false}
              items={menuItems}
              onItemDeleted={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantPage;
