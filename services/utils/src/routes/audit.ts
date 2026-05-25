import express from "express";
import { getAuditLogs } from "../config/kafka.consumer.js";

const router = express.Router();

router.get("/logs", (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const logs = getAuditLogs().slice(0, 100);
  res.json({ count: logs.length, logs });
});

export default router;
