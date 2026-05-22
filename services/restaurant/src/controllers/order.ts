import axios from "axios";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Address from "../models/Address.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import { publishEvent } from "../config/order.publisher.js";
import { COD_MIN_AMOUNT, COD_MAX_AMOUNT } from "../models/Order.js";
import { redisClearCart, redisGetCart } from "../config/cartRedis.js";
import redisClient from "../config/redis.js";
import {
  publishOtpEmail,
  publishOrderPlacedEmail,
} from "../config/email.publisher.js";

export const createOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const { paymentMethod, addressId } = req.body;

  if (!addressId)
    return res.status(400).json({ message: "Address is required" });

  if (!["razorpay", "stripe", "cod"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  const address = await Address.findOne({ _id: addressId, userId: user._id });
  if (!address) return res.status(404).json({ message: "Address Not found" });

  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
  };

  const { cart: cartItems } = await redisGetCart(user._id.toString());

  if (cartItems.length === 0)
    return res.status(400).json({ message: "Cart is empty" });

  const firstCartItem = cartItems[0];
  if (!firstCartItem || !firstCartItem.restaurantId) {
    return res.status(400).json({ message: "Invalid Cart Data" });
  }

  const restaurantId = (firstCartItem.restaurantId as any)._id.toString();
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant)
    return res.status(404).json({ message: "No restaurant with this id" });
  if (!restaurant.isOpen)
    return res
      .status(400)
      .json({ message: "Sorry this restaurant is closed for now" });

  const distance = getDistanceKm(
    address.location.coordinates[1],
    address.location.coordinates[0],
    restaurant.autoLocation.coordinates[1],
    restaurant.autoLocation.coordinates[0],
  );

  let subtotal = 0;
  const orderItems = cartItems.map((cart) => {
    const item = cart.itemId as any;
    if (!item) throw new Error("Invalid cart item");
    subtotal += item.price * cart.quauntity;
    return {
      itemId: item._id.toString(),
      name: item.name,
      price: item.price,
      quauntity: cart.quauntity,
    };
  });

  const deliveryFee = subtotal < 250 ? 49 : 0;
  const platfromFee = 7;
  const totalAmount = subtotal + deliveryFee + platfromFee;

  if (paymentMethod === "cod") {
    if (totalAmount < COD_MIN_AMOUNT) {
      return res.status(400).json({
        message: `Minimum order amount for COD is ₹${COD_MIN_AMOUNT}. Your total is ₹${totalAmount}.`,
        codError: "below_minimum",
        minAmount: COD_MIN_AMOUNT,
      });
    }
    if (totalAmount > COD_MAX_AMOUNT) {
      return res.status(400).json({
        message: `Maximum order amount for COD is ₹${COD_MAX_AMOUNT}. Your total is ₹${totalAmount}. Please use online payment.`,
        codError: "above_maximum",
        maxAmount: COD_MAX_AMOUNT,
      });
    }
  }

  const [longitude, latitude] = address.location.coordinates;
  const riderAmount = Math.ceil(distance) * 17;

  const orderData: any = {
    userId: user._id.toString(),
    restaurantId: restaurantId.toString(),
    restaurantName: restaurant.name,
    riderId: null,
    distance,
    riderAmount,
    items: orderItems,
    subtotal,
    deliveryFee,
    platfromFee,
    totalAmount,
    addressId: (address._id as any).toString(),
    deliveryAddress: {
      fromattedAddress: address.formattedAddress,
      mobile: address.mobile,
      latitude,
      longitude,
    },
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ? "cod_pending" : "pending",
    status: "placed",
  };

  if (paymentMethod !== "cod") {
    orderData.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  }

  const order = await Order.create(orderData);

  // COD — cart clear + email
  if (paymentMethod === "cod") {
    await redisClearCart(user._id.toString());

    // COD order placed email
    try {
      const { data: userData } = await axios.get(
        `${process.env.AUTH_SERVICE_URL}/api/auth/user/${user._id.toString()}`,
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
      );
      if (userData?.email) {
        await publishOrderPlacedEmail({
          to: userData.email,
          customerName: userData.name || "Customer",
          restaurantName: restaurant.name,
          items: orderItems,
          totalAmount,
          orderId: order._id.toString(),
        });
      }
    } catch (err) {
      console.error("❌ Failed to publish COD order email:", err);
    }
  }

  res.json({
    message: "Order created successfully",
    orderId: order._id.toString(),
    amount: totalAmount,
    paymentMethod,
    isCod: paymentMethod === "cod",
  });
});

export const fetchOrderForPayment = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.paymentStatus !== "pending") {
    return res.status(400).json({ message: "Order already paid" });
  }
  res.json({ orderId: order._id, amount: order.totalAmount, currency: "INR" });
});

