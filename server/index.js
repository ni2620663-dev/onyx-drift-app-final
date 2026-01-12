import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';
import mongoose from "mongoose";

// ১. কনফিগারেশন লোড
dotenv.config();

// ২. ডাটাবেস ও রাুট ইম্পোর্ট
import connectDB from "./config/db.js"; 
import User from "./models/User.js"; 
import Post from "./models/Post.js"; 
import Notification from "./models/Notification.js"; 
import Message from "./models/Message.js"; 

// রাুট ফাইলগুলো
import profileRoutes from "./src/routes/profile.js"; 
import postRoutes from "./routes/posts.js";
import userRoutes from './routes/users.js'; 
import messageRoutes from "./routes/messages.js";         
import uploadRoutes from './routes/upload.js';
import communityRoutes from "./routes/communities.js";

const app = express();
const server = http.createServer(app);

// ৩. সকেট আইও ডিক্লেয়ারেশন (CORS ফিক্স করা হয়েছে)
const io = new Server(server, {
    cors: {
        // এখানে আপনার সব ডোমেইন যোগ করা হয়েছে
        origin: [
            "http://localhost:5173", 
            "https://onyx-drift-app-final.onrender.com",
            "https://www.onyx-drift.com",
            "https://onyx-drift.com"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// ৪. Cloudinary কনফিগারেশন
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// ৫. Redis কানেকশন
const REDIS_URL = process.env.REDIS_URL;
let redis;
if (REDIS_URL) {
    redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => Math.min(times * 50, 2000),
    });
    redis.on("connect", () => console.log("✅ Neural Cache (Redis) Connected"));
}

// ৬. Middleware ও DB Connection
connectDB();
app.use(cors({ 
    credentials: true, 
    origin: ["http://localhost:5173", "https://www.onyx-drift.com", "https://onyx-drift.com"] 
}));
app.use(express.json({ limit: "50mb" }));

// রাুট মাউন্টিং
app.use("/api/user", userRoutes); 
app.use("/api/profile", profileRoutes); 
app.use("/api/posts", postRoutes); 
app.use("/api/messages", messageRoutes); 

/* ==========================================================
    📡 REAL-TIME ENGINE (Global Chat & CORS Fixed)
========================================================== */
io.on("connection", (socket) => {
    
    // অনলাইন ইউজার ট্র্যাকিং
    socket.on("addNewUser", async (userId) => {
        if (redis && userId) {
            await redis.hset("online_users", userId, socket.id);
            const allUsers = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
        }
    });

    // ১. পার্সোনাল মেসেজ পাঠানো
    socket.on("sendMessage", async (data) => {
        const { receiverId } = data;
        const socketId = await redis?.hget("online_users", receiverId);
        if (socketId) io.to(socketId).emit("getMessage", data);
    });

    // ২. গ্লোবাল চ্যাট রুম (ChatRoom.jsx এর জন্য)
    socket.on("sendGlobalMessage", (data) => {
        // মেসেজটি সবাইকে পাঠিয়ে দাও (ব্রডকাস্ট)
        socket.broadcast.emit("getGlobalMessage", data);
    });

    // ৩. টাইপিং ইন্ডিকেটর
    socket.on("typing", async ({ receiverId, senderId }) => {
        const socketId = await redis?.hget("online_users", receiverId);
        if (socketId) io.to(socketId).emit("displayTyping", { senderId });
    });

    socket.on("stopTyping", async ({ receiverId }) => {
        const socketId = await redis?.hget("online_users", receiverId);
        if (socketId) io.to(socketId).emit("hideTyping");
    });

    // ৪. ব্লু টিক / মেসেজ সিন
    socket.on("messageSeen", async ({ messageId, senderId }) => {
        try {
            await Message.findByIdAndUpdate(messageId, { seen: true });
            const socketId = await redis?.hget("online_users", senderId);
            if (socketId) io.to(socketId).emit("messageSeenUpdate", { messageId });
        } catch (err) { console.log("Seen Error:", err); }
    });

    // ৫. মেসেজ ডিলিট
    socket.on("deleteMessage", async ({ messageId, receiverId }) => {
        const socketId = await redis?.hget("online_users", receiverId);
        if (socketId) io.to(socketId).emit("messageDeleted", messageId);
    });

    // ৬. ভিডিও/অডিও কল লজিক
    socket.on("callUser", ({ userToCall, from, fromName, type, roomId }) => {
        redis?.hget("online_users", userToCall).then((socketId) => {
            if (socketId) io.to(socketId).emit("incomingCall", { from, fromName, type, roomId });
        });
    });

    // ডিসকানেক্ট হ্যান্ডলার
    socket.on("disconnect", async () => {
        if (redis) {
            const all = await redis.hgetall("online_users");
            for (const [uId, sId] of Object.entries(all)) {
                if (sId === socket.id) {
                    await redis.hdel("online_users", uId);
                    const updated = await redis.hgetall("online_users");
                    io.emit("getOnlineUsers", Object.keys(updated).map(id => ({ userId: id })));
                    break;
                }
            }
        }
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 OnyxDrift Core Online: ${PORT}`));