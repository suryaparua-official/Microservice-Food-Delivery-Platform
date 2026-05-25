import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../config/redis.js";

const makeStore = () =>
  new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  });

export const createGlobalLimiter = () =>
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore(),
  });
