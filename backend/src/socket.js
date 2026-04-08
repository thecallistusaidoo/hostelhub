// src/socket.js
// Real-time messaging with Socket.io
// Add this to your server.js to enable live chat
//
// INSTALL: npm install socket.io
// UPDATE server.js: see instructions at bottom of this file

const { Server } = require("socket.io");
const { verifyAccessToken } = require("./utils/jwt.util");
const { Message } = require("./models");

function isSocketOriginAllowed(origin) {
  if (!origin) return true;
  const configured = (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (configured.includes(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

/**
 * Attach Socket.io to an existing HTTP server.
 * Call this from server.js after creating the Express app.
 *
 * Usage in server.js:
 *   const http = require("http");
 *   const { attachSocket } = require("./socket");
 *   const httpServer = http.createServer(app);
 *   attachSocket(httpServer);
 *   httpServer.listen(PORT, () => console.log(`Server on ${PORT}`));
 */
function attachSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, isSocketOriginAllowed(origin));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ── Auth middleware — verify JWT on every socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = verifyAccessToken(token);
      socket.user = decoded; // { id, role, email }
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // Track online users: { userId -> socketId }
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    const userId = String(socket.user.id);
    onlineUsers.set(userId, socket.id);
    console.log(`🔌 ${socket.user.role} connected: ${userId}`);

    // Notify others this user is online
    socket.broadcast.emit("user:online", { userId });

    // ── Join personal room for direct messages
    socket.join(`user:${userId}`);

    // ── CLIENT SENDS MESSAGE
    socket.on("message:send", async (payload, ack) => {
      try {
        const { receiverId, receiverModel, hostelId, body } = payload || {};
        if (!body?.trim()) return ack?.({ error: "Empty message" });
        if (!receiverId || !receiverModel) {
          return ack?.({ error: "receiverId and receiverModel required" });
        }
        if (!["Student", "Host"].includes(receiverModel)) {
          return ack?.({ error: "Invalid receiverModel" });
        }

        const senderModel = socket.user.role === "student" ? "Student" : "Host";
        const recvKey = String(receiverId);

        // Persist to DB
        const message = await Message.create({
          senderId: userId,
          senderModel,
          receiverId: recvKey,
          receiverModel,
          hostelId,
          body: body.trim(),
        });

        const messageData = {
          _id: message._id,
          senderId: userId,
          senderModel,
          receiverId: recvKey,
          receiverModel,
          body: message.body,
          hostelId: hostelId ? String(hostelId) : undefined,
          createdAt: message.createdAt,
          read: false,
        };

        // Deliver to receiver if online
        const receiverSocketId = onlineUsers.get(recvKey);
        if (receiverSocketId) {
          io.to(`user:${recvKey}`).emit("message:receive", messageData);
        }

        // Echo back to sender
        ack?.({ success: true, message: messageData });

      } catch (err) {
        console.error("Socket message error:", err.message);
        ack?.({ error: "Failed to send message" });
      }
    });

    // ── CLIENT MARKS MESSAGES AS READ
    socket.on("message:read", async ({ senderId }) => {
      try {
        if (!senderId) return;
        await Message.updateMany(
          { senderId, receiverId: userId, read: false },
          { read: true }
        );
        // Notify the original sender their messages were read
        io.to(`user:${String(senderId)}`).emit("message:read_receipt", { readBy: userId });
      } catch (err) {
        console.error("Read receipt error:", err.message);
      }
    });

    // ── TYPING INDICATOR
    socket.on("typing:start", ({ receiverId }) => {
      if (!receiverId) return;
      io.to(`user:${String(receiverId)}`).emit("typing:start", { userId });
    });

    socket.on("typing:stop", ({ receiverId }) => {
      if (!receiverId) return;
      io.to(`user:${String(receiverId)}`).emit("typing:stop", { userId });
    });

    // ── DISCONNECT
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit("user:offline", { userId });
      console.log(`🔌 Disconnected: ${userId}`);
    });
  });

  console.log("✅ Socket.io attached");
  return io;
}

module.exports = { attachSocket };

/*
═══════════════════════════════════════════════════════════════
HOW TO WIRE THIS INTO server.js
═══════════════════════════════════════════════════════════════

Replace the start() function at the bottom of server.js with:

  const http = require("http");
  const { attachSocket } = require("./socket");

  async function start() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("✅ MongoDB connected");

      const httpServer = http.createServer(app);
      attachSocket(httpServer);

      httpServer.listen(PORT, () =>
        console.log(`🚀 Server + Socket.io running on port ${PORT}`)
      );
    } catch (err) {
      console.error("❌ Startup failed:", err.message);
      process.exit(1);
    }
  }

═══════════════════════════════════════════════════════════════
FRONTEND USAGE (in your Next.js dashboard components)
═══════════════════════════════════════════════════════════════

Install: npm install socket.io-client

// lib/socket.js  (frontend)
import { io } from "socket.io-client";

let socket;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem("accessToken");
    socket = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect_error", (err) => {
      if (err.message === "Invalid or expired token") {
        // Token expired — refresh it then reconnect
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

// In MessagesTab component:
useEffect(() => {
  const socket = getSocket();

  socket.on("message:receive", (msg) => {
    // Add msg to conversation thread
    setConversations(prev => prev.map(c =>
      c.id === msg.senderId
        ? { ...c, messages: [...c.messages, { from:"student", text:msg.body, time:"Just now" }], unread: c.unread + 1 }
        : c
    ));
  });

  socket.on("typing:start", ({ userId }) => {
    setTypingUser(userId);
  });

  socket.on("typing:stop", () => setTypingUser(null));

  return () => {
    socket.off("message:receive");
    socket.off("typing:start");
    socket.off("typing:stop");
  };
}, []);

// Send a message:
const sendMessage = (receiverId, body, hostelId) => {
  const socket = getSocket();
  socket.emit("message:send", { receiverId, receiverModel: "Student", hostelId, body },
    (response) => {
      if (response.success) {
        // Append to local thread
      }
    }
  );
};
*/