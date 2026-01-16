import prisma from "../prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendOtpEmail, sendResetPasswordEmail } from "../utils/mailer.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

//register
export async function register(req, res) {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
   
    const { name, email, password } = req.body;

    const exists = await prisma.auth.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();

    await prisma.auth.create({
        data: {
            name,
            email,
            password: hashed,
            otp,
            otpExpiresAt: new Date(Date.now() + 10 * 60000),
        },
    });

    await sendOtpEmail(email, otp);
    res.json({ message: "Registered. OTP sent." });
}

//verify otp
export async function verifyOtp(req, res) {
    const { email, otp } = req.body;

    const user = await prisma.auth.findUnique({ where: { email } });
    if (!user || user.otp !== otp || user.otpExpiresAt < new Date()) {
        return res.status(400).json({ error: "Invalid OTP" });
    }

    await prisma.auth.update({
        where: { email },
        data: { isVerified: true, otp: null, otpExpiresAt: null },
    });

    res.json({ message: "Account verified" });
}

//resend otp
export async function resendOtp(req, res) {
    const { email } = req.body;
    const otp = crypto.randomInt(100000, 999999).toString();

    await prisma.auth.update({
        where: { email },
        data: {
            otp,
            otpExpiresAt: new Date(Date.now() + 10 * 60000),
        },
    });

    await sendOtpEmail(email, otp);
    res.json({ message: "OTP resent" });
}

//login
export async function login(req, res) {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = req.body;
    const user = await prisma.auth.findUnique({ where: { email } });

    if (!user || !user.isVerified)
        return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );

    await prisma.auth.update({
        where: { id: user.id },
        data: { refreshToken },
    });

    // Exclude sensitive fields before returning user
    const { password: _pwd, otp: _otp, otpExpiresAt: _otpExp, resetToken: _reset, refreshToken: _rt, ...userWithoutSensitive } = user;

    res.json({ token, refreshToken, user: userWithoutSensitive });
}

// UPDATE PROFILE (protected route)
export async function updateProfile(req, res) {
    try {
        const userId = req.user.userId;
        const { name, email, password } = req.body;

        const data = {};

        if (name) data.name = name;
        if (email) data.email = email;
        if (password) data.password = await bcrypt.hash(password, 10);

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: "Nothing to update" });
        }

        const updatedUser = await prisma.auth.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isVerified: true
            }
        });

        return res.json({
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
}

// FORGOT PASSWORD
export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await prisma.auth.findUnique({ where: { email } });

        if (!user) {
            return res.status(400).json({ error: "Email not registered" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ error: "Account not verified" });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { id: user.id },
            process.env.RESET_PASSWORD_SECRET,
            { expiresIn: "15m" }
        );

        // Hash token before saving
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        await prisma.auth.update({
            where: { id: user.id },
            data: {
                resetToken: hashedToken,
            },
        });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        await sendResetPasswordEmail(email, resetLink);

        return res.json({ message: "Password reset link sent" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
}

// RESET PASSWORD
export async function resetPassword(req, res) {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token) {
            return res.status(400).json({ error: "Token missing" });
        }

        if (!password) {
            return res.status(400).json({ error: "Password is required" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
        } catch (err) {
            return res.status(400).json({
                error:
                    err.name === "TokenExpiredError"
                        ? "Token expired"
                        : "Invalid token",
            });
        }

        // Hash received token to match DB
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await prisma.auth.findFirst({
            where: {
                id: decoded.id,
                resetToken: hashedToken,
            },
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.auth.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null, // invalidate token
            },
        });

        return res.json({ message: "Password reset successful" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
}

// Logout
export async function Logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }
    // console.log(refreshToken)

    const user = await prisma.auth.findFirst({
      where: { refreshToken },
    });

    // console.log(user.name)

    if (!user) {
      return res.json({ error: "Invalid refresh token" });
    }

    await prisma.auth.update({
      where: { id: user.id },
      data: { refreshToken: null },
    });

    return res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// RefreshToken 
export async function refreshToken(req, res) {
    const { token } = req.body;

    if (!token) return res.status(401).json({ error: "Refresh token required" });

    try {
        // Verify refresh token
        const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        // Find user in DB
        const user = await prisma.auth.findUnique({ where: { id: payload.userId } });

        if (!user || user.refreshToken !== token) {
            return res.status(403).json({ error: "Invalid refresh token" });
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        res.json({ token: newAccessToken });
    } catch (err) {
        return res.status(403).json({ error: "Invalid or expired refresh token" });
    }
}

// Get All Users (Admin only)
export async function getAllUsers(req, res) {

    try {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "Access Denied" });
        }

        const users = await prisma.auth.findMany({
            where: { role: "USER" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: "desc" }
        });

        res.json({ success: true, users });
    } catch (err) {
        console.error("getAllUsers error:", err);
        res.status(500).json({ error: "Server error" });
    }
}

// Get Single User (Admin only)
export async function getSingleUser(req, res) {
    try {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "Access Denied" });
        }
        const { id } = req.params;

        const user = await prisma.auth.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                orders: true,
            }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }   
        res.json({ success: true, user });
    } catch (err) {
        console.error("getSingleUser error:", err);
        res.status(500).json({ error: "Server error" });
    }   
}

// Get Profile (Protected route)
export async function getProfile(req, res) {
    try {
        const userId = req.user.userId; 
        const user = await prisma.auth.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        }); 
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ success: true, user });
    } catch (err) {
        console.error("getProfile error:", err);
        res.status(500).json({ error: "Server error" });
    }   
}