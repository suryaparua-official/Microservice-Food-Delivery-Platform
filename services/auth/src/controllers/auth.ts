import User from "../model/User.js";
import jwt from "jsonwebtoken";
import TryCatch from "../middlewares/trycatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { oauth2client } from "../config/googleConfig.js";

const signToken = (user: { _id: unknown; role: string; restaurantId?: string | null; tokenVersion: number }) =>
  jwt.sign(
    {
      sub: user._id!.toString(),
      role: user.role,
      restaurantId: user.restaurantId || null,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_SEC as string,
    { expiresIn: "15d" }
  );

export const loginUser = TryCatch(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: "Authorization code is required" });
  }

  const googleRes = await oauth2client.getToken(code);
  oauth2client.setCredentials(googleRes.tokens);

  const ticket = await oauth2client.verifyIdToken({
    idToken: googleRes.tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload) {
    return res.status(400).json({ message: "Failed to verify Google token" });
  }
  const { email, name, picture } = payload;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ name, email, image: picture });
  }

  const token = signToken(user);

  res.status(200).json({ message: "Logged Success", token, user });
});

const allowedRoles = ["customer", "rider", "seller"] as const;
type Role = (typeof allowedRoles)[number];

export const addUserRole = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { role } = req.body as { role: Role };

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { role },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const token = signToken(user);

  res.json({ user, token });
});

export const logoutUser = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
  res.json({ message: "Logged out successfully" });
});

export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  res.json(user);
});

export const getUserById = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const user = await User.findById(req.params.userId).select("name email");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ name: user.name, email: user.email });
});
