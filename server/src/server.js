import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js"; 
import profileRoutes from "./routes/profile.js";
import messageRoutes from "./routes/messages.js";
import userRoutes from "./routes/userRoutes.js"; // আমাদের নতুন রাউট

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ১. HTTP Server তৈরি
const server = http.createServer(app);

// ২. Socket.io কনফিগারেশন
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://your-live-site.com"], // আপনার ফ্রন্টএন্ড URL
    methods: ["GET", "POST"],
  },
});

// ডাটাবেস কানেক্ট
connectDB();

// রাউট মাউন্ট করা
app.use("/api/profile", profileRoutes);
app.use("/api/user", userRoutes); // ফ্রেন্ড রিকোয়েস্ট এবং প্রোফাইল ডাটার জন্য
if (messageRoutes) app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => res.send("OnyxDrift API running with Socket.io"));

// --- সকেট লজিক (রিয়েল-টাইম ফেসবুক ফিচার) ---
let onlineUsers = []; // { userId, socketId }

io.on("connection", (socket) => {
  console.log("New Connection:", socket.id);

  // ৩. ইউজার অনলাইনে আসলে তাকে রেজিস্টার করা
  socket.on("addNewUser", (userId) => {
    // আগের কোনো সেশন থাকলে তা রিমুভ করা (এক আইডি এক ডিভাইস লজিক)
    onlineUsers = onlineUsers.filter((u) => u.userId !== userId);
    
    onlineUsers.push({ userId, socketId: socket.id });
    console.log("Online Users Updated:", onlineUsers);
    
    // সবাইকে জানানো কারা অনলাইনে আছে
    io.emit("getOnlineUsers", onlineUsers);
  });

  // ৪. রিয়েল-টাইম নোটিফিকেশন (Like, Comment, Friend Request)
  socket.on("sendNotification", ({ senderName, receiverId, type, image }) => {
    const receiver = onlineUsers.find((u) => u.userId === receiverId);
    if (receiver) {
      console.log(`Sending ${type} notification to: ${receiverId}`);
      io.to(receiver.socketId).emit("getNotification", {
        senderName,
        type,
        image,
        createdAt: new Date(),
      });
    }
  });

  // ৫. চ্যাট মেসেজ
  socket.on("sendMessage", (message) => {
    const receiver = onlineUsers.find((u) => u.userId === message.receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", message);
    }
  });

  // ৬. ভিডিও কল (ZEGOCLOUD)
  socket.on("sendCallRequest", (data) => {
    const receiver = onlineUsers.find((u) => u.userId === data.receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("incomingCall", {
        senderName: data.senderName,
        roomId: data.roomId,
      });
    }
  });

  // ৭. ডিসকানেক্ট হ্যান্ডলিং
  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit("getOnlineUsers", onlineUsers);
    console.log("User disconnected");
  });
});

// সার্ভার স্টার্ট
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ OnyxDrift Server is Live on Port ${PORT}`);
});