import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { restaurantService } from "../main";
import L from "leaflet";
import { LuLocateFixed } from "react-icons/lu";
import { BiTrash } from "react-icons/bi";

// Fix leaflet marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

const LocationPicker = ({
  setLocation,
}: {
  setLocation: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      setLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const LocateMeButton = ({
  onLocate,
}: {
  onLocate: (lat: number, lng: number) => void;
}) => {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, { animate: true });
        onLocate(latitude, longitude);
        setLocating(false);
      },
      () => {
        toast.error("Location permission denied");
        setLocating(false);
      },
    );
  };

  return (
    <button
      onClick={locateUser}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "9px 14px",
        borderRadius: 10,
        background: "rgba(13,13,13,0.85)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#f0f0f0",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "Inter, sans-serif",
        transition: "all 0.2s",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      {locating ? (
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
        <LuLocateFixed size={14} color="#FF4D1C" />
      )}
      {locating ? "Locating..." : "Use my location"}
    </button>
  );
};

const AddAddressPage = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mobile, setMobile] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const fetchFormattedAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      setFormattedAddress(data.display_name || "");
    } catch {
      toast.error("Failed to fetch address");
    }
  };

  const setLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    fetchFormattedAddress(lat, lng);
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/address/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAddresses(data || []);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const addAddress = async () => {
    if (
      !mobile ||
      !formattedAddress ||
      latitude === null ||
      longitude === null
    ) {
      toast.error("Please select a location on the map");
      return;
    }
    try {
      setAdding(true);
      await axios.post(
        `${restaurantService}/api/address/new`,
        { formattedAddress, mobile, latitude, longitude },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Address saved");
      setMobile("");
      setFormattedAddress("");
      setLatitude(null);
      setLongitude(null);
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setAdding(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      setDeletingId(id);
      await axios.delete(`${restaurantService}/api/address/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 60px" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#f0f0f0",
            letterSpacing: "-0.5px",
          }}
        >
          Delivery Address
        </h1>
        <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
          Click on the map to pin your delivery location
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Left — Map + Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Map */}
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              position: "relative",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <MapContainer
              center={[latitude || 28.6139, longitude || 77.209]}
              zoom={13}
              style={{ height: 380, width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
              <LocationPicker setLocation={setLocation} />
              <LocateMeButton onLocate={setLocation} />
              {latitude && longitude && (
                <Marker position={[latitude, longitude]} />
              )}
            </MapContainer>
          </div>

          {/* Selected address preview */}
          {formattedAddress ? (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                background: "rgba(255,77,28,0.07)",
                border: "1px solid rgba(255,77,28,0.2)",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                📍
              </span>
              <p style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>
                {formattedAddress}
              </p>
            </div>
          ) : (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(255,255,255,0.08)",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 13, color: "#444" }}>
                👆 Click anywhere on the map to select your location
              </p>
            </div>
          )}

          {/* Mobile input */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 16,
              }}
            >
              📞
            </div>
            <input
              type="number"
              placeholder="Mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="input-dark"
              style={{ paddingLeft: 44, paddingRight: 14, height: 50 }}
            />
          </div>

          {/* Save button */}
          <button
            disabled={adding || !formattedAddress || !mobile}
            onClick={addAddress}
            className="btn-accent"
            style={{
              width: "100%",
              padding: "15px",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {adding ? (
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
                Saving...
              </>
            ) : (
              "＋  Save Address"
            )}
          </button>
        </div>

        {/* Right — Saved addresses */}
        <div
          style={{
            position: "sticky",
            top: 84,
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>
              Saved Addresses
            </h2>
            {addresses.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#FF4D1C",
                  background: "rgba(255,77,28,0.1)",
                  padding: "3px 9px",
                  borderRadius: 99,
                }}
              >
                {addresses.length}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="shimmer"
                  style={{ height: 72, borderRadius: 12 }}
                />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                borderRadius: 14,
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>🗺️</div>
              <p style={{ fontSize: 13, color: "#444" }}>
                No addresses saved yet
              </p>
              <p style={{ fontSize: 11, color: "#333", marginTop: 4 }}>
                Pin a location on the map
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    padding: "14px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    transition: "border 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,255,255,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,255,255,0.06)";
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: "rgba(255,77,28,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      flexShrink: 0,
                    }}
                  >
                    📍
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#ccc",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        marginBottom: 5,
                      }}
                    >
                      {addr.formattedAddress}
                    </p>
                    <p style={{ fontSize: 11, color: "#555" }}>
                      📞 {addr.mobile}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteAddress(addr.id)}
                    disabled={deletingId === addr.id}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.15)",
                      color: "#f87171",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor:
                        deletingId === addr.id ? "not-allowed" : "pointer",
                      flexShrink: 0,
                      transition: "all 0.2s",
                      opacity: deletingId === addr.id ? 0.5 : 1,
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
                    {deletingId === addr.id ? (
                      <div
                        className="spin"
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          border: "1.5px solid rgba(239,68,68,0.2)",
                          borderTopColor: "#f87171",
                        }}
                      />
                    ) : (
                      <BiTrash size={13} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddAddressPage;
