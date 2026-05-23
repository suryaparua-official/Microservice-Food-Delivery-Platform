import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  acceptOrder,
  addRiderProfile,
  fetchMyCurrentOrder,
  fetchMyProfile,
  toggleRiderAvailablity,
  updateOrderStatus,
  verifyOtp,
} from "../controllers/rider.js";
import uploadFile from "../middlewares/multer.js";
import { getMyEarnings } from "../controllers/rider.js";

const router = express.Router();

router.post("/new", isAuth, uploadFile, addRiderProfile);
router.get("/myprofile", isAuth, fetchMyProfile);
router.patch("/toggle", isAuth, toggleRiderAvailablity);
router.post("/accept/:orderId", isAuth, acceptOrder);
router.get("/order/current", isAuth, fetchMyCurrentOrder);
router.put("/order/update/:orderId", isAuth, updateOrderStatus);
router.post("/order/verify/:orderId", isAuth, verifyOtp);
router.get("/earnings", isAuth, getMyEarnings);

export default router;
