import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';
import https from 'https';

// ১. কনফিগারেশন লোড (সবার আগে)
dotenv.config();

// ২. ডাটাবেস ও ক্লাউডিনারি কানেকশন (রাউট ইম্পোর্টের আগে হওয়া নিরাপদ)
import connectDB from "./config/db.js"; 
connectDB();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// ৩. রাউট ইম্পোর্ট
import profileRoutes from "./src/routes/profile.js"; 
import postRoutes from "./routes/posts.js";
import userRoutes from './routes/users.js'; 
import messageRoutes from "./routes/messages.js";

const app = express();
const server = http.createServer(app);

// ৪. CORS কনফিগারেশন
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
            callback(new Error('Signal Blocked: CORS Security Policy'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true })); // ফর্ম ডাটার জন্য যোগ করা হলো

// ৫. সকেট আইও কনফিগারেশন
const io = new Server(server, {
    cors: corsOptions,
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// ৬. Redis Setup
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 50, 2000),
}) : null;

// ৭. রাউট মাউন্টিং
app.use("/api/user", userRoutes); 
app.use("/api/profile", profileRoutes); 
app.use("/api/posts", postRoutes); 
app.use("/api/messages", messageRoutes); 

// ৮. Keep-Alive Mechanism
setInterval(() => {
    https.get('https://onyx-drift-app-final.onrender.com', (res) => {
        // Heartbeat pulse
    }).on('error', (err) => {
        console.log('Keep-alive ping failure');
    });
}, 840000);

// ৯. Global Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 SYSTEM_ERROR:", err.message);
    if (err.message === 'Signal Blocked: CORS Security Policy') {
        res.status(403).json({ error: "Access Denied: Neural link rejected" });
    } else {
        res.status(500).json({ error: "Internal Neural Breakdown", msg: err.message });
    }
});

/* ==========================================================
    📡 REAL-TIME ENGINE (Socket.io Logic)
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
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 OnyxDrift Core Active on Port: ${PORT}`));