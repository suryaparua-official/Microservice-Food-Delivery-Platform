import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import MenuItem from "../models/MenuItems.js";
import Restaurant from "../models/Restaurant.js";
import {
  redisAddToCart,
  redisClearCart,
  redisDecrementItem,
  redisGetCart,
  redisGetCartRestaurant,
  redisIncrementItem,
} from "../config/cartRedis.js";

export const addToCart = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Please Login" });
  }

  const userId = req.user._id.toString();
  const { restaurantId, itemId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(restaurantId) ||
    !mongoose.Types.ObjectId.isValid(itemId)
  ) {
    return res.status(400).json({ message: "Invalid restaurant and item id" });
  }

  // Item exists and available check
  const item = await MenuItem.findById(itemId);
  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }
  if (!item.isAvailable) {
    return res.status(400).json({ message: "Item is not available" });
  }

  // Restaurant exists and open check
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }
  if (!restaurant.isOpen) {
    return res.status(400).json({ message: "Restaurant is currently closed" });
  }

  // Different restaurant check
  const existingRestaurantId = await redisGetCartRestaurant(userId);
  if (existingRestaurantId && existingRestaurantId !== restaurantId) {
    return res.status(400).json({
      message:
        "You can order from only one restaurant at a time. Please clear your cart first to add items from this restaurant.",
    });
  }

  await redisAddToCart(userId, itemId, restaurantId);

  return res.json({ message: "Item added to cart" });
});

export const fetchMyCart = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Please Login" });
  }

  const userId = req.user._id.toString();
  const { cart, subtotal, cartLength } = await redisGetCart(userId);

  return res.json({ success: true, cartLength, subtotal, cart });
});

export const incrementCartItem = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id.toString();
    const { itemId } = req.body;

    if (!userId || !itemId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const result = await redisIncrementItem(userId, itemId);

    if (!result) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    res.json({ message: "Quantity increased" });
  },
);

export const decrementCartItem = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id.toString();
    const { itemId } = req.body;

    if (!userId || !itemId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const result = await redisDecrementItem(userId, itemId);

    if (result === "not_found") {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    res.json({
      message:
        result === "removed" ? "Item removed from cart" : "Quantity decreased",
    });
  },
);

export const clearCart = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id.toString();
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await redisClearCart(userId);

  res.json({ message: "Cart cleared successfully" });
});
