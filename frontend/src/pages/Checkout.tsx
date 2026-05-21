import { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import { restaurantService, utilsService } from "../main";
import { useNavigate } from "react-router-dom";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { BiMapPin } from "react-icons/bi";

const COD_MIN = 199;
const COD_MAX = 1499;

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

const Checkout = () => {
  const { cart, subTotal, quauntity, fetchCart } = useAppData();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [loadingCod, setLoadingCod] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!cart || cart.length === 0) {
        setLoadingAddress(false);
        return;
      }
      try {
        const { data } = await axios.get(
          `${restaurantService}/api/address/all`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        setAddresses(data || []);
      } catch (error) {
        console.log(error);
      } finally {
        setLoadingAddress(false);
      }
    };
    fetchAddresses();
  }, [cart]);

  if (!cart || cart.length === 0) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#555", fontSize: 16 }}>Your cart is empty</p>
      </div>
    );
  }

  const restaurant = cart[0].restaurantId as IRestaurant;
  const deliveryFee = subTotal < 250 ? 49 : 0;
  const platformFee = 7;
  const grandTotal = subTotal + deliveryFee + platformFee;

  const codEligible = grandTotal >= COD_MIN && grandTotal <= COD_MAX;
  const codMessage =
    grandTotal < COD_MIN
      ? `COD not available — minimum ₹${COD_MIN} (add ₹${COD_MIN - grandTotal} more)`
      : grandTotal > COD_MAX
        ? `COD not available — maximum ₹${COD_MAX} (use online payment)`
        : `COD available · Pay cash on delivery`;

  const createOrder = async (paymentMethod: "razorpay" | "stripe" | "cod") => {
    if (!selectedAddressId) return null;
    setCreatingOrder(true);
    try {
      const { data } = await axios.post(
        `${restaurantService}/api/order/new`,
        { paymentMethod, addressId: selectedAddressId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      return data;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create order");
      return null;
    } finally {
      setCreatingOrder(false);
    }
  };

  const payWithRazorpay = async () => {
    try {
      setLoadingRazorpay(true);
      const order = await createOrder("razorpay");
      if (!order) return;
      const { orderId, amount } = order;
      const { data } = await axios.post(`${utilsService}/api/payment/create`, {
        orderId,
      });
      const { razorpayOrderId, key } = data;
      const options = {
        key,
        amount: amount * 100,
        currency: "INR",
        name: "Tomato",
        description: "Food Order Payment",
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            await axios.post(`${utilsService}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });
            toast.success("Payment successful 🎉");
            navigate("/paymentsuccess/" + response.razorpay_payment_id);
          } catch {
            toast.error("Payment verification failed");
          }
        },
        theme: { color: "#FF4D1C" },
      };
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setLoadingRazorpay(false);
    }
  };

  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  const payWithStripe = async () => {
    try {
      setLoadingStripe(true);
      const order = await createOrder("stripe");
      if (!order) return;
      const { orderId } = order;
      await stripePromise;
      const { data } = await axios.post(
        `${utilsService}/api/payment/stripe/create`,
        { orderId },
      );
      if (data.url) window.location.href = data.url;
      else toast.error("Failed to create payment session");
    } catch {
      toast.error("Payment failed");
    } finally {
      setLoadingStripe(false);
    }
  };

  const payWithCod = async () => {
    try {
      setLoadingCod(true);
      const order = await createOrder("cod");
      if (!order) return;
      await fetchCart();
      toast.success("Order placed! Pay cash on delivery 💵");
      navigate("/orders");
    } catch {
      toast.error("Failed to place COD order");
    } finally {
      setLoadingCod(false);
    }
  };

  const anyLoading =
    loadingRazorpay || loadingStripe || loadingCod || creatingOrder;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px 60px" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#f0f0f0",
            letterSpacing: "-0.5px",
          }}
        >
          Checkout
        </h1>
        <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
          {restaurant.name}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Delivery Address */}
          <Section title="Delivery Address">
            {loadingAddress ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="shimmer"
                    style={{ height: 64, borderRadius: 12 }}
                  />
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(255,255,255,0.08)",
                }}
              >
                <p style={{ color: "#555", fontSize: 13, marginBottom: 12 }}>
                  No saved addresses
                </p>
                <button
                  onClick={() => navigate("/address")}
                  style={{
                    fontSize: 13,
                    color: "#FF4D1C",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    textDecoration: "underline",
                  }}
                >
                  Add a new address →
                </button>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {addresses.map((addr) => {
                  const selected = selectedAddressId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "14px 16px",
                        borderRadius: 12,
                        background: selected
                          ? "rgba(255,77,28,0.08)"
                          : "rgba(255,255,255,0.02)",
                        border: selected
                          ? "1px solid rgba(255,77,28,0.35)"
                          : "1px solid rgba(255,255,255,0.07)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          background: selected
                            ? "rgba(255,77,28,0.15)"
                            : "rgba(255,255,255,0.04)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <BiMapPin
                          size={16}
                          color={selected ? "#FF4D1C" : "#555"}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#f0f0f0",
                            fontWeight: 500,
                            lineHeight: 1.5,
                          }}
                        >
                          {addr.formattedAddress}
                        </p>
                        <p
                          style={{ fontSize: 11, color: "#555", marginTop: 3 }}
                        >
                          📞 {addr.mobile}
                        </p>
                      </div>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: selected
                            ? "2px solid #FF4D1C"
                            : "2px solid rgba(255,255,255,0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                          transition: "all 0.2s",
                        }}
                      >
                        {selected && (
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#FF4D1C",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Order Summary */}
          <Section title="Order Summary">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cart.map((cartItem: ICart) => {
                const item = cartItem.itemId as IMenuItem;
                return (
                  <div
                    key={cartItem._id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#FF4D1C",
                          background: "rgba(255,77,28,0.1)",
                          padding: "2px 7px",
                          borderRadius: 6,
                        }}
                      >
                        ×{cartItem.quauntity}
                      </span>
                      <span style={{ fontSize: 13, color: "#ccc" }}>
                        {item.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#f0f0f0",
                      }}
                    >
                      ₹{item.price * cartItem.quauntity}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Payment Method */}
          <Section title="Payment Method">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Online payments */}
              <PayBtn
                label="Pay with Razorpay"
                sublabel="UPI · Cards · Netbanking · Wallets"
                emoji="💳"
                color="#2D7FF9"
                loading={loadingRazorpay}
                disabled={!selectedAddressId || anyLoading}
                onClick={payWithRazorpay}
              />
              <PayBtn
                label="Pay with Stripe"
                sublabel="International cards accepted"
                emoji="🌐"
                color="#635BFF"
                loading={loadingStripe}
                disabled={!selectedAddressId || anyLoading}
                onClick={payWithStripe}
              />

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  margin: "4px 0",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(255,255,255,0.07)",
                  }}
                />
                <span style={{ fontSize: 11, color: "#444", fontWeight: 500 }}>
                  OR
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(255,255,255,0.07)",
                  }}
                />
              </div>

              {/* COD eligibility info */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: codEligible
                    ? "rgba(34,197,94,0.07)"
                    : "rgba(239,68,68,0.07)",
                  border: `1px solid ${codEligible ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: codEligible ? "#4ade80" : "#f87171",
                    lineHeight: 1.6,
                  }}
                >
                  {codEligible ? "✓" : "⚠️"} {codMessage}
                  {!codEligible && grandTotal < COD_MIN && (
                    <span
                      style={{
                        display: "block",
                        marginTop: 2,
                        fontSize: 11,
                        color: "#555",
                      }}
                    >
                      COD eligible range: ₹{COD_MIN} – ₹{COD_MAX}
                    </span>
                  )}
                </p>
              </div>

              {/* COD button */}
              <PayBtn
                label="Cash on Delivery"
                sublabel={
                  grandTotal < COD_MIN
                    ? `Min ₹${COD_MIN} required — add ₹${COD_MIN - grandTotal} more`
                    : grandTotal > COD_MAX
                      ? `Max ₹${COD_MAX} — please use online payment`
                      : "Pay cash when your order arrives"
                }
                emoji="💵"
                color="#22c55e"
                loading={loadingCod}
                disabled={!selectedAddressId || anyLoading || !codEligible}
                onClick={payWithCod}
              />

              {!selectedAddressId && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#555",
                    textAlign: "center",
                    paddingTop: 4,
                  }}
                >
                  Select a delivery address to enable payment
                </p>
              )}
            </div>
          </Section>
        </div>

        {/* Right — Bill */}
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
            Bill Summary
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <BillRow label={`Items (${quauntity})`} value={`₹${subTotal}`} />
            <BillRow
              label="Delivery Fee"
              value={deliveryFee === 0 ? "Free 🎉" : `₹${deliveryFee}`}
              valueColor={deliveryFee === 0 ? "#4ade80" : undefined}
            />
            <BillRow label="Platform Fee" value={`₹${platformFee}`} />

            {subTotal < 250 && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(255,77,28,0.07)",
                  border: "1px solid rgba(255,77,28,0.15)",
                }}
              >
                <p style={{ fontSize: 11, color: "#FF4D1C" }}>
                  Add ₹{250 - subTotal} more for free delivery
                </p>
              </div>
            )}

            <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>
                Total
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#FF4D1C" }}>
                ₹{grandTotal}
              </span>
            </div>

            {/* COD badge in bill */}
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                background: codEligible
                  ? "rgba(34,197,94,0.07)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${codEligible ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: codEligible ? "#4ade80" : "#444",
                }}
              >
                💵 COD{" "}
                {codEligible
                  ? `available (₹${COD_MIN}–₹${COD_MAX})`
                  : `not available for this order`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Sub-components ── */

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div
    style={{
      background: "#161616",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: 24,
    }}
  >
    <h3
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: "#f0f0f0",
        marginBottom: 16,
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

const BillRow = ({
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
      style={{ fontSize: 13, fontWeight: 600, color: valueColor || "#f0f0f0" }}
    >
      {value}
    </span>
  </div>
);

const PayBtn = ({
  label,
  sublabel,
  emoji,
  color,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  sublabel: string;
  emoji: string;
  color: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "16px 18px",
      borderRadius: 14,
      background: disabled ? "rgba(255,255,255,0.02)" : `${color}14`,
      border: `1px solid ${disabled ? "rgba(255,255,255,0.06)" : color + "40"}`,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.2s",
      width: "100%",
      fontFamily: "Inter, sans-serif",
      opacity: disabled ? 0.5 : 1,
    }}
    onMouseEnter={(e) => {
      if (!disabled)
        (e.currentTarget as HTMLButtonElement).style.background = `${color}22`;
    }}
    onMouseLeave={(e) => {
      if (!disabled)
        (e.currentTarget as HTMLButtonElement).style.background = `${color}14`;
    }}
  >
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 10,
        background: `${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        flexShrink: 0,
      }}
    >
      {loading ? (
        <div
          className="spin"
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: `2px solid ${color}40`,
            borderTopColor: color,
          }}
        />
      ) : (
        emoji
      )}
    </div>
    <div style={{ textAlign: "left" }}>
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#f0f0f0",
          marginBottom: 2,
        }}
      >
        {loading ? "Processing..." : label}
      </p>
      <p style={{ fontSize: 11, color: "#555" }}>{sublabel}</p>
    </div>
  </button>
);

export default Checkout;
