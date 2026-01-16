import upload from "../middlewares/upload.js";
import { Router } from "express";
import {
    getAllProducts,
    getSingleProduct,
    getBestSellers,
    SearchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getTopSellingProducts

} from "../controllers/product.controller.js"
import { authMiddleware } from "../middlewares/auth.js";
import { adminMiddleware } from "../middlewares/admin.js";

const router = Router();

router.post(
  "/createproduct",
  upload.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]), 
  authMiddleware, adminMiddleware, createProduct
);

router.put(
  "/:id",
  upload.fields([
    { name: "featuredImage", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
   authMiddleware, adminMiddleware, updateProduct
);

router.get("/best", getBestSellers);
router.get("/search", authMiddleware, SearchProduct);
router.get("/top-selling", authMiddleware, adminMiddleware, getTopSellingProducts);
router.get("/", getAllProducts);
router.get("/:id", getSingleProduct);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);


export default router;
