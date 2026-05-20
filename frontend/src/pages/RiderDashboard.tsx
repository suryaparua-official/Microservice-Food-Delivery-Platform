import { useEffect, useRef, useState } from "react";
import { useAppData } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { riderService } from "../main";
import toast from "react-hot-toast";
import { BiUpload } from "react-icons/bi";
import { BsBellFill } from "react-icons/bs";
import type { IOrder } from "../types";
import audio from "../assets/faaah.mp3";
import RiderOrderRequest from "../components/RiderOrderRequest";
import RiderCurrentOrder from "../components/RiderCurrentOrder";
import RiderOrderMap from "../components/RiderOrderMap";

interface IRider {
  _id: string;
  phoneNumber: string;
  aadharNumber: string;
  drivingLicenseNumber: string;
  picture: string;
  isVerified: boolean;
  isAvailble: boolean;
}

const RiderDashboard = () => {
  const { user, setUser, setIsAuth } = useAppData();
  const { socket } = useSocket();

  const [profile, setProfile] = useState<IRider | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [incomingOrders, setIncomingOrders] = useState<string[]>([]);
  const [currentOrder, setCurrentOrder] = useState<IOrder | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [aadharNumber, setaadharNumber] = useState("");
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio(audio);
    audioRef.current.preload = "auto";
  }, []);

  const logoutHandler = () => {
    localStorage.removeItem("token");
    setTimeout(() => {
      setUser(null);
      setIsAuth(false);
    }, 0);
    toast.success("Logged out successfully");
  };

  const unlockAudio = async () => {
    try {
      if (!audioRef.current) return;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioUnlocked(true);
      toast.success("Sound Enabled");
    } catch {
      toast.error("Tap again to enable sound");
    }
  };

  useEffect(() => {
    if (!socket) return;
    const onOrderAvailable = ({ orderId }: { orderId: string }) => {
      setIncomingOrders((prev) =>
        prev.includes(orderId) ? prev : [...prev, orderId],
      );
      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      setTimeout(() => {
        setIncomingOrders((prev) => prev.filter((id) => id !== orderId));
      }, 10000);
    };
    socket.on("order:available", onOrderAvailable);
    return () => {
      socket.off("order:available", onOrderAvailable);
    };
  }, [socket, audioUnlocked]);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${riderService}/api/rider/myprofile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setProfile(data || null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentOrder = async () => {
    try {
      const { data } = await axios.get(
        `${riderService}/api/rider/order/current`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setCurrentOrder(data.order);
    } catch {
      setCurrentOrder(null);
    }
  };

  useEffect(() => {
    if (user?.role === "rider") fetchProfile();
    else setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCurrentOrder();
  }, []);

  const toggleAvailability = async () => {
    if (!navigator.geolocation) {
      toast.error("Location Access Required");
      return;
    }
    setToggling(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await axios.patch(
          `${riderService}/api/rider/toggle`,
          {
            isAvailble: !profile?.isAvailble,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        toast.success(
          profile?.isAvailble ? "You are now Offline" : "You are now Online",
        );
        fetchProfile();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to toggle");
      } finally {
        setToggling(false);
      }
    });
  };

  const handleSubmit = async () => {
    if (!navigator.geolocation) {
      toast.error("Location Access Required");
      return;
    }
    setSubmitting(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const formData = new FormData();
      formData.append("phoneNumber", phoneNumber);
      formData.append("aadharNumber", aadharNumber);
      formData.append("drivingLicenseNumber", drivingLicenseNumber);
      formData.append("latitude", pos.coords.latitude.toString());
      formData.append("longitude", pos.coords.longitude.toString());
      if (image) formData.append("file", image);
      try {
        const { data } = await axios.post(
          `${riderService}/api/rider/new`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        toast.success(data.message);
        fetchProfile();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to submit");
      } finally {
        setSubmitting(false);
      }
    });
  };

  if (user?.role !== "rider") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d0d0d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#555", fontSize: 16 }}>
          You are not registered as a rider
        </p>
      </div>
    );
  }

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
        <p style={{ color: "#444", fontSize: 13 }}>Loading rider profile...</p>
      </div>
    );
  }

  // Registration form
  if (!profile) {
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
            maxWidth: 440,
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: "40px 36px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏍️</div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#f0f0f0",
                letterSpacing: "-0.5px",
                marginBottom: 6,
              }}
            >
              Complete Your Profile
            </h1>
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
              Fill in your details to start receiving delivery orders
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                Aadhar Number
              </label>
              <input
                type="number"
                placeholder="Enter 12-digit Aadhar number"
                value={aadharNumber}
                onChange={(e) => setaadharNumber(e.target.value)}
                className="input-dark"
                style={{ height: 48 }}
              />
            </div>

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
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="input-dark"
                style={{ height: 48 }}
              />
            </div>

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
                Driving License
              </label>
              <input
                type="text"
                placeholder="Enter license number"
                value={drivingLicenseNumber}
                onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                className="input-dark"
                style={{ height: 48 }}
              />
            </div>

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
                Profile Photo
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px dashed rgba(255,255,255,0.12)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLLabelElement).style.borderColor =
                    "rgba(255,77,28,0.4)";
                  (e.currentTarget as HTMLLabelElement).style.background =
                    "rgba(255,77,28,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLLabelElement).style.borderColor =
                    "rgba(255,255,255,0.12)";
                  (e.currentTarget as HTMLLabelElement).style.background =
                    "rgba(255,255,255,0.03)";
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: "rgba(255,77,28,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <BiUpload size={16} color="#FF4D1C" />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: image ? "#f0f0f0" : "#555",
                    }}
                  >
                    {image ? image.name : "Upload your photo"}
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

            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="btn-accent"
              style={{
                width: "100%",
                padding: "15px",
                fontSize: 14,
                marginTop: 8,
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
                  Submitting...
                </>
              ) : (
                "Submit Profile →"
              )}
            </button>

            {/* Logout on registration page too */}
            <button
              onClick={logoutHandler}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                background: "transparent",
                border: "1px solid rgba(239,68,68,0.15)",
                color: "#f87171",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(239,68,68,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>
      {/* Top bar — with logout */}
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
            Rider Dashboard
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
        style={{ maxWidth: 520, margin: "0 auto", padding: "24px 20px 60px" }}
      >
        {/* Profile card */}
        <div
          className="fade-up"
          style={{
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 22,
            padding: 24,
            marginBottom: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: profile.isAvailble
                ? "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
              pointerEvents: "none",
              transition: "background 0.5s",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={profile.picture}
                alt={user?.name}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${profile.isAvailble ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.1)"}`,
                  transition: "border 0.3s",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: profile.isAvailble ? "#22c55e" : "#444",
                  border: "2px solid #161616",
                  transition: "background 0.3s",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#f0f0f0",
                  marginBottom: 3,
                }}
              >
                {user?.name}
              </h2>
              <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
                📞 {profile.phoneNumber}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 99,
                    background: profile.isVerified
                      ? "rgba(34,197,94,0.1)"
                      : "rgba(245,158,11,0.1)",
                    color: profile.isVerified ? "#4ade80" : "#f59e0b",
                    border: `1px solid ${profile.isVerified ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                  }}
                >
                  {profile.isVerified
                    ? "✓ Verified"
                    : "⏳ Pending Verification"}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 99,
                    background: profile.isAvailble
                      ? "rgba(34,197,94,0.1)"
                      : "rgba(255,255,255,0.05)",
                    color: profile.isAvailble ? "#4ade80" : "#555",
                    border: `1px solid ${profile.isAvailble ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {profile.isAvailble ? "● Online" : "○ Offline"}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(59,130,246,0.07)",
              border: "1px solid rgba(59,130,246,0.15)",
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: 12, color: "#60a5fa", lineHeight: 1.6 }}>
              📍 Stay within 500m of a restaurant hotspot before going online to
              receive orders.
            </p>
          </div>

          {profile.isVerified && !currentOrder && (
            <button
              onClick={toggleAvailability}
              disabled={toggling}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                background: toggling
                  ? "rgba(255,255,255,0.05)"
                  : profile.isAvailble
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(34,197,94,0.1)",
                border: `1px solid ${toggling ? "rgba(255,255,255,0.08)" : profile.isAvailble ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}`,
                color: toggling
                  ? "#555"
                  : profile.isAvailble
                    ? "#f87171"
                    : "#4ade80",
                fontSize: 14,
                fontWeight: 700,
                cursor: toggling ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {toggling ? (
                <>
                  <div
                    className="spin"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.1)",
                      borderTopColor: "#aaa",
                    }}
                  />
                  Updating...
                </>
              ) : profile.isAvailble ? (
                "● Go Offline"
              ) : (
                "● Go Online"
              )}
            </button>
          )}

          {!profile.isVerified && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "rgba(245,158,11,0.07)",
                border: "1px solid rgba(245,158,11,0.15)",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 12, color: "#f59e0b" }}>
                Your profile is under review. You'll be able to go online once
                verified.
              </p>
            </div>
          )}
        </div>

        {/* Sound notification */}
        {!audioUnlocked && (
          <div
            style={{
              background: "#161616",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 16,
              padding: "16px 18px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(59,130,246,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <BsBellFill size={16} color="#60a5fa" />
              </div>
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#f0f0f0",
                    marginBottom: 2,
                  }}
                >
                  Enable Sound Alerts
                </p>
                <p style={{ fontSize: 11, color: "#555" }}>
                  Get notified when new orders arrive
                </p>
              </div>
            </div>
            <button
              onClick={unlockAudio}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                background: "rgba(59,130,246,0.15)",
                border: "1px solid rgba(59,130,246,0.3)",
                color: "#60a5fa",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(59,130,246,0.22)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(59,130,246,0.15)";
              }}
            >
              Enable
            </button>
          </div>
        )}

        {/* Incoming orders */}
        {profile.isAvailble && incomingOrders.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div className="pulse-dot" style={{ background: "#FF4D1C" }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>
                Incoming Orders
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#FF4D1C",
                  background: "rgba(255,77,28,0.1)",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                {incomingOrders.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {incomingOrders.map((id) => (
                <RiderOrderRequest
                  key={id}
                  orderId={id}
                  onAccepted={() => {
                    fetchProfile();
                    fetchCurrentOrder();
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Current order */}
        {currentOrder && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <RiderCurrentOrder
              order={currentOrder}
              onStatusUpdate={fetchCurrentOrder}
            />
            <RiderOrderMap order={currentOrder} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;
