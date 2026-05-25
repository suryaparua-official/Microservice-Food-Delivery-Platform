import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import restaurantRoutes from "./routes/restaraunt.js";
import itemRoutes from "./routes/menuitem.js";
import cartRoutes from "./routes/cart.js";
import addressRoutes from "./routes/address.js";
import orderRoutes from "./routes/order.js";
import cors from "cors";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startPaymentConsumer } from "./config/payment.consumer.js";
import { connectRedis } from "./config/redis.js";
import { setupAxiosRetry } from "./config/axiosRetry.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { prisma } from "./config/prisma.js";
import { connectKafkaProducer } from "./config/kafka.js";

dotenv.config();
setupAxiosRetry();

await connectRabbitMQ();
startPaymentConsumer();

try {
  await connectKafkaProducer();
} catch (err) {
  console.error("Kafka producer connection failed (non-fatal):", err);
}

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

const PORT = process.env.PORT || 5001;

app.use("/api/restaurant", restaurantRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, async () => {
  console.log(`Restaurant service is running on port ${PORT}`);
  connectDB();
  connectRedis();
  await prisma.$connect();
  console.log("Prisma connected to PostgreSQL");
});
