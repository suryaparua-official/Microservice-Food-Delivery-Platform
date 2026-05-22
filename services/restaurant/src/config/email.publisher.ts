import { getChannel } from "./rabbitmq.js";

const EMAIL_QUEUE = process.env.EMAIL_QUEUE || "email_queue";

export const publishOrderPlacedEmail = async (data: {
  to: string;
  customerName: string;
  restaurantName: string;
  items: { name: string; quauntity: number; price: number }[];
  totalAmount: number;
  orderId: string;
}) => {
  const channel = getChannel();
  await channel.assertQueue(EMAIL_QUEUE, { durable: true });
  channel.sendToQueue(
    EMAIL_QUEUE,
    Buffer.from(JSON.stringify({ type: "ORDER_PLACED", data })),
    { persistent: true },
  );
  console.log(`📨 Order placed email event published for ${data.to}`);
};

export const publishOtpEmail = async (data: {
  to: string;
  customerName: string;
  otp: string;
  restaurantName: string;
}) => {
  const channel = getChannel();
  await channel.assertQueue(EMAIL_QUEUE, { durable: true });
  channel.sendToQueue(
    EMAIL_QUEUE,
    Buffer.from(JSON.stringify({ type: "ORDER_OTP", data })),
    { persistent: true },
  );
  console.log(`📨 OTP email event published for ${data.to}`);
};
