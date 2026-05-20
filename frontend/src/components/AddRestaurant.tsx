import { useState } from "react";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import axios from "axios";
import { restaurantService } from "../main";
import { BiMapPin, BiUpload } from "react-icons/bi";

interface Props {
  fetchMyRestaurant: () => Promise<void>;
}

const AddRestaurant = ({ fetchMyRestaurant }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { loadingLocation, location } = useAppData();

  const handleSubmit = async () => {
    if (!name || !image || !location) {
      toast.error("All fields are required");
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("latitude", String(location.latitude));
    formData.append("longitude", String(location.longitude));
    formData.append("formattedAddress", location.formattedAddress);
    formData.append("file", image);
    formData.append("phone", phone);
    try {
      setSubmitting(true);
      await axios.post(`${restaurantService}/api/restaurant/new`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Restaurant added successfully!");
      fetchMyRestaurant();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add restaurant");
    } finally {
      setSubmitting(false);
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
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,77,28,0.07) 0%, transparent 70%)",
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
          maxWidth: 480,
          background: "#161616",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: "40px 36px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#f0f0f0",
              letterSpacing: "-0.5px",
              marginBottom: 6,
            }}
          >
            List Your Restaurant
          </h1>
          <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
            Fill in your restaurant details to start receiving orders
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Name */}
          <div>
            <label
              style={{
                fontSize: 11,
                color: "#555",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 6,
              }}
            >
              Restaurant Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Spice Garden"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-dark"
              style={{ height: 48 }}
            />
          </div>

          {/* Phone */}
          <div>
            <label
              style={{
                fontSize: 11,
                color: "#555",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 6,
              }}
            >
              Contact Number
            </label>
            <input
              type="number"
              placeholder="Your restaurant phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-dark"
              style={{ height: 48 }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                fontSize: 11,
                color: "#555",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 6,
              }}
            >
              Description
            </label>
            <textarea
              placeholder="What makes your restaurant special?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-dark"
              rows={3}
              style={{ resize: "vertical", minHeight: 80 }}
            />
          </div>

          {/* Image upload */}
          <div>
            <label
              style={{
                fontSize: 11,
                color: "#555",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 6,
              }}
            >
              Restaurant Photo *
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderRadius: 12,
                background: image
                  ? "rgba(255,77,28,0.06)"
                  : "rgba(255,255,255,0.03)",
                border: `1px dashed ${image ? "rgba(255,77,28,0.4)" : "rgba(255,255,255,0.12)"}`,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!image) {
                  (e.currentTarget as HTMLLabelElement).style.borderColor =
                    "rgba(255,77,28,0.35)";
                  (e.currentTarget as HTMLLabelElement).style.background =
                    "rgba(255,77,28,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!image) {
                  (e.currentTarget as HTMLLabelElement).style.borderColor =
                    "rgba(255,255,255,0.12)";
                  (e.currentTarget as HTMLLabelElement).style.background =
                    "rgba(255,255,255,0.03)";
                }
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(255,77,28,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <BiUpload size={17} color="#FF4D1C" />
              </div>
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: image ? "#f0f0f0" : "#555",
                  }}
                >
                  {image ? image.name : "Upload restaurant photo"}
                </p>
                <p style={{ fontSize: 11, color: "#333", marginTop: 2 }}>
                  JPG, PNG up to 5MB
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Location */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(255,77,28,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <BiMapPin size={17} color="#FF4D1C" />
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 11,
                  color: "#444",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                Location (Auto-detected)
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: loadingLocation ? "#444" : "#ccc",
                  lineHeight: 1.5,
                }}
              >
                {loadingLocation
                  ? "Detecting your location..."
                  : location?.formattedAddress || "Location not available"}
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            disabled={submitting || loadingLocation}
            onClick={handleSubmit}
            className="btn-accent"
            style={{
              width: "100%",
              padding: "15px",
              fontSize: 14,
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {submitting ? (
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
                Adding Restaurant...
              </>
            ) : (
              "Add Restaurant →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRestaurant;
