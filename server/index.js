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

// রাউট ইম্পোর্ট (নতুন Marketplace ও Admin রাউট যোগ করা হয়েছে)
import userRoutes from './routes/user.js'; 
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import storyRoute from "./routes/stories.js";
import reelRoutes from "./routes/reels.js"; 
import profileRoutes from "./src/routes/profile.js";
import groupRoutes from "./routes/group.js"; 
import marketRoutes from "./routes/market.js"; // 🛒 নতুন মার্কেটপ্লেস রাউট
import adminRoutes from "./routes/admin.js";   // 🛡️ নতুন অ্যাডমিন রাউট

// 🛡️ Auth0 JWT ভেরিফিকেশন মিডলওয়্যার
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE || 'https://onyx-drift-api.com', 
  issuerBaseURL: `https://dev-6d0nxccsaycctfl1.us.auth0.com/`, 
  tokenSigningAlg: 'RS256'
});

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const app = express();
const server = http.createServer(app);

// ৩. CORS কনফিগারেশন
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ৪. সকেট আইও কনফিগারেশন
const io = new Server(server, {
    cors: corsOptions,
    transports: ['polling', 'websocket'], 
    allowEIO3: true, 
    pingTimeout: 60000,   
    pingInterval: 25000
});

// ৫. Redis Setup
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
}) : null;

// ৬. এপিআই রাউটস (FIXED PATHS)
app.use("/api/user", userRoutes);    
app.use("/api/posts", postRoutes); 
app.use("/api/profile", profileRoutes); 
app.use("/api/stories", storyRoute);
app.use("/api/reels", reelRoutes); 

// নতুন মার্কেটপ্লেস এবং অ্যাডমিন API
app.use("/api/market", marketRoutes); 
app.use("/api/admin", adminRoutes); 

app.use("/api/messages", checkJwt, messageRoutes); 
app.use("/api/groups", checkJwt, groupRoutes); 

app.get("/", (req, res) => res.send("🚀 OnyxDrift Neural Core is Online!"));

/* ==========================================================
    📡 REAL-TIME ENGINE (Socket.io)
========================================================== */

io.on("connection", (socket) => {
    
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

    // --- নোটিফিকেশন লজিক (মার্কেটপ্লেস ও পেমেন্টের জন্য) ---
    socket.on("sendNotification", (data) => {
        const { receiverId, message, type } = data;
        io.to(receiverId).emit("getNotification", {
            senderName: data.senderName,
            type: type,
            message: message,
            image: data.image
        });
    });

    socket.on("joinGroup", (groupId) => {
        socket.join(groupId);
    });

    /* ==========================================================
        📞 কলিং ইঞ্জিন (P2P & Group)
    ========================================================== */
    socket.on("initiateCall", (data) => {
        const { roomId, receiverId, callerName, type } = data;
        if (receiverId) {
            io.to(receiverId).emit("incomingCall", {
                roomId,
                callerName,
                from: socket.userId,
                type: type || "video"
            });
        }
    });

    socket.on("answerCall", (data) => {
        if (data.to) {
            io.to(data.to).emit("callAccepted", data.signal);
        }
    });

    socket.on("endCall", (data) => {
        if (data.to) {
            io.to(data.to).emit("callEnded");
        }
    });

    socket.on("joinGroupCall", (data) => {
        const { groupId, userId } = data;
        const callRoom = `call_${groupId}`;
        socket.join(callRoom);
        socket.to(callRoom).emit("userJoinedCall", { 
            userId: userId || socket.userId, 
            socketId: socket.id 
        });
    });

    // --- ডিসকানেকশন ---
    socket.on("disconnect", async () => {
        if (redis && socket.userId) {
            await redis.hdel("online_users", socket.userId);
            const updated = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(updated).map(id => ({ userId: id })));
        }
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Core Active on Port: ${PORT}`);
});