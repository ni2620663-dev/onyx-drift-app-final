import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';

// ১. কনফিগারেশন ও ডাটাবেস লোড
dotenv.config();
import connectDB from "./config/db.js"; 
import User from "./models/User.js"; 
import Message from "./models/Message.js"; 

// রাুট ইম্পোর্ট
import profileRoutes from "./src/routes/profile.js"; 
import postRoutes from "./routes/posts.js";
import userRoutes from './routes/users.js'; 
import messageRoutes from "./routes/messages.js";         

const app = express();
const server = http.createServer(app);

// ২. CORS কনফিগারেশন (একবারই ডিফাইন করা হয়েছে)
const allowedOrigins = [
    "http://localhost:5173", 
    "https://onyx-drift-app-final.onrender.com",
    "https://www.onyx-drift.com",
    "https://onyx-drift.com"
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));

// ৩. সকেট আইও (Double Header ফিক্সড)
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling']
});

// ৪. ডাটাবেস ও ক্লাউডিনারি
connectDB();
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// ৫. Redis কানেকশন
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 50, 2000),
}) : null;

if(redis) redis.on("connect", () => console.log("✅ Neural Cache Connected"));

// ৬. রাুট মাউন্টিং (৪MD ফিক্স করতে পাথ চেক করুন)
app.use("/api/user", userRoutes); 
app.use("/api/profile", profileRoutes); // যদি ফ্রন্টএন্ড /api/profile কল করে
app.use("/api/posts", postRoutes); 
app.use("/api/messages", messageRoutes); 

/* ==========================================================
    📡 REAL-TIME ENGINE
========================================================== */
io.on("connection", (socket) => {
    
    socket.on("addNewUser", async (userId) => {
        if (redis && userId) {
            await redis.hset("online_users", userId, socket.id);
            const allUsers = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
        }
    });

    socket.on("sendMessage", async (data) => {
        const { receiverId } = data;
        const socketId = await redis?.hget("online_users", receiverId);
        if (socketId) io.to(socketId).emit("getMessage", data);
    });

    socket.on("sendGlobalMessage", (data) => {
        socket.broadcast.emit("getGlobalMessage", data);
    });

    socket.on("typing", async ({ receiverId, senderId }) => {
        const socketId = await redis?.hget("online_users", receiverId);
        if (socketId) io.to(socketId).emit("displayTyping", { senderId });
    });

    socket.on("stopTyping", async ({ receiverId }) => {
        const socketId = await redis?.hget("online_users", receiverId);
        if (socketId) io.to(socketId).emit("hideTyping");
    });

    socket.on("messageSeen", async ({ messageId, senderId }) => {
        try {
            await Message.findByIdAndUpdate(messageId, { seen: true });
            const socketId = await redis?.hget("online_users", senderId);
            if (socketId) io.to(socketId).emit("messageSeenUpdate", { messageId });
        } catch (err) { console.log("Seen Error:", err); }
    });

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
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Core Online: ${PORT}`));