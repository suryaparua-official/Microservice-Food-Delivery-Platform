import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import { prisma } from "../config/prisma.js";

export const addAddress = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { mobile, formattedAddress, latitude, longitude } = req.body;

  if (
    !mobile ||
    !formattedAddress ||
    latitude === undefined ||
    longitude === undefined
  ) {
    return res.status(400).json({ message: "Please give all fields" });
  }

  const newAddress = await prisma.address.create({
    data: {
      userId: user._id.toString(),
      mobile: String(mobile),
      formattedAddress,
      latitude: Number(latitude),
      longitude: Number(longitude),
    },
  });

  res.json({ message: "Address Added successfully", address: newAddress });
});

export const deleteAddress = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    const address = await prisma.address.findFirst({
      where: { id, userId: user._id.toString() },
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    await prisma.address.delete({ where: { id: address.id } });

    res.json({ message: "Address deleted Successfully" });
  },
);

export const getMyAddresses = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user._id.toString() },
      orderBy: { createdAt: "desc" },
    });

    res.json(addresses);
  },
);
