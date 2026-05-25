import axios from "axios";
import { prisma } from "../config/prisma.js";
import { PaymentStatus, OrderStatus } from "@prisma/client";
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

      const order = await prisma.$transaction(async (tx) => {
        const existing = await tx.order.findUnique({ where: { id: orderId } });
        if (!existing || existing.paymentStatus === PaymentStatus.paid)
          return null;
        return tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: PaymentStatus.paid,
            status: OrderStatus.placed,
            expiresAt: null,
          },
        });
      });

      if (!order) {
        channel.ack(msg);
        return;
      }

      console.log("Order Placed:", order.id);

      await redisClearCart(order.userId);

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
            items: order.items as any,
            totalAmount: order.totalAmount,
            orderId: order.id,
          });
        }
      } catch (emailErr) {
        console.error("Failed to send order email:", emailErr);
      }

      await axios.post(
        `${process.env.REALTIME_SERVICE}/api/v1/internal/emit`,
        {
          event: "order:new",
          room: `restaurant:${order.restaurantId}`,
          payload: { orderId: order.id },
        },
        { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } },
      );

      channel.ack(msg);
    } catch (error) {
      console.error("Payment consumer error:", error);
    }
  });
};
