import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getSingleOrder,
  UpdateStatus,
  getRevenueStats,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { adminMiddleware } from "../middlewares/admin.js";

const router = Router();

router.post("/create", authMiddleware, createOrder);
router.get("/", authMiddleware, adminMiddleware, getAllOrders);
router.get("/stats/revenue", authMiddleware, adminMiddleware, getRevenueStats);
router.get("/:id", authMiddleware, adminMiddleware, getSingleOrder);
router.put("/:id/status", authMiddleware, adminMiddleware, UpdateStatus);
router.put("/:id/cancel", authMiddleware, cancelOrder);

export default router;
