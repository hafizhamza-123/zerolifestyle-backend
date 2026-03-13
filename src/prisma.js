import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton for Serverless Environments
 * 
 * In serverless functions (like Vercel), connections are expensive.
 * This pattern ensures a single Prisma instance is reused across requests
 * by storing it in the Node.js runtime memory between function invocations.
 * 
 * Cold starts will create a new instance, but warm starts reuse the existing one.
 */

let prisma;

// Reuse Prisma Client in serverless by checking globalThis
if (process.env.NODE_ENV === "production") {
  // Serverless environment - use global singleton pattern
  if (!globalThis.prisma) {
    globalThis.prisma = new PrismaClient({
      log: ["error"], // Only log errors in production
    });
  }
  prisma = globalThis.prisma;
} else {
  // Local development - create new instance
  prisma = new PrismaClient({
    log: ["query", "error", "warn"],
  });
}

export default prisma;
