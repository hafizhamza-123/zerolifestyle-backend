import express from "express";
import dotenv from "dotenv";
import prisma from "./prisma.js";
import centralRoutes from "./routes/index.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

const PORT = process.env.PORT || 3000;

app.use("/api", centralRoutes);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.info(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

startServer();

export default app;
