import express from "express";
import http from "http"; // Node.js এর বিল্ট-ইন মডিউল
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js"; // আপনার ডাটাবেস কানেকশন ফাইল
// আপনার অন্যান্য রাউট ইম্পোর্ট (যেমন: userRoute, postRoute)

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ১. HTTP Server তৈরি করা (Socket.io এর জন্য এটি প্রয়োজন)
const server = http.createServer(app);

// ২. Socket.io কনফিগারেশন
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // আপনার ফ্রন্টএন্ডের URL (Vite এর জন্য সাধারণত এটিই হয়)
    methods: ["GET", "POST"],
  },
});
let onlineUsers = [];

io.on("connection", (socket) => {
  // ১. ইউজার যখন কানেক্ট হয়
  socket.on("addNewUser", (userId) => {
    if (userId && !onlineUsers.some((u) => u.userId === userId)) {
      onlineUsers.push({ userId, socketId: socket.id });
    }
    // সব ক্লায়েন্টকে বর্তমান অনলাইন ইউজারদের লিস্ট পাঠিয়ে দেওয়া
    io.emit("getOnlineUsers", onlineUsers);
  });

  // ২. ইউজার যখন ডিসকানেক্ট হয়
  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });
});

// ৩. ডাটাবেস কানেকশন
connectDB();

// আপনার API রাউটগুলো এখানে থাকবে
// app.use("/api/users", userRoute);
// app.use("/api/posts", postRoute);

// ৪. Socket.io লজিক
let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("New user connected: " + socket.id);

  // ইউজার জয়েন করলে তাকে অনলাইন লিস্টে রাখা
  socket.on("addNewUser", (userId) => {
    if (userId && !onlineUsers.some((u) => u.userId === userId)) {
      onlineUsers.push({ userId, socketId: socket.id });
    }
    io.emit("getOnlineUsers", onlineUsers);
  });

  // ডিসকানেক্ট হলে লিস্ট থেকে বাদ দেওয়া
  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });
});

// ৫. app.listen এর পরিবর্তে server.listen ব্যবহার করুন
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});