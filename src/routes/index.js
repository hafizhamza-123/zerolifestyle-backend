import { Router } from "express"
import authroutes from "../routes/auth.route.js"
import productes from "../routes/product.route.js"
import orderroutes from "../routes/order.route.js"
import cartroutes from "../routes/cart.route.js"
import categoryroutes from "../routes/category.route.js"
const router = Router();

router.use("/auth",  authroutes);
router.use("/products", productes);
router.use("/categories", categoryroutes);
router.use("/cart", cartroutes);
router.use("/order", orderroutes);


export default router;

