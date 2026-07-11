import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";

interface SocketUser {
  userId: number;
}

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // Middleware d'authentification Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error("Token manquant."));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as SocketUser;
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Token invalide."));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as number;
    console.log(`Socket connecté — userId: ${userId}`);

    // L'utilisateur rejoint une room par liste
    socket.on("join_list", (listId: number) => {
      socket.join(`list:${listId}`);
      console.log(`userId ${userId} a rejoint list:${listId}`);
    });

    socket.on("leave_list", (listId: number) => {
      socket.leave(`list:${listId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket déconnecté — userId: ${userId}`);
    });
  });

  return io;
}