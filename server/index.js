import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
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

// ৪. Redis কানেকশন (Render এ Redis না থাকলে এরর হ্যান্ডলিং)
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
} else {
    console.log("⚠️ REDIS_URL not found. Socket features might be limited.");
}

// ৫. AI কনফিগারেশন (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ৬. Middleware ও CORS সেটআপ (Render এর জন্য আপডেট করা)
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

// 💡 গুরুত্বপূর্ণ: রাউট পাথগুলো চেক করুন
app.use("/api/user", usersRoutes); // এটিই আপনার /api/user/user/:userId হ্যান্ডেল করবে
app.use("/api/profile", profileRoutes); 
app.use("/api/messages", messageRoutes); 
app.use("/api/posts", postRoutes); 
app.use("/api/upload", uploadRoutes); 

// AI Enhance Route
app.post("/api/ai/enhance", async (req, res) => {
  try {
    const { prompt } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`Aesthetic rewrite this chat message: "${prompt}"`);
    res.json({ enhancedText: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: "AI Error" });
  }
});

app.get("/", (req, res) => res.send("✅ OnyxDrift Neural Server Online"));

// ৮. সকেট ও রিয়েল-টাইম লজিক (Transports আপডেট করা হয়েছে)
const io = new Server(server, {
  cors: { 
    origin: allowedOrigins, 
    methods: ["GET", "POST"], 
    credentials: true 
  },
  // Render-এ WebSocket কানেকশন ঠিক রাখতে 'polling' কে আগে দেওয়া ভালো যদি ডিরেক্ট কানেক্ট না হয়
  transports: ['polling', 'websocket'], 
  allowEIO3: true,
  path: '/socket.io/'
});

io.on("connection", (socket) => {
  console.log(`📡 Socket Connected: ${socket.id}`);
  
  socket.on("addNewUser", async (userId) => {
    if (userId && redis) {
      await redis.hset("online_users", userId, socket.id);
      const allUsers = await redis.hgetall("online_users");
      const onlineList = Object.keys(allUsers).map(id => ({ userId: id, socketId: allUsers[id] }));
      io.emit("getOnlineUsers", onlineList);
    }
  });

  socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
    if (redis) {
        const receiverSocketId = await redis.hget("online_users", receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("getMessage", { senderId, text });
        }
    }
  });

  socket.on("disconnect", async () => {
    if (redis) {
        const allUsers = await redis.hgetall("online_users");
        for (const [userId, socketId] of Object.entries(allUsers)) {
          if (socketId === socket.id) {
            await redis.hdel("online_users", userId);
            break;
          }
        }
        const remainingUsers = await redis.hgetall("online_users");
        const onlineList = Object.keys(remainingUsers).map(id => ({ userId: id, socketId: remainingUsers[id] }));
        io.emit("getOnlineUsers", onlineList);
    }
    console.log(`❌ Socket Disconnected: ${socket.id}`);
  });
});

// ৯. সার্ভার স্টার্ট
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Neural System Online: Port ${PORT}`);
});