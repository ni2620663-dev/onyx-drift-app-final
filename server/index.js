import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js"; 

// রাউট ইম্পোর্ট
import profileRoutes from "./src/routes/profile.js"; 
import userRoutes from "./routes/userRoutes.js";    
import postRoutes from "./routes/posts.js";        
// ⚠️ নিশ্চিত হোন এই ফাইলগুলো আপনার routes ফোল্ডারে আছে
import messageRoutes from "./routes/messages.js"; 

dotenv.config();

const app = express();

// ১. মিডেলওয়্যার সেটআপ
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}));
app.use(express.json());

// ২. HTTP Server তৈরি
const server = http.createServer(app);

// ৩. Socket.io কনফিগারেশন
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

// ৪. ডাটাবেস কানেক্ট
connectDB();

// ৫. এপিআই রাউটস মাউন্ট করা
app.use("/api/profile", profileRoutes);
app.use("/api/user", userRoutes); 
app.use("/api/posts", postRoutes);

// ✅ মেসেজ রাউট মাউন্ট (যাতে Messenger.jsx এর 404 এরর চলে যায়)
// যদি routes/messages.js ফাইলটি থাকে তবে এটি আনকমেন্ট করুন
if (messageRoutes) {
    app.use("/api/messages", messageRoutes);
}

// ✅ Watch পেজের 404 এরর বন্ধ করার জন্য সাময়িক রাউট
app.get("/api/watch", (req, res) => {
    res.json([]); // আপাতত খালি ডাটা পাঠাবে যাতে ক্রাশ না করে
});

app.get("/", (req, res) => res.send("✅ OnyxDrift API is running..."));

// --- সকেট লজিক ---
let onlineUsers = []; 

io.on("connection", (socket) => {
  console.log("🚀 New Connection:", socket.id);

  socket.on("addNewUser", (userId) => {
    if (!userId) return;
    onlineUsers = onlineUsers.filter((u) => u.userId !== userId);
    onlineUsers.push({ userId, socketId: socket.id });
    console.log("👥 Online Users Updated:", onlineUsers);
    io.emit("getOnlineUsers", onlineUsers);
  });

  socket.on("sendNotification", ({ senderName, receiverId, type, image }) => {
    const receiver = onlineUsers.find((u) => u.userId === receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getNotification", {
        senderName,
        type,
        image,
        createdAt: new Date(),
      });
    }
  });

  socket.on("sendMessage", (message) => {
    const receiver = onlineUsers.find((u) => u.userId === message.receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", message);
    }
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit("getOnlineUsers", onlineUsers);
    console.log("❌ User disconnected");
  });
});

// ৬. সার্ভার স্টার্ট
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`\n============================================`);
  console.log(`✅ OnyxDrift Server is Live on Port ${PORT}`);
  console.log(`🚀 Socket.io is ready for connections`);
  console.log(`============================================\n`);
});