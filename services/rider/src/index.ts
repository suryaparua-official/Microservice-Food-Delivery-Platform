import express from "express";
import dotenv from "dotenv";
import http from "http";
import helmet from "helmet";
import connectDB from "./config/db.js";
import cors from "cors";
import riderRoutes from "./routes/rider.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startOrderReadyConsumer } from "./config/orderReady.consumer.js";
import { connectRedis } from "./config/redis.js";
import { createGlobalLimiter } from "./middlewares/rateLimiter.js";
import { setupAxiosRetry } from "./config/axiosRetry.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

dotenv.config();
setupAxiosRetry();

const app = express();
app.use(helmet());
app.set("trust proxy", 1);

async function startServer() {
  await connectDB();
  await connectRedis();
  await connectRabbitMQ();
  startOrderReadyConsumer();

  app.use(express.json());
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
  app.use(createGlobalLimiter());

  app.use("/api/rider", riderRoutes);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  const server = http.createServer(app);

  server.listen(process.env.PORT, () => {
    console.log(`Rider service is running on port ${process.env.PORT}`);
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
