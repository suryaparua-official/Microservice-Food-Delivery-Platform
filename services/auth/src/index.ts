import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import { globalLimiter, loginLimiter } from "./middlewares/rateLimiter.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "https://swiggy-surya.duckdns.org",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(globalLimiter);
app.use("/api/auth/login", loginLimiter);

// Swagger docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Auth service running on port ${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
  await connectDB();
  await connectRedis();
});
