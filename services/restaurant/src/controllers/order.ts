import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import { prisma } from "../config/prisma.js";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import Restaurant from "../models/Restaurant.js";
import { publishEvent } from "../config/order.publisher.js";
import { COD_MIN_AMOUNT, COD_MAX_AMOUNT } from "../models/Order.js";
import { redisClearCart, redisGetCart } from "../config/cartRedis.js";
import redisClient from "../config/redis.js";
import {
  publishOtpEmail,
  publishOrderPlacedEmail,
} from "../config/email.publisher.js";
import { publishOrderEvent } from "../config/kafka.js";
import {
  realtimeBreaker,
  authBreaker,
} from "../config/circuitBreaker.js";

const REALTIME_EMIT_URL = () =>
  `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`;

const emitToRealtime = async (
  event: string,
  room: string,
  payload: unknown
): Promise<void> => {
  try {
    await realtimeBreaker.fire(REALTIME_EMIT_URL(), {
      event,
      room,
      payload,
    } as Record<string, unknown>);
  } catch (err) {
    console.warn("[CB] Realtime emit failed (non-fatal):", err);
  }
};

const fetchUserData = async (userId: string) => {
  try {
    const result = await authBreaker.fire(
      `${process.env.AUTH_SERVICE_URL}/api/auth/user/${userId}`,
      { "x-internal-key": process.env.INTERNAL_SERVICE_KEY! }
    );
    return (result as any)?.data ?? null;
  } catch (err) {
    console.warn("[CB] Auth service unavailable (non-fatal):", err);
    return null;
  }
};

export const createOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const { paymentMethod, addressId } = req.body;

  if (!addressId)
    return res.status(400).json({ message: "Address is required" });

  if (!["razorpay", "stripe", "cod"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: user._id.toString() },
  });
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
    address.latitude,
    address.longitude,
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
  const platformFee = 7;
  const totalAmount = subtotal + deliveryFee + platformFee;

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

  const riderAmount = Math.ceil(distance) * 17;

  const order = await prisma.order.create({
    data: {
      userId: user._id.toString(),
      restaurantId,
      restaurantName: restaurant.name,
      riderId: null,
      distance,
      riderAmount,
      items: orderItems,
      subtotal,
      deliveryFee,
      platformFee,
      totalAmount,
      addressId: address.id,
      deliveryAddress: {
        formattedAddress: address.formattedAddress,
        mobile: address.mobile,
        latitude: address.latitude,
        longitude: address.longitude,
      },
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: paymentMethod === "cod" ? PaymentStatus.cod_pending : PaymentStatus.pending,
      status: OrderStatus.placed,
      expiresAt: paymentMethod !== "cod" ? new Date(Date.now() + 15 * 60 * 1000) : null,
    },
  });

  try {
    await publishOrderEvent("ORDER_PLACED", {
      orderId: order.id,
      userId: order.userId,
      restaurantId: order.restaurantId,
      paymentMethod,
      totalAmount,
    });
  } catch (err) {
    console.error("Kafka ORDER_PLACED publish failed (non-fatal):", err);
  }

  if (paymentMethod === "cod") {
    await redisClearCart(user._id.toString());

    try {
      const userData = await fetchUserData(user._id.toString());
      if (userData?.email) {
        await publishOrderPlacedEmail({
          to: userData.email,
          customerName: userData.name || "Customer",
          restaurantName: restaurant.name,
          items: orderItems,
          totalAmount,
          orderId: order.id,
        });
      }
    } catch (err) {
      console.error("Failed to publish COD order email:", err);
    }
  }

  res.json({
    message: "Order created successfully",
    orderId: order.id,
    amount: totalAmount,
    paymentMethod,
    isCod: paymentMethod === "cod",
  });
});

export const fetchOrderForPayment = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.paymentStatus !== PaymentStatus.pending) {
    return res.status(400).json({ message: "Order already paid" });
  }
  res.json({ orderId: order.id, amount: order.totalAmount, currency: "INR" });
});

