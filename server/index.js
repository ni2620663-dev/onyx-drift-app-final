import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

// ১. কনফিগারেশন লোড
dotenv.config();

// ২. ডাটাবেস কানেকশন ও রাউট ইম্পোর্ট
import connectDB from "./config/db.js"; 
import profileRoutes from "./src/routes/profile.js"; 
import postRoutes from "./routes/posts.js";
// ✅ ফিক্স: আপনার ফাইলের নাম user.js হলে ইম্পোর্ট এভাবেই রাখুন
import userRoutes from './routes/users.js'; 
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
const REDIS_URL = process.env.REDIS_URL;
let redis;
if (REDIS_URL) {
    redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => Math.min(times * 50, 2000),
    });
    redis.on("error", (err) => console.log("❌ Redis Error:", err));
    redis.on("connect", () => console.log("✅ Redis Connected"));
}

// ৫. AI কনফিগারেশন
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ৬. Middleware & CORS
const allowedOrigins = [
    "http://localhost:5173", 
    "https://onyx-drift-app-final.onrender.com",
    "https://www.onyx-drift.com",
    "https://onyx-drift.com"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("CORS Access Denied"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ৭. ডাটাবেস কানেক্ট
connectDB();

/* ==========================================================
    🚀 ROUTE MOUNTING (সঠিকভাবে ম্যাপিং করা হয়েছে)
========================================================== */

// ফ্রন্টএন্ড কল করছে /api/user/profile/:id 
// তাই এখানে /api/user মাউন্ট করতে হবে
app.use("/api/user", userRoutes); 

app.use("/api/profile", profileRoutes); 
app.use("/api/posts", postRoutes); 
app.use("/api/messages", messageRoutes); 
app.use("/api/upload", uploadRoutes); 

// হেলথ চেক
app.get("/", (req, res) => res.send("✅ OnyxDrift Neural Server Online"));

/* ==========================================================
    📡 SOCKET.IO LOGIC
========================================================== */
const io = new Server(server, {
  cors: { 
    origin: allowedOrigins, 
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'], 
  path: '/socket.io/'
});

io.on("connection", (socket) => {
  socket.on("addNewUser", async (userId) => {
    if (userId && redis) {
      await redis.hset("online_users", userId, socket.id);
      const allUsers = await redis.hgetall("online_users");
      const onlineList = Object.keys(allUsers).map(id => ({ userId: id, socketId: allUsers[id] }));
      io.emit("getOnlineUsers", onlineList);
    }
  });

  socket.on("disconnect", async () => {
    if (redis) {
        const allUsers = await redis.hgetall("online_users");
        for (const [userId, socketId] of Object.entries(allUsers)) {
          if (socketId === socket.id) {
            await redis.hdel("online_users", userId);
            const updatedUsers = await redis.hgetall("online_users");
            const onlineList = Object.keys(updatedUsers).map(id => ({ userId: id, socketId: updatedUsers[id] }));
            io.emit("getOnlineUsers", onlineList);
            break;
          }
        }
    }
  });
});

// ৮. সার্ভার লিসেনিং
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Neural System Online: Port ${PORT}`);
});