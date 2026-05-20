import { useNavigate } from "react-router-dom";

type Props = {
  id: string;
  image: string;
  name: string;
  distance: string;
  isOpen: boolean;
};

const RestaurantCard = ({ id, image, name, distance, isOpen }: Props) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/restaurant/${id}`)}
      style={{
        borderRadius: 18,
        overflow: "hidden",
        background: "#161616",
        border: "1px solid rgba(255,255,255,0.06)",
        cursor: "pointer",
        transition: "all 0.25s ease",
        opacity: isOpen ? 1 : 0.6,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-4px)";
        el.style.border = "1px solid rgba(255,255,255,0.12)";
        el.style.boxShadow = "0 16px 40px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.border = "1px solid rgba(255,255,255,0.06)";
        el.style.boxShadow = "none";
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
        <img
          src={image}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: isOpen ? "none" : "grayscale(80%) brightness(0.6)",
            transition: "transform 0.4s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLImageElement).style.transform =
              "scale(1.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
          }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)",
          }}
        />

        {/* Closed badge */}
        {!isOpen && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0,0,0,0.75)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              padding: "6px 16px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 600,
              color: "#aaa",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Closed
          </div>
        )}

        {/* Open dot */}
        {isOpen && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)",
              padding: "4px 10px",
              borderRadius: 99,
            }}
          >
            <div className="pulse-dot" />
            <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>
              Open
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px 16px" }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#f0f0f0",
            marginBottom: 6,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </h3>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, color: "#555" }}>
            {distance} km away
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#FF4D1C",
              fontWeight: 600,
              background: "rgba(255,77,28,0.1)",
              padding: "3px 9px",
              borderRadius: 99,
            }}
          >
            View Menu →
          </span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
