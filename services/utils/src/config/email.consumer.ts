import { getChannel } from "./rabbitmq.js";
import { sendOrderPlacedEmail, sendOtpEmail } from "./email.js";

export const startEmailConsumer = async () => {
  const channel = getChannel();
  const EMAIL_QUEUE = process.env.EMAIL_QUEUE || "email_queue";

  await channel.assertQueue(EMAIL_QUEUE, { durable: true });

  channel.consume(EMAIL_QUEUE, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      console.log(`📨 Email event received: ${event.type}`);

      if (event.type === "ORDER_PLACED") {
        const {
          to,
          customerName,
          restaurantName,
          items,
          totalAmount,
          orderId,
        } = event.data;
        await sendOrderPlacedEmail(
          to,
          customerName,
          restaurantName,
          items,
          totalAmount,
          orderId,
        );
      }

      if (event.type === "ORDER_OTP") {
        const { to, customerName, otp, restaurantName } = event.data;
        await sendOtpEmail(to, customerName, otp, restaurantName);
      }

      channel.ack(msg);
    } catch (error) {
      console.error("❌ Email consumer error:", error);
      channel.ack(msg);
    }
  });

  console.log("✅ Email consumer started");
};
