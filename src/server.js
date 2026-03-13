/**
 * Local Development Server
 * ========================
 * 
 * This file is used for local development only.
 * It starts an Express server on a specified port.
 * 
 * In production (Vercel), the app is served through api/index.js as a serverless function.
 * 
 * Usage:
 *   npm run dev    - Start with auto-reload
 *   npm start      - Start once
 */

import app from "./app.js";
import prisma from "./prisma.js";

const PORT = process.env.PORT || 3000;

async function startLocalServer() {
  try {
    // Ensure database connection
    await prisma.$connect();
    console.log("✓ Database connected successfully");

    // Start Express server
    app.listen(PORT, () => {
      console.log(`✓ Server is running on http://localhost:${PORT}`);
      console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
      console.log(`✓ API Routes available at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error("✗ Failed to start server:", err.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n✓ Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n✓ Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

startLocalServer();
