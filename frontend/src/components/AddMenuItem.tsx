import axios from "axios";
import { useState } from "react";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { BiUpload } from "react-icons/bi";

const AddMenuItem = ({ onItemAdded }: { onItemAdded: () => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setImage(null);
    setPreview(null);
  };

  const handleImageChange = (file: File | null) => {
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || !image) {
      toast.error("Name, price and image are required");
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("file", image);
    try {
      setLoading(true);
      await axios.post(`${restaurantService}/api/item/new`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Item added successfully!");
      resetForm();
      onItemAdded();
    } catch {
      toast.error("Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#f0f0f0",
            marginBottom: 4,
          }}
        >
          Add Menu Item
        </h2>
        <p style={{ fontSize: 13, color: "#555" }}>
          Fill in the details below to add a new dish to your menu
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Image upload with preview */}
        <div>
          <label
            style={{
              fontSize: 11,
              color: "#555",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "block",
              marginBottom: 8,
            }}
          >
            Item Photo *
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: preview ? "12px" : "18px 16px",
              borderRadius: 14,
              background: preview
                ? "rgba(255,77,28,0.06)"
                : "rgba(255,255,255,0.03)",
              border: `1px dashed ${preview ? "rgba(255,77,28,0.35)" : "rgba(255,255,255,0.12)"}`,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!preview) {
                (e.currentTarget as HTMLLabelElement).style.borderColor =
                  "rgba(255,77,28,0.35)";
                (e.currentTarget as HTMLLabelElement).style.background =
                  "rgba(255,77,28,0.04)";
              }
            }}
            onMouseLeave={(e) => {
              if (!preview) {
                (e.currentTarget as HTMLLabelElement).style.borderColor =
                  "rgba(255,255,255,0.12)";
                (e.currentTarget as HTMLLabelElement).style.background =
                  "rgba(255,255,255,0.03)";
              }
            }}
          >
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="preview"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 10,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#f0f0f0",
                      marginBottom: 2,
                    }}
                  >
                    {image?.name}
                  </p>
                  <p style={{ fontSize: 11, color: "#555" }}>
                    Click to change photo
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(255,77,28,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <BiUpload size={18} color="#FF4D1C" />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#555",
                      marginBottom: 2,
                    }}
                  >
                    Upload item photo
                  </p>
                  <p style={{ fontSize: 11, color: "#333" }}>
                    JPG, PNG up to 5MB
                  </p>
                </div>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
            />
          </label>
        </div>

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
              marginBottom: 8,
            }}
          >
            Item Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Butter Chicken"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
              marginBottom: 8,
            }}
          >
            Description
            <span
              style={{
                color: "#333",
                fontWeight: 400,
                marginLeft: 6,
                textTransform: "none",
                fontSize: 10,
              }}
            >
              optional
            </span>
          </label>
          <textarea
            placeholder="Brief description of the dish..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-dark"
            rows={2}
            style={{ resize: "vertical", minHeight: 72 }}
          />
        </div>

        {/* Price */}
        <div>
          <label
            style={{
              fontSize: 11,
              color: "#555",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "block",
              marginBottom: 8,
            }}
          >
            Price *
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 15,
                fontWeight: 700,
                color: "#FF4D1C",
              }}
            >
              ₹
            </span>
            <input
              type="number"
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-dark"
              style={{ height: 48, paddingLeft: 34 }}
            />
          </div>
        </div>

        {/* Preview card */}
        {name && price && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "#444",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
              }}
            >
              Preview
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {preview ? (
                <img
                  src={preview}
                  alt=""
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  🍽️
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f0f0f0",
                    marginBottom: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {name}
                </p>
                {description && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "#555",
                      marginBottom: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {description}
                  </p>
                )}
                <span
                  style={{ fontSize: 14, fontWeight: 800, color: "#FF4D1C" }}
                >
                  ₹{price}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          disabled={loading}
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
              Adding Item...
            </>
          ) : (
            "Add to Menu →"
          )}
        </button>
      </div>
    </div>
  );
};

export default AddMenuItem;
