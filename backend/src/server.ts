import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { pool } from "./db/pool";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import listRoutes from "./routes/lists";
import taskRoutes from "./routes/tasks";

const app = express();
app.use(cors());
app.use(express.json());

// Healthcheck en premier, avant tout middleware d'auth
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "unreachable" });
  }
});

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/lists", listRoutes);
app.use("/lists", taskRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Gestio backend running on port ${PORT}`);
});