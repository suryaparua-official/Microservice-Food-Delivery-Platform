import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { initSocket } from "./socket.js";
import internalRoute from "./routes/internal.js";

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

app.use("/api/v1/internal", internalRoute);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

async function startServer() {
  const server = http.createServer(app);
  initSocket(server);

  server.listen(process.env.PORT, () => {
    console.log(`Realtime service is running port ${process.env.PORT}`);
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
