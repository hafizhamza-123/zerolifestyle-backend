import { Router } from "express";
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  updateProfile,
  forgotPassword,
  resetPassword,
  refreshToken,
  Logout,
  getAllUsers,
  getSingleUser,
  getProfile
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

import { registerLimiter, loginLimiter,forgotPasswordLimiter } from "../middlewares/rateLimiter.js";
const router = Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.put("/update", authMiddleware, updateProfile);
router.post("/forgot-password", forgotPasswordLimiter,forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", Logout);
router.get("/users", authMiddleware, getAllUsers);
router.get("/user/:id", authMiddleware, getSingleUser);
router.get("/profile", authMiddleware, getProfile);

export default router;
