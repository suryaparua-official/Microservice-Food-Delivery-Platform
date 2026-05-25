import redisClient from "./redis.js";
import MenuItem from "../models/MenuItems.js";
import Restaurant from "../models/Restaurant.js";

const CART_TTL = 7 * 24 * 60 * 60;
const CART_KEY = (userId: string) => `cart:${userId}`;

export const redisAddToCart = async (
  userId: string,
  itemId: string,
  restaurantId: string,
): Promise<void> => {
  const key = CART_KEY(userId);
  const field = `${itemId}:${restaurantId}`;
  await redisClient.hIncrBy(key, field, 1);
  await redisClient.expire(key, CART_TTL);
};

export const redisGetCartRestaurant = async (
  userId: string,
): Promise<string | null> => {
  const key = CART_KEY(userId);
  const fields = await redisClient.hKeys(key);
  if (fields.length === 0) return null;
  const first = fields[0];
  if (!first) return null;
  const parts = first.split(":");
  const restaurantId = parts[1];
  return restaurantId || null;
};

export const redisIncrementItem = async (
  userId: string,
  itemId: string,
): Promise<boolean> => {
  const key = CART_KEY(userId);
  const fields = await redisClient.hGetAll(key);
  for (const field of Object.keys(fields)) {
    if (field.startsWith(`${itemId}:`)) {
      await redisClient.hIncrBy(key, field, 1);
      await redisClient.expire(key, CART_TTL);
      return true;
    }
  }
  return false;
};

export const redisDecrementItem = async (
  userId: string,
  itemId: string,
): Promise<"removed" | "decremented" | "not_found"> => {
  const key = CART_KEY(userId);
  const fields = await redisClient.hGetAll(key);
  for (const field of Object.keys(fields)) {
    if (field.startsWith(`${itemId}:`)) {
      const val = fields[field];
      const qty = val ? parseInt(val) : 1;
      if (qty <= 1) {
        await redisClient.hDel(key, field);
        return "removed";
      }
      await redisClient.hSet(key, field, String(qty - 1));
      await redisClient.expire(key, CART_TTL);
      return "decremented";
    }
  }
  return "not_found";
};

export const redisClearCart = async (userId: string): Promise<void> => {
  await redisClient.del(CART_KEY(userId));
};

export const redisGetCart = async (userId: string) => {
  const key = CART_KEY(userId);
  const fields = await redisClient.hGetAll(key);

  if (Object.keys(fields).length === 0) {
    return { cart: [], subtotal: 0, cartLength: 0 };
  }

  // Collect all itemIds and the single restaurantId in one pass (no DB calls)
  const itemIds: string[] = [];
  let cartRestaurantId: string | null = null;
  const entries: { field: string; itemId: string; restaurantId: string; quantity: number }[] = [];

  for (const [field, qtyStr] of Object.entries(fields)) {
    const parts = field.split(":");
    const itemId = parts[0];
    const restaurantId = parts[1];
    if (!itemId || !restaurantId) continue;
    const quantity = qtyStr ? parseInt(qtyStr) : 1;
    itemIds.push(itemId);
    cartRestaurantId = restaurantId;
    entries.push({ field, itemId, restaurantId, quantity });
  }

  if (entries.length === 0) return { cart: [], subtotal: 0, cartLength: 0 };

  // Single batch query for all menu items + single restaurant fetch
  const [items, restaurant] = await Promise.all([
    MenuItem.find({ _id: { $in: itemIds } }).lean(),
    cartRestaurantId ? Restaurant.findById(cartRestaurantId).lean() : null,
  ]);

  if (!restaurant) return { cart: [], subtotal: 0, cartLength: 0 };

  const itemMap = new Map(items.map((item) => [(item as any)._id.toString(), item]));

  let subtotal = 0;
  let cartLength = 0;
  const cart = [];

  for (const { field, itemId, quantity } of entries) {
    const item = itemMap.get(itemId);
    if (!item) continue;
    subtotal += (item as any).price * quantity;
    cartLength += quantity;
    cart.push({
      _id: field,
      itemId: item,
      restaurantId: restaurant,
      quauntity: quantity,
    });
  }

  return { cart, subtotal, cartLength };
};
