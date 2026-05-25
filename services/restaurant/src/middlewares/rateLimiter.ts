import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../config/redis.js";

const makeStore = () =>
  new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  });

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { message: "Too many OTP attempts. Please wait 1 minute." },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
});

export const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many order requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(),
});
