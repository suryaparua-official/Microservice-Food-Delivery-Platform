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

/**
 * @swagger
 * tags:
 *   name: Rider
 *   description: Rider profile and order management endpoints
 */

router.post("/new", isAuth, uploadFile, addRiderProfile);

/**
 * @swagger
 * /api/rider/myprofile:
 *   get:
 *     summary: Get the authenticated rider's profile
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rider profile data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Rider profile not found
 */
router.get("/myprofile", isAuth, fetchMyProfile);

/**
 * @swagger
 * /api/rider/toggle:
 *   patch:
 *     summary: Toggle rider availability (online / offline)
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Availability toggled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Rider not verified
 */
router.patch("/toggle", isAuth, toggleRiderAvailablity);

/**
 * @swagger
 * /api/rider/accept/{orderId}:
 *   post:
 *     summary: Accept an available order
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to accept
 *     responses:
 *       200:
 *         description: Order accepted successfully
 *       400:
 *         description: Order already assigned
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post("/accept/:orderId", isAuth, acceptOrder);

router.get("/order/current", isAuth, fetchMyCurrentOrder);
router.put("/order/update/:orderId", isAuth, updateOrderStatus);

/**
 * @swagger
 * /api/rider/order/verify/{orderId}:
 *   post:
 *     summary: Verify customer OTP to confirm delivery
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP from customer
 *     responses:
 *       200:
 *         description: OTP verified, order delivered
 *       400:
 *         description: Invalid OTP
 *       404:
 *         description: Order not found
 */
router.post("/order/verify/:orderId", isAuth, verifyOtp);

/**
 * @swagger
 * /api/rider/earnings:
 *   get:
 *     summary: Get rider earnings summary
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings data
 *       401:
 *         description: Unauthorized
 */
router.get("/earnings", isAuth, getMyEarnings);

export default router;
