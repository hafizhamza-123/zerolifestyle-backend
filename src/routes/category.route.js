import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryProducts,
  updateCategory,
  deleteCategory
} from "../controllers/category.controller.js";
import { authMiddleware } from "../middlewares/auth.js";
import { adminMiddleware } from "../middlewares/admin.js";
const router = express.Router();

router.get("/", getAllCategories);
router.get("/products/:id", getCategoryProducts);
router.get("/:id", getCategoryById);
router.post("/create", authMiddleware, adminMiddleware, createCategory);
router.put("/:id", authMiddleware, adminMiddleware, updateCategory);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);

export default router;
