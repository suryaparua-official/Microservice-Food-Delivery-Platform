import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import http from "http";
import helmet from "helmet";
import restaurantRoutes from "./routes/restaraunt.js";
import itemRoutes from "./routes/menuitem.js";
import cartRoutes from "./routes/cart.js";
import addressRoutes from "./routes/address.js";
import orderRoutes from "./routes/order.js";
import cors from "cors";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startPaymentConsumer } from "./config/payment.consumer.js";
import { connectRedis } from "./config/redis.js";
import { createGlobalLimiter } from "./middlewares/rateLimiter.js";
import { setupAxiosRetry } from "./config/axiosRetry.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { prisma } from "./config/prisma.js";
import { connectKafkaProducer } from "./config/kafka.js";

dotenv.config();
setupAxiosRetry();

const app = express();
app.use(helmet());
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5001;

async function startServer() {
  await connectDB();
  await connectRedis();
  await prisma.$connect();
  console.log("Prisma connected to PostgreSQL");

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
  app.use(createGlobalLimiter());

  app.use("/api/restaurant", restaurantRoutes);
  app.use("/api/item", itemRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/address", addressRoutes);
  app.use("/api/order", orderRoutes);

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  await connectRabbitMQ();
  startPaymentConsumer();

  try {
    await connectKafkaProducer();
  } catch (err) {
    console.warn("Kafka producer connection failed, audit logging disabled:", err);
  }

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Restaurant service is running on port ${PORT}`);
  });

  const shutdown = async () => {
    console.log("Shutting down gracefully...");
    server.close(async () => {
      await prisma.$disconnect();
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
