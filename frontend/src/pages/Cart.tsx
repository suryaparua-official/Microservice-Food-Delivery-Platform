import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useState } from "react";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import axios from "axios";
import { restaurantService } from "../main";
import toast from "react-hot-toast";
import { BiMinus, BiPlus } from "react-icons/bi";
import { TbTrash } from "react-icons/tb";

const Cart = () => {
  const { cart, subTotal, quauntity, fetchCart } = useAppData();
  const navigate = useNavigate();
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [clearingCart, setClearingCart] = useState(false);

  if (!cart || cart.length === 0) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <div style={{ fontSize: 56 }}>🛒</div>
        <p style={{ fontSize: 18, fontWeight: 600, color: "#f0f0f0" }}>
          Your cart is empty
        </p>
        <p style={{ fontSize: 13, color: "#555" }}>
          Add some delicious food to get started
        </p>
        <button
          className="btn-accent"
          onClick={() => navigate("/")}
          style={{ padding: "12px 28px", marginTop: 8 }}
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  const restaurant = cart[0].restaurantId as IRestaurant;
  const deliveryFee = subTotal < 250 ? 49 : 0;
  const platformFee = 7;
  const grandTotal = subTotal + deliveryFee + platformFee;

  const increaseQty = async (itemId: string) => {
    try {
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/inc`,
        { itemId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      await fetchCart();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingItemId(null);
    }
  };

  const decreaseQty = async (itemId: string) => {
    try {
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/dec`,
        { itemId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      await fetchCart();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingItemId(null);
    }
  };

  const clearCart = async () => {
    const confirm = window.confirm("Clear your entire cart?");
    if (!confirm) return;
    try {
      setClearingCart(true);
      await axios.delete(`${restaurantService}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      await fetchCart();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setClearingCart(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "32px 20px 60px",
      }}
    >
      {/* Header */}
      <div
        className="fade-up"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#f0f0f0",
              letterSpacing: "-0.5px",
            }}
          >
            Your Cart
          </h1>
          <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
            {restaurant.name}
          </p>
        </div>
        <button
          onClick={clearCart}
          disabled={clearingCart}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 10,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
            color: "#f87171",
            fontSize: 12,
            fontWeight: 600,
            cursor: clearingCart ? "not-allowed" : "pointer",
            fontFamily: "Inter, sans-serif",
            transition: "all 0.2s",
            opacity: clearingCart ? 0.5 : 1,
          }}
        >
          <TbTrash size={14} />
          Clear Cart
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Left — Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cart.map((cartItem: ICart) => {
            const item = cartItem.itemId as IMenuItem;
            const isLoading = loadingItemId === item._id;

            return (
              <div
                key={item._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px",
                  borderRadius: 16,
                  background: "#161616",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "border 0.2s",
                }}
              >
                {/* Image */}
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 10,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />

                {/* Name + price */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: 15,
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
                  <p
                    style={{ fontSize: 13, color: "#FF4D1C", fontWeight: 600 }}
                  >
                    ₹{item.price}
                  </p>
                </div>

                {/* Qty controls */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "4px",
                  }}
                >
                  <button
                    disabled={isLoading}
                    onClick={() => decreaseQty(item._id)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: "transparent",
                      border: "none",
                      color: "#aaa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,255,255,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                    }}
                  >
                    {isLoading ? (
                      <div
                        className="spin"
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          border: "1.5px solid rgba(255,255,255,0.1)",
                          borderTopColor: "#aaa",
                        }}
                      />
                    ) : (
                      <BiMinus size={14} />
                    )}
                  </button>

                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#f0f0f0",
                      minWidth: 20,
                      textAlign: "center",
                    }}
                  >
                    {cartItem.quauntity}
                  </span>

                  <button
                    disabled={isLoading}
                    onClick={() => increaseQty(item._id)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: "transparent",
                      border: "none",
                      color: "#aaa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "rgba(255,255,255,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                    }}
                  >
                    <BiPlus size={14} />
                  </button>
                </div>

                {/* Line total */}
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#f0f0f0",
                    minWidth: 56,
                    textAlign: "right",
                  }}
                >
                  ₹{item.price * cartItem.quauntity}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right — Bill summary */}
        <div
          style={{
            position: "sticky",
            top: 84,
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#f0f0f0",
              marginBottom: 20,
            }}
          >
            Bill Details
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Row label={`Items (${quauntity})`} value={`₹${subTotal}`} />
            <Row
              label="Delivery Fee"
              value={deliveryFee === 0 ? "Free 🎉" : `₹${deliveryFee}`}
              valueColor={deliveryFee === 0 ? "#4ade80" : undefined}
            />
            <Row label="Platform Fee" value={`₹${platformFee}`} />

            {subTotal < 250 && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(255,77,28,0.08)",
                  border: "1px solid rgba(255,77,28,0.15)",
                }}
              >
                <p style={{ fontSize: 12, color: "#FF4D1C" }}>
                  Add ₹{250 - subTotal} more for free delivery
                </p>
              </div>
            )}

            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.07)",
                margin: "4px 0",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>
                Grand Total
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#FF4D1C" }}>
                ₹{grandTotal}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            disabled={!restaurant.isOpen}
            className="btn-accent"
            style={{
              width: "100%",
              padding: "14px",
              marginTop: 20,
              fontSize: 14,
            }}
          >
            {restaurant.isOpen ? "Proceed to Checkout →" : "Restaurant Closed"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Row = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span style={{ fontSize: 13, color: "#666" }}>{label}</span>
    <span
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: valueColor || "#f0f0f0",
      }}
    >
      {value}
    </span>
  </div>
);

export default Cart;
