import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import {
  createGlobalLimiter,
  createLoginLimiter,
} from "./middlewares/rateLimiter.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

dotenv.config();

const app = express();
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }),
);
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await connectRedis();

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
  app.use(createGlobalLimiter());
  app.use("/api/auth/login", createLoginLimiter());

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/api/auth", authRoutes);

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
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
