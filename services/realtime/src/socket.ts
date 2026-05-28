import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

let io: Server;

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
];

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: ALLOWED_ORIGINS,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SEC!) as any;

      if (!decoded || !decoded.sub) {
        return next(new Error("Unauthorized"));
      }

      socket.data.user = {
        _id: decoded.sub,
        role: decoded.role ?? "",
        restaurantId: decoded.restaurantId ?? null,
      };

      next();
    } catch (error) {
      console.log("❌ Socket auth failed: ", error);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    if (!user) {
      socket.disconnect();
      return;
    }

    const userId = user._id;

    socket.join(`user:${userId}`);

    if (user.restaurantId) {
      socket.join(`restaurant:${user.restaurantId}`);
    }

    console.log(`User connected: ${userId}`);
    console.log("Socket room: ", [...socket.rooms]);

    socket.on("disconnect", () => {
      console.log(`User disconnected:${userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};
