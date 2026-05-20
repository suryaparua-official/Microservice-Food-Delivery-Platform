import { useState } from "react";
import type { IMenuItem } from "../types";
import { FiEyeOff } from "react-icons/fi";
import { BsCartPlus, BsEye } from "react-icons/bs";
import { BiTrash } from "react-icons/bi";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { useAppData } from "../context/AppContext";
import { useLoginModal } from "../context/LoginModalContext";

interface MenuItemsProps {
  items: IMenuItem[];
  onItemDeleted: () => void;
  isSeller: boolean;
}

const MenuItems = ({ items, onItemDeleted, isSeller }: MenuItemsProps) => {
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const { fetchCart } = useAppData();

  const { openLoginModal } = useLoginModal();
  const { isAuth } = useAppData();

  const handleDelete = async (itemId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this item?",
    );
    if (!confirm) return;
    try {
      await axios.delete(`${restaurantService}/api/item/${itemId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Item deleted");
      onItemDeleted();
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const toggleAvailability = async (itemId: string) => {
    try {
      const { data } = await axios.put(
        `${restaurantService}/api/item/status/${itemId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success(data.message);
      onItemDeleted();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const addToCart = async (restaurantId: string, itemId: string) => {
    if (!isAuth) {
      openLoginModal();
      return;
    }
    try {
      setLoadingItemId(itemId);
      const { data } = await axios.post(
        `${restaurantService}/api/cart/add`,
        { restaurantId, itemId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success(data.message);
      fetchCart();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add");
    } finally {
      setLoadingItemId(null);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 14,
      }}
    >
      {items.map((item) => {
        const isLoading = loadingItemId === item._id;
        const unavailable = !item.isAvailable;

        return (
          <div
            key={item._id}
            style={{
              display: "flex",
              gap: 14,
              padding: 14,
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              transition: "all 0.2s ease",
              opacity: unavailable ? 0.5 : 1,
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              if (!unavailable) {
                (e.currentTarget as HTMLDivElement).style.background =
                  "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "rgba(255,255,255,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLDivElement).style.borderColor =
                "rgba(255,255,255,0.06)";
            }}
          >
            {/* Image */}
            <div
              style={{
                position: "relative",
                flexShrink: 0,
                width: 80,
                height: 80,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <img
                src={item.image}
                alt={item.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: unavailable ? "grayscale(1) brightness(0.5)" : "none",
                }}
              />
              {unavailable && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,0.5)",
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#888",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    textAlign: "center",
                    padding: "0 4px",
                  }}
                >
                  Unavailable
                </div>
              )}
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: 0,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f0f0f0",
                    marginBottom: 4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.name}
                </h3>
                {item.description && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "#555",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.description}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#FF4D1C",
                  }}
                >
                  ₹{item.price}
                </span>

                {/* Seller controls */}
                {isSeller && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => toggleAvailability(item._id)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#aaa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,255,255,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,255,255,0.05)";
                      }}
                    >
                      {item.isAvailable ? (
                        <BsEye size={14} />
                      ) : (
                        <FiEyeOff size={14} />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(item._id)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.15)",
                        color: "#f87171",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(239,68,68,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(239,68,68,0.08)";
                      }}
                    >
                      <BiTrash size={14} />
                    </button>
                  </div>
                )}

                {/* Customer add to cart */}
                {!isSeller && (
                  <button
                    disabled={unavailable || isLoading}
                    onClick={() => addToCart(item.restaurantId, item._id)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: unavailable
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(255,77,28,0.12)",
                      border: unavailable
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(255,77,28,0.25)",
                      color: unavailable ? "#444" : "#FF4D1C",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: unavailable ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!unavailable && !isLoading)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,77,28,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      if (!unavailable)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,77,28,0.12)";
                    }}
                  >
                    {isLoading ? (
                      <div
                        className="spin"
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          border: "2px solid rgba(255,77,28,0.2)",
                          borderTopColor: "#FF4D1C",
                        }}
                      />
                    ) : (
                      <BsCartPlus size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MenuItems;
