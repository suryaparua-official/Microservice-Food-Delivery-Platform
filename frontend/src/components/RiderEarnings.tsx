import { useEffect, useState } from "react";
import axios from "axios";
import { riderService } from "../main";

interface EarningData {
  totalEarnings: number;
  totalOrders: number;
  todayEarnings: number;
  todayOrders: number;
  last7Days: { date: string; earnings: number; orders: number }[];
}

const RiderEarnings = () => {
  const [data, setData] = useState<EarningData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await axios.get(
          `${riderService}/api/rider/earnings`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        setData(res);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading)
    return (
      <div className="shimmer" style={{ height: 200, borderRadius: 20 }} />
    );
  if (!data) return null;

  const maxEarning = Math.max(...data.last7Days.map((d) => d.earnings), 1);

  return (
    <div
      style={{
        background: "#161616",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 22,
        padding: 24,
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#f0f0f0",
          marginBottom: 20,
        }}
      >
        💰 Earnings
      </h3>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: "16px",
            borderRadius: 14,
            background: "rgba(255,77,28,0.07)",
            border: "1px solid rgba(255,77,28,0.15)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#FF4D1C",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
              opacity: 0.8,
            }}
          >
            Today
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, color: "#FF4D1C" }}>
            ₹{data.todayEarnings}
          </p>
          <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
            {data.todayOrders} deliveries
          </p>
        </div>
        <div
          style={{
            padding: "16px",
            borderRadius: 14,
            background: "rgba(34,197,94,0.07)",
            border: "1px solid rgba(34,197,94,0.15)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#4ade80",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
              opacity: 0.8,
            }}
          >
            Total
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, color: "#4ade80" }}>
            ₹{data.totalEarnings}
          </p>
          <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
            {data.totalOrders} deliveries
          </p>
        </div>
      </div>

      {/* Last 7 days bar chart */}
      <div>
        <p
          style={{
            fontSize: 12,
            color: "#555",
            fontWeight: 600,
            marginBottom: 14,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Last 7 Days
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            height: 100,
          }}
        >
          {data.last7Days.map((day, i) => {
            const height =
              maxEarning > 0 ? (day.earnings / maxEarning) * 100 : 0;
            const isToday = i === 6;
            const dayName = new Date(day.date).toLocaleDateString("en-IN", {
              weekday: "short",
            });
            return (
              <div
                key={day.date}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  height: "100%",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "flex-end",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${Math.max(height, day.earnings > 0 ? 8 : 3)}%`,
                      borderRadius: "6px 6px 3px 3px",
                      background: isToday
                        ? "linear-gradient(to top, #FF4D1C, #ff8c6b)"
                        : day.earnings > 0
                          ? "rgba(255,77,28,0.3)"
                          : "rgba(255,255,255,0.06)",
                      transition: "height 0.5s ease",
                      position: "relative",
                    }}
                    title={`₹${day.earnings} · ${day.orders} orders`}
                  />
                </div>
                <span
                  style={{
                    fontSize: 9,
                    color: isToday ? "#FF4D1C" : "#444",
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {dayName}
                </span>
                {day.earnings > 0 && (
                  <span style={{ fontSize: 8, color: "#555" }}>
                    ₹{day.earnings}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RiderEarnings;
