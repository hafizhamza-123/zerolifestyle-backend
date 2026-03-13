import app from "../src/app.js";
import prisma from "../src/prisma.js";
import { handler as serverlessHandler } from "serverless-http";

/**
 * Vercel Serverless Handler
 * ========================
 * 
 * This file exports the Express app as a serverless function for Vercel.
 * It wraps the Express app with serverless-http, which handles:
 * - Converting HTTP requests to Express req/res
 * - Managing event context
 * - Returning proper responses
 * 
 * The handler is invoked for every HTTP request to your Vercel deployment.
 * Database connections are pooled using the singleton pattern in src/prisma.js
 */

// Ensure database connection is established
// This runs on cold starts; warm starts reuse the connection
async function ensureDBConnection() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection failed:", err);
    // Don't throw - let the app handle it gracefully
  }
}

// Connect to database on startup
await ensureDBConnection();

/**
 * Serverless Handler
 * 
 * Usage:
 * - Vercel automatically invokes this function for API requests
 * - All Express middleware and routes work as expected
 * - The app is exported at the module level to reuse on warm starts
 */
export default serverlessHandler(app);

/**
 * Graceful Shutdown (for local testing)
 * In Vercel, the function context is cleaned up automatically
 */
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing database connection...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing database connection...");
  await prisma.$disconnect();
  process.exit(0);
});