export const fetchRestaurantOrders = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    const restaurantId = req.params.restaurantId as string;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!restaurantId)
      return res.status(400).json({ message: "Restaurant id is required" });

    if (user.restaurantId !== restaurantId) {
      return res.status(403).json({
        message: "You are not authorized to view these orders",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where = {
      restaurantId,
      paymentStatus: { in: [PaymentStatus.paid, PaymentStatus.cod_pending] },
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return res.json({
      success: true,
      count: orders.length,
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  },
);

const ALLOWED_STATUSES: string[] = ["accepted", "preparing", "ready_for_rider"];

export const updateOrderStatus = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    const orderId = req.params.orderId as string;
    const { status } = req.body;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (
      order.paymentStatus !== PaymentStatus.paid &&
      order.paymentStatus !== PaymentStatus.cod_pending
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
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
    });

    await emitToRealtime("order:update", `user:${updatedOrder.userId}`, {
      orderId: updatedOrder.id,
      status: updatedOrder.status,
    });

    if (status === "ready_for_rider") {
      await publishEvent("ORDER_READY_FOR_RIDER", {
        orderId: updatedOrder.id,
        restaurantId: restaurant._id.toString(),
        location: restaurant.autoLocation,
      });
    }

    const kafkaEventMap: Record<string, string> = {
      accepted: "ORDER_ACCEPTED",
      preparing: "ORDER_PREPARING",
      ready_for_rider: "ORDER_READY",
    };
    const kafkaEvent = kafkaEventMap[status];
    if (kafkaEvent) {
      try {
        await publishOrderEvent(kafkaEvent, {
          orderId: updatedOrder.id,
          userId: updatedOrder.userId,
          restaurantId: updatedOrder.restaurantId,
          status,
        });
      } catch (err) {
        console.error(`Kafka ${kafkaEvent} publish failed (non-fatal):`, err);
      }
    }

    res.json({ message: "order status updated successfully", order: updatedOrder });
  },
);

export const getMyOrders = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const where = {
    userId: req.user._id.toString(),
    paymentStatus: { in: [PaymentStatus.paid, PaymentStatus.cod_pending] },
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
});

export const fetchSingleOrder = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });
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
  const { orderId, riderId, riderName, riderPhone } = req.body as {
    orderId: string;
    riderId: string;
    riderName: string;
    riderPhone: string | number;
  };

  const orderAvailable = await prisma.order.findFirst({
    where: { riderId, status: { not: OrderStatus.delivered } },
  });
  if (orderAvailable)
    return res.status(400).json({ message: "You already have an order" });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.riderId !== null)
    return res.status(400).json({ message: "Order Already taken" });

  const result = await prisma.order.updateMany({
    where: { id: orderId, riderId: null },
    data: {
      riderId,
      riderName,
      riderPhone: riderPhone?.toString(),
      status: OrderStatus.rider_assigned,
    },
  });
  if (result.count === 0)
    return res.status(400).json({ message: "Order Already taken" });

  const orderUpdated = await prisma.order.findUnique({ where: { id: orderId } });

  await emitToRealtime("order:rider_assigned", `user:${order.userId}`, orderUpdated);
  await emitToRealtime("order:rider_assigned", `restaurant:${order.restaurantId}`, orderUpdated);

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
  const order = await prisma.order.findFirst({
    where: { riderId, status: { not: OrderStatus.delivered } },
  });
  if (!order) return res.status(404).json({ message: "Order not found" });
  const restaurant = await Restaurant.findById(order.restaurantId).lean();
  res.json({ ...order, restaurantId: restaurant });
});

