import { Router } from "express";
import {
    addToCart,
    clearCart,
    getCart,
    removeCartItem,
    updateCartItem
} from "../controllers/cart.controller.js"
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.use(authMiddleware)

router.get("/" , getCart);
router.post("/add", addToCart);
router.put("/update", updateCartItem);
router.delete("/remove/:itemId", removeCartItem);
router.delete("/clear", clearCart)

export default router;