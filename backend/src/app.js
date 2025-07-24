import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Import routes
import userRoutes from "./routes/user.routes.js";
// Use routes
app.use("/api/v1/users", userRoutes);
const PORT = process.env.PORT || 3000;
export default app;