export const fetchRestaurantOrders = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    const { restaurantId } = req.params;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!restaurantId)
      return res.status(400).json({ message: "Restaurant id is required" });
    const limit = req.query.limit ? Number(req.query.limit) : 0;
    const orders = await Order.find({
      restaurantId,
      paymentStatus: { $in: ["paid", "cod_pending"] },
    })
      .sort({ createdAt: -1 })
      .limit(limit);
    return res.json({ success: true, count: orders.length, orders });
  },
);

const ALLOWED_STATUSES = ["accepted", "preparing", "ready_for_rider"] as const;

export const updateOrderStatus = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    const { orderId } = req.params;
    const { status } = req.body;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (
      order.paymentStatus !== "paid" &&
      order.paymentStatus !== "cod_pending"
    ) {
      return res.status(400).json({ message: "Order payment not completed" });
    }
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    if (restaurant.ownerId !== user._id.toString()) {
      return res
        .status(401)
        .json({ message: "You are not allowed to update this order" });
    }
    order.status = status;
    await order.save();
    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:update",
        room: `user:${order.userId}`,
        payload: { orderId: order._id, status: order.status },
      },
      { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
    );
    if (status === "ready_for_rider") {
      await publishEvent("ORDER_READY_FOR_RIDER", {
        orderId: order._id.toString(),
        restaurantId: restaurant._id.toString(),
        location: restaurant.autoLocation,
      });
    }
    res.json({ message: "order status updated successfully", order });
  },
);

export const getMyOrders = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const orders = await Order.find({
    userId: req.user._id.toString(),
    paymentStatus: { $in: ["paid", "cod_pending"] },
  }).sort({ createdAt: -1 });
  res.json({ orders });
});

export const fetchSingleOrder = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.userId !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "You are not allowed to view this order" });
    }
    res.json(order);
  },
);

export const assignRiderToOrder = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const { orderId, riderId, riderName, riderPhone } = req.body;
  const orderAvailable = await Order.findOne({
    riderId,
    status: { $ne: "delivered" },
  });
  if (orderAvailable)
    return res.status(400).json({ message: "You already have an order" });
  const order = await Order.findById(orderId);
  if (order?.riderId !== null)
    return res.status(400).json({ message: "Order Already taken" });
  const orderUpdated = await Order.findOneAndUpdate(
    { _id: orderId, riderId: null },
    { riderId, riderName, riderPhone, status: "rider_assigned" },
    { new: true },
  );
  await axios.post(
    `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `user:${order.userId}`,
      payload: order,
    },
    { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
  );
  await axios.post(
    `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `restaurant:${order.restaurantId}`,
      payload: order,
    },
    { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
  );
  res.json({
    message: "Rider Assigned Successfully",
    success: true,
    order: orderUpdated,
  });
});

export const getCurrentOrderForRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const riderId = req.query.riderId as string;
  if (!riderId)
    return res.status(400).json({ message: "Rider id is required" });
  const order = await Order.findOne({
    riderId,
    status: { $ne: "delivered" },
  }).populate("restaurantId");
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

export const updateOrderStatusRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.status === "rider_assigned") {
    order.status = "picked_up";
    await order.save();

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.set(`otp:${order._id.toString()}`, otp, { EX: 600 });
    console.log(`🔐 OTP for order ${order._id}: ${otp}`);

    // Send OTP via Socket to customer
    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      { event: "order:otp", room: `user:${order.userId}`, payload: { otp } },
      { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
    );

    // Send OTP via Email
    try {
      const { data: userData } = await axios.get(
        `${process.env.AUTH_SERVICE_URL}/api/auth/user/${order.userId}`,
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
      );
      if (userData?.email) {
        await publishOtpEmail({
          to: userData.email,
          customerName: userData.name || "Customer",
          otp,
          restaurantName: order.restaurantName,
        });
      }
    } catch (err) {
      console.error("❌ Failed to publish OTP email:", err);
    }

    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: order,
      },
      { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
    );
    await axios.post(
      `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order,
      },
      { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
    );

    return res.json({ message: "Order updated Successfully" });
  }
});

export const verifyDeliveryOtp = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const { orderId, otp } = req.body;
  if (!orderId || !otp) {
    return res.status(400).json({ message: "Order ID and OTP are required" });
  }

  const storedOtp = await redisClient.get(`otp:${orderId}`);
  if (!storedOtp) {
    return res
      .status(400)
      .json({ message: "OTP expired or not found. Please try again." });
  }
  if (storedOtp !== otp.toString()) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = "delivered";
  if (order.paymentMethod === "cod") {
    order.paymentStatus = "paid";
  }
  await order.save();

  await redisClient.del(`otp:${orderId}`);

  await axios.post(
    `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `restaurant:${order.restaurantId}`,
      payload: order,
    },
    { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
  );
  await axios.post(
    `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `user:${order.userId}`,
      payload: order,
    },
    { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
  );

  return res.json({ message: "Order delivered successfully! 🎉" });
});
