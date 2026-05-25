import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import {
  assignRiderToOrder,
  cancelOrder,
  createOrder,
  fetchOrderForPayment,
  fetchRestaurantOrders,
  fetchSingleOrder,
  getCurrentOrderForRider,
  getMyOrders,
  updateOrderStatus,
  updateOrderStatusRider,
  verifyDeliveryOtp,
  getRiderEarnings,
} from "../controllers/order.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * /api/order/myorder:
 *   get:
 *     summary: Get all orders for the authenticated customer
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customer orders
 *       401:
 *         description: Unauthorized
 */
router.get("/myorder", isAuth, getMyOrders);

/**
 * @swagger
 * /api/order/new:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressId
 *               - paymentMethod
 *             properties:
 *               addressId:
 *                 type: string
 *                 description: Delivery address ID
 *               paymentMethod:
 *                 type: string
 *                 enum: [razorpay, stripe, cod]
 *                 description: Payment method
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid request or COD amount out of range
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Address or cart not found
 */
router.post("/new", isAuth, createOrder);

/**
 * @swagger
 * /api/order/verify-otp:
 *   post:
 *     summary: Verify delivery OTP to confirm order delivery
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - otp
 *             properties:
 *               orderId:
 *                 type: string
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP provided by customer
 *     responses:
 *       200:
 *         description: OTP verified, order marked as delivered
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: Order not found
 */
router.post("/verify-otp", verifyDeliveryOtp);

/**
 * @swagger
 * /api/order/cancel/{orderId}:
 *   post:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to cancel
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order cannot be cancelled at this stage
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post("/cancel/:orderId", isAuth, cancelOrder);
router.get("/payment/:id", fetchOrderForPayment);
router.get(
  "/restaurant/:restaurantId",
  isAuth,
  isSeller,
  fetchRestaurantOrders,
);
router.get("/current/rider", getCurrentOrderForRider);
router.put("/assign/rider", assignRiderToOrder);
router.put("/update/status/rider", updateOrderStatusRider);
router.put("/:orderId", isAuth, isSeller, updateOrderStatus);
router.get("/:id", isAuth, fetchSingleOrder);
router.get("/rider/earnings/:riderId", getRiderEarnings);

export default router;
