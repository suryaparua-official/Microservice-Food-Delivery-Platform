import { useState } from "react";
import type { IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { BiEdit, BiMapPin, BiSave, BiLogOut } from "react-icons/bi";
import { useAppData } from "../context/AppContext";

interface Props {
  restaurant: IRestaurant;
  isSeller: boolean;
  onUpdate: (restaurant: IRestaurant) => void;
}

const RestaurantProfile = ({ restaurant, isSeller, onUpdate }: Props) => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description);
  const [isOpen, setIsOpen] = useState(restaurant.isOpen);
  const [loading, setLoading] = useState(false);
  const { setIsAuth, setUser } = useAppData();

  const toggleOpenStatus = async () => {
    try {
      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/status`,
        { status: !isOpen },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success(data.message);
      setIsOpen(data.restaurant.isOpen);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const saveChanges = async () => {
    try {
      setLoading(true);
      const { data } = await axios.put(
        `${restaurantService}/api/restaurant/edit`,
        { name, description },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success(data.message);
      onUpdate(data.restaurant);
      setEditMode(false);
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const logoutHandler = async () => {
    try {
      await axios.put(
        `${restaurantService}/api/restaurant/status`,
        { status: false },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
    } catch {}
    localStorage.removeItem("token");
    setIsAuth(false);
    setUser(null);
    toast.success("Logged out successfully");
  };

  return (
    <div
      style={{
        background: "#161616",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {/* Cover image */}
      {restaurant.image && (
        <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
          <img
            src={restaurant.image}
            alt={restaurant.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(22,22,22,1) 0%, rgba(22,22,22,0.3) 50%, transparent 100%)",
            }}
          />

          {/* Open/Closed badge over image */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 99,
              background: isOpen
                ? "rgba(34,197,94,0.15)"
                : "rgba(239,68,68,0.15)",
              border: `1px solid ${isOpen ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isOpen ? "#22c55e" : "#ef4444",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: isOpen ? "#4ade80" : "#f87171",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {isOpen ? "Open" : "Closed"}
            </span>
          </div>
        </div>
      )}

      <div style={{ padding: 24 }}>
        {/* Name row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {editMode ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-dark"
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  height: 48,
                  marginBottom: 0,
                }}
              />
            ) : (
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#f0f0f0",
                  letterSpacing: "-0.5px",
                }}
              >
                {restaurant.name}
              </h2>
            )}
          </div>

          {isSeller && (
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: editMode
                  ? "rgba(255,77,28,0.1)"
                  : "rgba(255,255,255,0.05)",
                border: `1px solid ${editMode ? "rgba(255,77,28,0.25)" : "rgba(255,255,255,0.08)"}`,
                color: editMode ? "#FF4D1C" : "#666",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
            >
              <BiEdit size={16} />
            </button>
          )}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          {editMode ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-dark"
              rows={2}
              style={{ resize: "vertical" }}
            />
          ) : (
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
              {restaurant.description || "No description added"}
            </p>
          )}
        </div>

        {/* Location */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 20,
          }}
        >
          <BiMapPin size={13} color="#FF4D1C" />
          <p style={{ fontSize: 12, color: "#444" }}>
            {restaurant.autoLocation?.formattedAddress ||
              "Location unavailable"}
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.06)",
            marginBottom: 20,
          }}
        />

        {/* Action buttons */}
        {isSeller && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* Save button — only in edit mode */}
            {editMode && (
              <button
                onClick={saveChanges}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  color: "#60a5fa",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "all 0.2s",
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(59,130,246,0.18)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(59,130,246,0.1)";
                }}
              >
                {loading ? (
                  <div
                    className="spin"
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "2px solid rgba(59,130,246,0.2)",
                      borderTopColor: "#60a5fa",
                    }}
                  />
                ) : (
                  <BiSave size={15} />
                )}
                {loading ? "Saving..." : "Save Changes"}
              </button>
            )}

            {/* Toggle open/close */}
            <button
              onClick={toggleOpenStatus}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 18px",
                borderRadius: 10,
                background: isOpen
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(34,197,94,0.08)",
                border: `1px solid ${isOpen ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
                color: isOpen ? "#f87171" : "#4ade80",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isOpen
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(34,197,94,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isOpen
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(34,197,94,0.08)";
              }}
            >
              {isOpen ? "● Close Restaurant" : "● Open Restaurant"}
            </button>

            {/* Logout */}
            <button
              onClick={logoutHandler}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 18px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#555",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                transition: "all 0.2s",
                marginLeft: "auto",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(239,68,68,0.08)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(239,68,68,0.2)";
                (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLButtonElement).style.color = "#555";
              }}
            >
              <BiLogOut size={15} />
              Logout
            </button>
          </div>
        )}

        <p style={{ fontSize: 11, color: "#333", marginTop: 16 }}>
          Listed since{" "}
          {new Date(restaurant.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
};

export default RestaurantProfile;
