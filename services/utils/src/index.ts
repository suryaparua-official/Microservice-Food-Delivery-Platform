import express from "express";
import dotenv from "dotenv";
import http from "http";
import cloudinary from "cloudinary";
import cors from "cors";
import uploadRoutes from "./routes/cloudinary.js";
import paymentRoutes from "./routes/payment.js";
import auditRoutes from "./routes/audit.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { connectRedis } from "./config/redis.js";
import { startEmailConsumer } from "./config/email.consumer.js";
import { startKafkaConsumer } from "./config/kafka.consumer.js";

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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_SECRET_KEY } = process.env;

if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_SECRET_KEY) {
  throw new Error("Missing Cloudinary environment variables");
}

cloudinary.v2.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_SECRET_KEY,
});

app.use("/api", uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/audit", auditRoutes);

const PORT = process.env.PORT || 5002;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

async function startServer() {
  await connectRabbitMQ();
  await connectRedis();
  await startEmailConsumer();

  try {
    await startKafkaConsumer();
  } catch (err) {
    console.error("Kafka consumer connection failed (non-fatal):", err);
  }

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Utils service is running on port ${PORT}`);
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

startServer();
