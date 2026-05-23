import rateLimit from "express-rate-limit";

// Global — সব routes-এ
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login — brute force protect
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { message: "Too many login attempts. Please wait 1 minute." },
  standardHeaders: true,
  legacyHeaders: false,
});
