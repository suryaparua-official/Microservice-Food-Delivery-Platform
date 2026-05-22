import axios from "axios";
import Order from "../models/Order.js";
import { getChannel } from "./rabbitmq.js";
import { redisClearCart } from "./cartRedis.js";
import { publishOrderPlacedEmail } from "./email.publisher.js";

export const startPaymentConsumer = async () => {
  const channel = getChannel();

  channel.consume(process.env.PAYMENT_QUEUE!, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      if (event.type !== "PAYMENT_SUCCESS") {
        channel.ack(msg);
        return;
      }

      const { orderId } = event.data;

      const order = await Order.findOneAndUpdate(
        { _id: orderId, paymentStatus: { $ne: "paid" } },
        {
          $set: { paymentStatus: "paid", status: "placed" },
          $unset: { expiresAt: 1 },
        },
        { new: true },
      );

      if (!order) {
        channel.ack(msg);
        return;
      }

      console.log("✅ Order Placed:", order._id);

      // Clear cart from Redis
      await redisClearCart(order.userId);

      // Fetch customer email from auth service
      try {
        const { data: userData } = await axios.get(
          `${process.env.AUTH_SERVICE_URL}/api/auth/user/${order.userId}`,
          { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
        );

        if (userData?.email) {
          await publishOrderPlacedEmail({
            to: userData.email,
            customerName: userData.name || "Customer",
            restaurantName: order.restaurantName,
            items: order.items,
            totalAmount: order.totalAmount,
            orderId: order._id.toString(),
          });
        }
      } catch (emailErr) {
        console.error("❌ Failed to send order email:", emailErr);
      }

      // Notify restaurant via socket
      await axios.post(
        `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
        {
          event: "order:new",
          room: `restaurant:${order.restaurantId}`,
          payload: { orderId: order._id },
        },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
      );

      channel.ack(msg);
    } catch (error) {
      console.error("❌ Payment consumer error:", error);
    }
  });
};