export const updateOrderStatusRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const { orderId } = req.body;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.status === OrderStatus.rider_assigned) {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.picked_up },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.set(`otp:${orderId}`, otp, { EX: 600 });

    await emitToRealtime("order:otp", `user:${order.userId}`, { otp });

    try {
      const userData = await fetchUserData(order.userId);
      if (userData?.email) {
        await publishOtpEmail({
          to: userData.email,
          customerName: userData.name || "Customer",
          otp,
          restaurantName: order.restaurantName,
        });
      }
    } catch (err) {
      console.error("Failed to publish OTP email:", err);
    }

    await emitToRealtime("order:rider_assigned", `restaurant:${order.restaurantId}`, updatedOrder);
    await emitToRealtime("order:rider_assigned", `user:${order.userId}`, updatedOrder);

    try {
      await publishOrderEvent("ORDER_PICKED_UP", {
        orderId: updatedOrder.id,
        userId: updatedOrder.userId,
        restaurantId: updatedOrder.restaurantId,
        riderId: updatedOrder.riderId ?? "",
      });
    } catch (err) {
      console.error("Kafka ORDER_PICKED_UP publish failed (non-fatal):", err);
    }

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

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ message: "Order not found" });

  const newPaymentStatus =
    order.paymentMethod === PaymentMethod.cod
      ? PaymentStatus.paid
      : order.paymentStatus;

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.delivered, paymentStatus: newPaymentStatus },
  });

  await redisClient.del(`otp:${orderId}`);

  await emitToRealtime("order:rider_assigned", `restaurant:${updatedOrder.restaurantId}`, updatedOrder);
  await emitToRealtime("order:rider_assigned", `user:${updatedOrder.userId}`, updatedOrder);

  try {
    await publishOrderEvent("ORDER_DELIVERED", {
      orderId: updatedOrder.id,
      userId: updatedOrder.userId,
      restaurantId: updatedOrder.restaurantId,
      riderId: updatedOrder.riderId ?? "",
      totalAmount: updatedOrder.totalAmount,
    });
  } catch (err) {
    console.error("Kafka ORDER_DELIVERED publish failed (non-fatal):", err);
  }

  return res.json({ message: "Order delivered successfully!" });
});

export const cancelOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const orderId = req.params.orderId as string;
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.userId !== req.user._id.toString()) {
    return res
      .status(401)
      .json({ message: "You are not allowed to cancel this order" });
  }

  const cancellableStatuses: string[] = ["placed", "accepted"];
  if (!cancellableStatuses.includes(order.status)) {
    return res.status(400).json({
      message: `Order cannot be cancelled at this stage (${order.status}). Please contact support.`,
    });
  }

  let newPaymentStatus: PaymentStatus = order.paymentStatus;
  if (order.paymentStatus === PaymentStatus.paid) {
    newPaymentStatus = PaymentStatus.refund_pending;
  } else if (order.paymentStatus === PaymentStatus.cod_pending) {
    newPaymentStatus = PaymentStatus.failed;
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId as string },
    data: { status: OrderStatus.cancelled, paymentStatus: newPaymentStatus },
  });

  await emitToRealtime("order:update", `restaurant:${updatedOrder.restaurantId}`, {
    orderId: updatedOrder.id,
    status: "cancelled",
  });

  try {
    await publishOrderEvent("ORDER_CANCELLED", {
      orderId: updatedOrder.id,
      userId: updatedOrder.userId,
      restaurantId: updatedOrder.restaurantId,
      paymentStatus: newPaymentStatus,
    });
  } catch (err) {
    console.error("Kafka ORDER_CANCELLED publish failed (non-fatal):", err);
  }

  res.json({
    message: "Order cancelled successfully",
    refundMessage:
      order.paymentMethod !== PaymentMethod.cod &&
      newPaymentStatus === PaymentStatus.refund_pending
        ? "Your refund will be processed in 5-7 business days."
        : null,
    order: updatedOrder,
  });
});

export const getRiderEarnings = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const riderId = req.params.riderId as string;
  if (!riderId) return res.status(400).json({ message: "Rider id required" });

  const orders = await prisma.order.findMany({
    where: { riderId, status: OrderStatus.delivered },
    select: {
      riderAmount: true,
      totalAmount: true,
      createdAt: true,
      restaurantName: true,
    },
  });

  const totalEarnings = orders.reduce(
    (sum, o) => sum + (o.riderAmount || 0),
    0,
  );
  const totalOrders = orders.length;

  const last7Days: { date: string; earnings: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0]!;
    const dayOrders = orders.filter((o) => {
      const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
      return orderDate === dateStr;
    });
    last7Days.push({
      date: dateStr,
      earnings: dayOrders.reduce((sum, o) => sum + (o.riderAmount || 0), 0),
      orders: dayOrders.length,
    });
  }

  const today = new Date().toISOString().split("T")[0]!;
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toISOString().split("T")[0] === today,
  );
  const todayEarnings = todayOrders.reduce(
    (sum, o) => sum + (o.riderAmount || 0),
    0,
  );

  res.json({
    totalEarnings,
    totalOrders,
    todayEarnings,
    todayOrders: todayOrders.length,
    last7Days,
    recentOrders: orders.slice(0, 5),
  });
});
