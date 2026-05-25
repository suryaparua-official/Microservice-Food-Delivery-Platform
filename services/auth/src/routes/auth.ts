import express from "express";
import {
  addUserRole,
  getUserById,
  loginUser,
  logoutUser,
  myProfile,
} from "../controllers/auth.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Google OAuth login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Google OAuth authorization code
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Authorization code required
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /api/auth/add/role:
 *   put:
 *     summary: Add role to user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [customer, rider, seller]
 *     responses:
 *       200:
 *         description: Role added successfully
 *       401:
 *         description: Unauthorized
 */
router.put("/add/role", isAuth, addUserRole);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get("/me", isAuth, myProfile);

/**
 * @swagger
 * /api/auth/user/{userId}:
 *   get:
 *     summary: Get user by ID (internal)
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.post("/logout", isAuth, logoutUser);
router.get("/user/:userId", getUserById);

export default router;
