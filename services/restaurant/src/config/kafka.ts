import { Kafka, Producer } from "kafkajs";

const kafka = new Kafka({
  clientId: "tomato-restaurant",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const producer: Producer = kafka.producer();

export const connectKafkaProducer = async (): Promise<void> => {
  await producer.connect();
  console.log("Kafka producer connected");
};

export interface OrderEvent {
  eventType: string;
  orderId: string;
  userId: string;
  restaurantId: string;
  timestamp: string;
  data: object;
}

export const publishOrderEvent = async (
  eventType: string,
  data: { orderId: string; userId: string; restaurantId: string; [key: string]: unknown },
): Promise<void> => {
  const event: OrderEvent = {
    eventType,
    orderId: data.orderId,
    userId: data.userId,
    restaurantId: data.restaurantId,
    timestamp: new Date().toISOString(),
    data,
  };

  await producer.send({
    topic: "order-events",
    messages: [
      {
        key: data.orderId,
        value: JSON.stringify(event),
      },
    ],
  });
};

export default kafka;
