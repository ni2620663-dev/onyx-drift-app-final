import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';
import { auth } from 'express-oauth2-jwt-bearer';

// ১. কনফিগারেশন ও ডাটাবেস কানেকশন
dotenv.config();
import connectDB from "./config/db.js"; 
connectDB();

// রাউট ইম্পোর্ট
import userRoutes from './routes/user.js'; 
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import storyRoute from "./routes/stories.js";
import reelRoutes from "./routes/reels.js"; 
import profileRoutes from "./src/routes/profile.js";
import groupRoutes from "./routes/group.js"; 
import marketRoutes from "./routes/market.js"; 
import adminRoutes from "./routes/admin.js";    

// 🛡️ Auth0 JWT ভেরিফিকেশন মিডলওয়্যার
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE || 'https://onyx-drift-api.com', 
  issuerBaseURL: `https://dev-6d0nxccsaycctfl1.us.auth0.com/`, 
  tokenSigningAlg: 'RS256'
});

// Cloudinary Config
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const app = express();
const server = http.createServer(app);

// ৩. CORS কনফিগারেশন (উন্নত ও ফ্লেক্সিবল)
const allowedOrigins = [
    "http://localhost:5173", 
    "https://onyx-drift-app-final.onrender.com",
    "https://onyx-drift-app-final-u29m.onrender.com",
    "https://www.onyx-drift.com",
    "https://onyx-drift.com"
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Signal Blocked: CORS Security Policy'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));

// ৪. বডি পার্সার লিমিট
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// ৫. সকেট আইও কনফিগারেশন (সংশোধিত - ৪0৪ এরর এড়াতে)
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'], // Websocket অগ্রাধিকার দেওয়া হয়েছে
    allowEIO3: true, 
    path: '/socket.io/', // পাথ নিশ্চিত করা হয়েছে
    connectTimeout: 45000,
    pingTimeout: 60000,   
    pingInterval: 25000
});

// ৬. Redis Setup (Error Handling সহ)
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    }
}) : null;

if (redis) {
    redis.on("error", (err) => console.error("📡 Redis Sync Error:", err));
}

// ৭. এপিআই রাউটস
app.use("/api/user", userRoutes);      
app.use("/api/posts", postRoutes);  
app.use("/api/profile", profileRoutes); 
app.use("/api/stories", storyRoute);
app.use("/api/reels", reelRoutes); 
app.use("/api/market", marketRoutes); 
app.use("/api/admin", adminRoutes); 

// সুরক্ষিত রাউটস
app.use("/api/messages", checkJwt, messageRoutes); 
app.use("/api/groups", checkJwt, groupRoutes); 

app.get("/", (req, res) => res.status(200).send("🚀 OnyxDrift Neural Core is Online!"));

/* ==========================================================
    📡 REAL-TIME ENGINE (Socket.io)
========================================================== */

io.on("connection", (socket) => {
    console.log(`⚡ New Neural Link: ${socket.id}`);

    // অনলাইন ইউজার ট্র্যাকিং
    socket.on("addNewUser", async (userId) => {
        if (!userId) return;
        socket.userId = userId; 
        socket.join(userId); 
        
        if (redis) {
            await redis.hset("online_users", userId, socket.id);
            const allUsers = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
        }
    });

    // --- মেসেজিং লজিক ---
    socket.on("sendMessage", (data) => {
        const { receiverId, isGroup, conversationId } = data;
        if (isGroup) {
            socket.to(conversationId).emit("getMessage", data);
        } else if (receiverId) {
            io.to(receiverId).emit("getMessage", data);
        }
    });

    // --- নোটিফিকেশন লজিক ---
    socket.on("sendNotification", (data) => {
        const { receiverId, message, type } = data;
        if (receiverId) {
            io.to(receiverId).emit("getNotification", {
                senderName: data.senderName,
                type: type,
                message: message,
                image: data.image
            });
        }
    });

    // --- ডিসকানেকশন ---
    socket.on("disconnect", async () => {
        console.log(`🔌 Link Severed: ${socket.id}`);
        if (redis && socket.userId) {
            await redis.hdel("online_users", socket.userId);
            const updated = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(updated).map(id => ({ userId: id })));
        }
    });
});

// ৮. সার্ভার স্টার্ট (Error handling সহ)
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =========================================
    🚀 ONYX CORE: ACTIVE
    📡 PORT: ${PORT}
    🌐 NODE_ENV: ${process.env.NODE_ENV || 'development'}
    =========================================
    `);
});