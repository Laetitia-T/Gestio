import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";
import { pool } from "./db/pool";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import listRoutes from "./routes/lists";
import taskRoutes from "./routes/tasks";
import taskDirectRoutes from "./routes/tasksDirect";
import { initSocket } from "./socket/index";

const app = express();
const httpServer = createServer(app);

// Initialise Socket.io
export const io = initSocket(httpServer);

app.use(cors());
app.use(express.json());

// Healthcheck
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(500).json({ status: "error", db: "unreachable" });
  }
});

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/lists", listRoutes);
app.use("/lists", taskRoutes);
app.use("/tasks", taskDirectRoutes);

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Gestio backend running on port ${PORT}`);
});