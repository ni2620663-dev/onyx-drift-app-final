import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { auth } from 'express-oauth2-jwt-bearer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import profileRoutes from "./src/routes/profile.js";
import { Server } from "socket.io"; // সকেট ইমপোর্ট
import http from "http"; // HTTP মডিউল ইমপোর্ট

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- ১. সকেট সেটআপের জন্য HTTP সার্ভার তৈরি ---
const server = http.createServer(app); 
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://www.onyx-drift.com"],
    methods: ["GET", "POST"]
  }
});

// অনলাইন ইউজার ট্র্যাক করার জন্য স্টোরেজ
let onlineUsers = [];

const addUser = (userId, socketId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

// --- ২. সকেট কানেকশন লজিক ---
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // ইউজার জয়েন করলে তাকে লিস্টে যোগ করা
  socket.on("addNewUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });

  // ১-টু-১ কল ইনভাইট পাঠানো
  socket.on("sendCallInvite", ({ senderName, roomId, receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("incomingCall", {
        senderName,
        roomId,
      });
    }
  });

  // কল রিজেক্ট করা
  socket.on("rejectCall", ({ receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("callRejected");
    }
  });

  // মেসেজ পাঠানো
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("getMessage", {
        senderId,
        text,
      });
    }
  });

  // ডিসকানেক্ট হলে
  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("getOnlineUsers", onlineUsers);
    console.log("User disconnected");
  });
});

// --- ৩. সিকিউরিটি ও মিডলওয়্যার ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later."
});
app.use("/api/", limiter);
const io = require("socket.io")(10000, {
  cors: {
    origin: "http://localhost:5173", // আপনার ফ্রন্টএন্ড URL
  },
});

let users = [];

// ইউজার যোগ করার হেল্পার
const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

// ইউজার রিমুভ করার হেল্পার
const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

// নির্দিষ্ট ইউজারকে খুঁজে বের করা
const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  // ১. ইউজারকে অনলাইন লিস্টে যোগ করা
  socket.on("addNewUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getOnlineUsers", users);
  });

  // ২. মেসেজ পাঠানো (Real-time Messaging)
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("getMessage", {
        senderId,
        text,
      });
    }
  });

  // ৩. ভিডিও কল সিগন্যালিং (Call Invite)
  socket.on("sendCallInvite", ({ senderName, roomId, receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      console.log(`Sending call invite to: ${receiverId}`);
      io.to(user.socketId).emit("incomingCall", {
        senderName,
        roomId,
      });
    }
  });

  // ৪. ডিসকানেক্ট হ্যান্ডলিং
  socket.on("disconnect", () => {
    console.log("A user disconnected!");
    removeUser(socket.id);
    io.emit("getOnlineUsers", users);
  });
});

const allowedOrigins = [
    'https://www.onyx-drift.com',
    'https://onyx-drift.com',
    'https://onyx-drift-app-final.onrender.com',
    'http://localhost:5173'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// --- ৪. Routes ---
app.use("/api/profile", profileRoutes);

// --- ৫. Static Files ---
const buildPath = path.join(__dirname, "../client/dist");
app.use(express.static(buildPath));

app.get("*", (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(buildPath, "index.html"));
    }
});

// --- ৬. সার্ভার স্টার্ট (Server.listen ব্যবহার করতে হবে) ---
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server & Socket running on port ${PORT}`);
});