import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

let onlineUsers = []; // { userId, socketId }

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // ১. ইউজার জয়েন করলে ডুপ্লিকেট চেক করা (Single Session Logic)
  socket.on("addNewUser", (userId) => {
    // চেক করা হচ্ছে ইউজার অন্য কোথাও লগইন আছে কি না
    const existingUser = onlineUsers.find((u) => u.userId === userId);
    
    if (existingUser) {
      // আগের সকেটকে লগআউট করার জন্য মেসেজ পাঠানো
      io.to(existingUser.socketId).emit("forceLogout", "Logged in from another device");
      // লিস্ট থেকে আগের সকেট রিমুভ করা
      onlineUsers = onlineUsers.filter((u) => u.userId !== userId);
    }

    // নতুন সকেট যুক্ত করা
    onlineUsers.push({ userId, socketId: socket.id });
    io.emit("getOnlineUsers", onlineUsers);
  });

  // ২. ভিডিও কলের রিকোয়েস্ট হ্যান্ডলিং
  socket.on("sendCallRequest", ({ senderId, senderName, receiverId, roomId }) => {
    const receiver = onlineUsers.find((u) => u.userId === receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("incomingCall", { senderId, senderName, roomId });
    }
  });

  // ৩. ডিসকানেক্ট
  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });
});

connectDB();

const PORT = process.env.PORT || 10000
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));