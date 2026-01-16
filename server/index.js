import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';
import https from 'https';

// ১. কনফিগারেশন লোড
dotenv.config();

// ২. ডাটাবেস ও ক্লাউডিনারি কানেকশন
import connectDB from "./config/db.js"; 
connectDB();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// ৩. রাুট ইম্পোর্ট
import profileRoutes from "./src/routes/profile.js"; 
import postRoutes from "./routes/posts.js";
import userRoutes from './routes/users.js'; 
import messageRoutes from "./routes/messages.js";
import storyRoute from "./routes/stories.js";
import reelRoutes from "./routes/reels.js"; 

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
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("CORS blocked origin:", origin);
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

// ৫. সকেট আইও কনফিগারেশন
const io = new Server(server, {
    cors: corsOptions,
    transports: ['polling', 'websocket'], 
    allowEIO3: true, 
    pingTimeout: 60000,   
    pingInterval: 25000,  
    connectTimeout: 30000,
    maxHttpBufferSize: 1e8 
});

// ৬. Redis Setup
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
        return Math.min(times * 50, 2000);
    }
}) : null;

if (redis) {
    redis.on("error", (err) => console.log("Redis Connection Error:", err.message));
}

// ৭. এপিআই রাুট মাউন্টিং
app.use("/api/user", userRoutes); 
app.use("/api/profile", profileRoutes); 
app.use("/api/posts", postRoutes); 
app.use("/api/messages", messageRoutes); 
app.use("/api/stories", storyRoute);
app.use("/api/reels", reelRoutes); 

// ৮. রুট এন্ডপয়েন্ট চেক
app.get("/", (req, res) => {
    res.send("🚀 OnyxDrift Neural Core is Online!");
});

// ৯. Keep-Alive Mechanism (Self-Ping)
setInterval(() => {
    https.get('https://onyx-drift-app-final.onrender.com', (res) => {
        // Active
    }).on('error', (err) => console.log('Keep-alive ping failure'));
}, 600000); 

// ১০. গ্লোবাল এরর হ্যান্ডলার
app.use((err, req, res, next) => {
    console.error("🔥 SYSTEM_ERROR:", err.stack);
    res.status(err.status || 500).json({ 
        error: "Internal Neural Breakdown", 
        message: err.message 
    });
});

/* ==========================================================
    📡 REAL-TIME ENGINE (Socket.io)
========================================================== */
io.on("connection", (socket) => {
    console.log("Connected to Neural Socket:", socket.id);

    // ইউজার রেজিস্টার করা
    socket.on("addNewUser", async (userId) => {
        if (userId) {
            if (redis) {
                await redis.hset("online_users", userId, socket.id);
                const allUsers = await redis.hgetall("online_users");
                io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
            } else {
                socket.join(userId); 
            }
            console.log(`Node Active: ${userId}`);
        }
    });

    // মেসেজ পাঠানো
    socket.on("sendMessage", async (data) => {
        const { receiverId } = data;
        if (redis) {
            const socketId = await redis.hget("online_users", receiverId);
            if (socketId) io.to(socketId).emit("getMessage", data);
        } else {
            io.to(receiverId).emit("getMessage", data);
        }
    });

    // কল রিকোয়েস্ট পাঠানো
    socket.on("sendCallRequest", async (data) => {
        const { receiverId, senderName, roomId, senderId } = data;
        const callPayload = {
            senderName,
            roomId,
            senderId
        };

        if (redis) {
            const socketId = await redis.hget("online_users", receiverId);
            if (socketId) {
                io.to(socketId).emit("incomingCall", callPayload);
            }
        } else {
            io.to(receiverId).emit("incomingCall", callPayload);
        }
    });

    // কল রিজেক্ট করা (Optional: যদি আপনি ফ্রন্টএন্ডে এটি হ্যান্ডেল করতে চান)
    socket.on("rejectCall", async ({ receiverId }) => {
        if (redis) {
            const socketId = await redis.hget("online_users", receiverId);
            if (socketId) io.to(socketId).emit("callRejected");
        } else {
            io.to(receiverId).emit("callRejected");
        }
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
        console.log("Drifter disconnected from Socket");
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Core Active on Port: ${PORT}`));