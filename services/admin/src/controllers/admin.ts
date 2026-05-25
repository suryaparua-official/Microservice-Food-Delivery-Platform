import axios from "axios";
import { ObjectId } from "mongodb";
import TryCatch from "../middlewares/trycatch.js";
import { getRiderCollection, getRestaurantCollection } from "../util/collection.js";

export const getPendingRestaurant = TryCatch(async (req, res) => {
  const { data } = await axios.get(
    `${process.env.RESTAURANT_SERVICE}/api/restaurant/pending`,
    { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
  );
  res.json(data);
});

export const getPendingRiders = TryCatch(async (req, res) => {
  const { data } = await axios.get(
    `${process.env.RIDER_SERVICE}/api/rider/pending`,
    { headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY } }
  );
  res.json(data);
});

export const verifyRestaurant = TryCatch(async (req, res) => {
  const { id } = req.params;

  if (typeof id !== "string") {
    return res.status(400).json({ message: "invalid restaurant id" });
  }

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid object id" });
  }

  const result = await (
    await getRestaurantCollection()
  ).updateOne(
    { _id: new ObjectId(id) },
    { $set: { isVerified: true, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  res.json({ message: "Restaurant verified successfully" });
});

export const verifyRider = TryCatch(async (req, res) => {
  const { id } = req.params;

  if (typeof id !== "string") {
    return res.status(400).json({ message: "invalid rider id" });
  }

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid object id" });
  }

  const result = await (
    await getRiderCollection()
  ).updateOne(
    { _id: new ObjectId(id) },
    { $set: { isVerified: true, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: "rider not found" });
  }

  res.json({ message: "rider verified successfully" });
});
