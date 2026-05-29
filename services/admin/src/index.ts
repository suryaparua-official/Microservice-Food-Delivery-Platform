import express from "express";
import dotenv from "dotenv";
import http from "http";
import helmet from "helmet";
import adminRoutes from "./routes/admin.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: [
      "https://zestify-surya.duckdns.org",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/v1", adminRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

async function startServer() {
  const server = http.createServer(app);

  server.listen(process.env.PORT, () => {
    console.log(`Admin Service is running on port ${process.env.PORT}`);
  });

  const shutdown = async () => {
    console.log("Shutting down gracefully...");
    server.close(async () => {
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 25000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
