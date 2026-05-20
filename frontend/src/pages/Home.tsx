import { useSearchParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect, useState } from "react";
import type { IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import RestaurantCard from "../components/RestaurantCard";

const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
};

const SkeletonCard = () => (
  <div
    style={{
      borderRadius: 18,
      overflow: "hidden",
      background: "#161616",
      border: "1px solid rgba(255,255,255,0.06)",
    }}
  >
    <div className="shimmer" style={{ height: 180, borderRadius: 0 }} />
    <div
      style={{
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        className="shimmer"
        style={{ height: 14, width: "70%", borderRadius: 6 }}
      />
      <div
        className="shimmer"
        style={{ height: 12, width: "45%", borderRadius: 6 }}
      />
    </div>
  </div>
);

const Home = () => {
  const { location } = useAppData();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = async () => {
    if (!location?.latitude || !location?.longitude) return;
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${restaurantService}/api/restaurant/all`,
        {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            search,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      setRestaurants(data.restaurants ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [location, search]);

  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "32px 20px 60px",
      }}
    >
      {/* Hero heading */}
      {!search && (
        <div className="fade-up" style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#f0f0f0",
              letterSpacing: "-0.5px",
              marginBottom: 6,
            }}
          >
            What are you <span style={{ color: "#FF4D1C" }}>craving</span>{" "}
            today?
          </h1>
          <p style={{ fontSize: 14, color: "#555" }}>
            {location
              ? "Restaurants near you, ready to deliver"
              : "Getting your location..."}
          </p>
        </div>
      )}

      {search && (
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 14, color: "#666" }}>
            Results for{" "}
            <span style={{ color: "#f0f0f0", fontWeight: 600 }}>
              "{search}"
            </span>
          </p>
        </div>
      )}

      {/* Grid */}
      {loading || !location ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : restaurants.length > 0 ? (
        <div
          className="fade-up"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {restaurants.map((res) => {
            const [resLng, resLat] = res.autoLocation.coordinates;
            const distance = getDistanceKm(
              location.latitude,
              location.longitude,
              resLat,
              resLng,
            );
            return (
              <RestaurantCard
                key={res._id}
                id={res._id}
                name={res.name}
                image={res.image ?? ""}
                distance={`${distance}`}
                isOpen={res.isOpen}
              />
            );
          })}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 300,
            gap: 12,
          }}
        >
          <div style={{ fontSize: 48 }}>🍽️</div>
          <p style={{ fontSize: 16, color: "#555", fontWeight: 500 }}>
            No restaurants found
          </p>
          <p style={{ fontSize: 13, color: "#3a3a3a" }}>
            Try a different search or expand your area
          </p>
        </div>
      )}
    </div>
  );
};

export default Home;
