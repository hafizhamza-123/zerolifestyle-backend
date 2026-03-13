import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import centralRoutes from "./routes/index.js";

// Load environment variables for local development
dotenv.config();

/**
 * Express Application Factory
 * 
 * This file creates and configures the Express app without starting a server.
 * It's designed to work both in serverless environments (Vercel) and traditional servers.
 * 
 * For serverless deployment:
 * - The app is wrapped with serverless-http in api/index.js
 * - Environment variables are set via Vercel dashboard
 * - Database connections use connection pooling to avoid exhaustion
 */

const app = express();

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// CORS middleware - configure origin from environment
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ============================================
// STATIC FILES
// ============================================
// Serve public folder for static files (e.g., favicon.ico)
app.use(express.static("public"));

// ============================================
// API ROUTES
// ============================================
// All routes are prefixed with /api
// Example routes:
//   GET    /api/auth/login
//   POST   /api/auth/signup
//   GET    /api/products
//   POST   /api/cart/add
//   etc.
//
// To add new routes:
// 1. Create a new route file in src/routes/
// 2. Import it here
// 3. Add it to the router: app.use("/api/newroute", newRoutes);

app.use("/api", centralRoutes);

// ============================================
// HEALTH CHECK ENDPOINT (for monitoring)
// ============================================
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

// ============================================
// ERROR HANDLER (Global error handling)
// ============================================
app.use((err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: {
      statusCode,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
});

// Export the configured app for use in serverless handler
export default app;
