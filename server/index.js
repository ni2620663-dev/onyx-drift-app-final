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

// ৪. CORS কনফিগারেশন (উন্নত করা হয়েছে)
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

// ৫. সকেট আইও কনফিগারেশন (Transports অগ্রাধিকার ঠিক করা হয়েছে)
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling']
});

// ৬. Redis Setup (Error Handling সহ)
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
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

// ৯. Keep-Alive Mechanism
setInterval(() => {
    https.get('https://onyx-drift-app-final.onrender.com', (res) => {
        // Ping success
    }).on('error', (err) => console.log('Keep-alive ping failure'));
}, 840000); 

// ১০. উন্নত গ্লোবাল এরর হ্যান্ডলার
app.use((err, req, res, next) => {
    console.error("🔥 SYSTEM_ERROR:", err.stack);
    res.status(err.status || 500).json({ 
        error: "Internal Neural Breakdown", 
        message: err.message 
    });
});

/* ==========================================================
    📡 REAL-TIME ENGINE (Socket.io) - Fixed Logic
========================================================== */
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // ইউজার অনলাইন হলে রেজিস্টার করা
    socket.on("addNewUser", async (userId) => {
        if (userId) {
            if (redis) {
                await redis.hset("online_users", userId, socket.id);
                const allUsers = await redis.hgetall("online_users");
                io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
            } else {
                // Redis না থাকলে ইন-মেমোরি ব্যাকআপ (Optional)
                socket.join(userId); 
            }
        }
    });

    // টেক্সট মেসেজ হ্যান্ডলার
    socket.on("sendMessage", async (data) => {
        const { receiverId } = data;
        if (redis) {
            const socketId = await redis.hget("online_users", receiverId);
            if (socketId) io.to(socketId).emit("getMessage", data);
        } else {
            socket.to(receiverId).emit("getMessage", data);
        }
    });

    // ভিডিও কল রিকোয়েস্ট হ্যান্ডলার (Fixed Naming for Frontend)
    socket.on("sendCallRequest", async (data) => {
        const { receiverId, senderName, roomId } = data;
        
        let socketId = null;
        if (redis) {
            socketId = await redis.hget("online_users", receiverId);
        }

        if (socketId) {
            // ফ্রন্টএন্ড 'callerName' আশা করছে, তাই সেটাই পাঠানো হচ্ছে
            io.to(socketId).emit("incomingCall", {
                callerName: senderName, 
                roomId: roomId
            });
            console.log(`Call forwarded to: ${receiverId}`);
        } else {
            console.log(`User ${receiverId} is offline. Call failed.`);
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
        console.log("User disconnected");
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Core Active on Port: ${PORT}`));