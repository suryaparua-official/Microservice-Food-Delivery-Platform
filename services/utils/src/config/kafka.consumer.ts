import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "tomato-audit",
  brokers: [process.env.KAFKA_BROKER || "kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "audit-group" });

interface AuditLog {
  eventType: string;
  orderId: string;
  userId: string;
  restaurantId: string;
  timestamp: string;
  data: object;
  receivedAt: string;
}

const auditLogs: AuditLog[] = [];
const MAX_LOGS = 1000;

export const startKafkaConsumer = async (): Promise<void> => {
  await consumer.connect();
  await consumer.subscribe({ topic: "order-events", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString()) as AuditLog;
      const log: AuditLog = { ...event, receivedAt: new Date().toISOString() };

      console.log(
        `[AUDIT] ${log.receivedAt} | ${log.eventType} | order:${log.orderId} | user:${log.userId}`,
      );

      auditLogs.unshift(log);
      if (auditLogs.length > MAX_LOGS) {
        auditLogs.splice(MAX_LOGS);
      }
    },
  });

  console.log("Kafka audit consumer started");
};

export const getAuditLogs = (): AuditLog[] => auditLogs;
