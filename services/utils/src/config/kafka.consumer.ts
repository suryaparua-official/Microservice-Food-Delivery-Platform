import { Kafka } from "kafkajs";
import fs from "fs";
import path from "path";

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
const MAX_IN_MEMORY = 100;
const LOG_FILE = path.join(process.cwd(), "audit.log");

const appendToFile = (log: AuditLog) => {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(log) + "\n");
  } catch (err) {
    console.error("[AUDIT] Failed to write to audit.log:", err);
  }
};

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

      // Persist all events to file
      appendToFile(log);

      // Keep last MAX_IN_MEMORY entries in memory for API access
      auditLogs.unshift(log);
      if (auditLogs.length > MAX_IN_MEMORY) {
        auditLogs.splice(MAX_IN_MEMORY);
      }
    },
  });

  console.log("Kafka audit consumer started");
};

export const getAuditLogs = (): AuditLog[] => auditLogs;
