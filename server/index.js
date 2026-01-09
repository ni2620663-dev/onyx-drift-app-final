import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';

// ১. কনফিগারেশন লোড
dotenv.config();

// ২. ডাটাবেস কানেকশন ও রাউট ইম্পোর্ট
import connectDB from "./config/db.js"; 
import profileRoutes from "./src/routes/profile.js"; 
import postRoutes from "./routes/posts.js";
import usersRoutes from './routes/users.js'; 
import messageRoutes from "./routes/messages.js";      
import uploadRoutes from './routes/upload.js';

const app = express();
const server = http.createServer(app);

// ৩. Cloudinary কনফিগারেশন
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// ৪. Redis কানেকশন
let REDIS_URL = process.env.REDIS_URL || "redis://default:vrf4EFLABBRLQ65e02TISHLbzC3kGiCH@redis-16125.c10.us-east-1-4.ec2.cloud.redislabs.com:16125";
if (!REDIS_URL.startsWith("redis://") && !REDIS_URL.startsWith("rediss://")) {
    REDIS_URL = `redis://${REDIS_URL}`;
}

const redisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 50, 2000),
};

const redis = new Redis(REDIS_URL, redisOptions); 

// ৫. AI কনফিগারেশন (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ৬. Middleware ও CORS সেটআপ
const allowedOrigins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173", 
    "https://onyx-drift-app-final.onrender.com",
    "https://onyxdrift.onrender.com",
    "https://www.onyx-drift.com",
    "https://onyx-drift.com"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS Access Denied"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ৭. ডাটাবেস কানেক্ট এবং রাউট মাউন্টিং
connectDB();

app.use("/api/user", usersRoutes);      
app.use("/api/profile", profileRoutes); 
app.use("/api/messages", messageRoutes); 
app.use("/api/posts", postRoutes); 
app.use("/api/upload", uploadRoutes); 

// AI Enhance Route
app.post("/api/ai/enhance", async (req, res) => {
  try {
    const { prompt } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`Aesthetic rewrite: "${prompt}"`);
    res.json({ enhancedText: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: "AI Error" });
  }
});

app.get("/", (req, res) => res.send("✅ OnyxDrift Neural Server Online"));

// ৮. সকেট ও রিয়েল-টাইম লজিক (কলিং সহ)
const io = new Server(server, {
  cors: { 
    origin: allowedOrigins, 
    methods: ["GET", "POST"], 
    credentials: true 
  },
  transports: ['polling', 'websocket'], 
  allowEIO3: true,
  path: "/socket.io/"
});

io.on("connection", (socket) => {
  console.log(`📡 Connected: ${socket.id}`);
  
  // ইউজার অনলাইন হলে Redis-এ সেভ করা
  socket.on("addNewUser", async (userId) => {
    if (userId) {
      await redis.hset("online_users", userId, socket.id);
      
      // অনলাইন ইউজারের লিস্ট সবাইকে পাঠানো
      const allUsers = await redis.hgetall("online_users");
      const onlineList = Object.keys(allUsers).map(id => ({ userId: id, socketId: allUsers[id] }));
      io.emit("getOnlineUsers", onlineList);
      
      console.log(`👤 User Online: ${userId}`);
    }
  });

  // ১. মেসেজ পাঠানোর লজিক
  socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
    const receiverSocketId = await redis.hget("online_users", receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("getMessage", { senderId, text });
    }
  });

  // ২. ইনকামিং কল হ্যান্ডলিং (Signal to Target)
  socket.on("callUser", async ({ userToCall, fromName, roomId, type, from }) => {
    const receiverSocketId = await redis.hget("online_users", userToCall);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", { 
        fromName, 
        roomId, 
        type, 
        from: from // কলদাতার আইডি (রিজেক্ট করার জন্য লাগবে)
      });
      console.log(`📞 Call from ${fromName} to socket ${receiverSocketId}`);
    }
  });

  // ৩. কল রিজেক্ট বা কাট করা
  socket.on("rejectCall", async ({ targetId }) => {
    const targetSocketId = await redis.hget("online_users", targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("callRejected");
      console.log(`🚫 Call rejected/cut for ${targetId}`);
    }
  });

  // ৪. ডিসকানেক্ট হ্যান্ডলিং
  socket.on("disconnect", async () => {
    const allUsers = await redis.hgetall("online_users");
    for (const [userId, socketId] of Object.entries(allUsers)) {
      if (socketId === socket.id) {
        await redis.hdel("online_users", userId);
        console.log(`❌ User Offline: ${userId}`);
        break;
      }
    }
    // আপডেট লিস্ট পাঠানো
    const remainingUsers = await redis.hgetall("online_users");
    const onlineList = Object.keys(remainingUsers).map(id => ({ userId: id, socketId: remainingUsers[id] }));
    io.emit("getOnlineUsers", onlineList);
  });
});

// ৯. সার্ভার স্টার্ট
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 System Active on Port: ${PORT}`);
});