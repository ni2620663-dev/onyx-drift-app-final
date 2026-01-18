import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';
import axios from "axios"; 

// ১. কনফিগারেশন ও ডাটাবেস কানেকশন
dotenv.config();
import connectDB from "./config/db.js"; 
connectDB();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// ২. রাুট ইম্পোর্ট
import profileRoutes from "./src/routes/profile.js"; 
import postRoutes from "./routes/posts.js";
import userRoutes from './routes/users.js'; 
import messageRoutes from "./routes/messages.js";
import storyRoute from "./routes/stories.js";
import reelRoutes from "./routes/reels.js"; 

const app = express();
const server = http.createServer(app);

// ৩. CORS কনফিগারেশন
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

// মিডলওয়্যার (অর্ডার খুবই গুরুত্বপূর্ণ)
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ৪. সকেট আইও কনফিগারেশন
const io = new Server(server, {
    cors: corsOptions,
    transports: ['polling', 'websocket'], 
    allowEIO3: true, 
    pingTimeout: 60000,   
    pingInterval: 25000,  
    connectTimeout: 30000,
    maxHttpBufferSize: 1e8 
});

// ৫. Redis Setup (যদি থাকে)
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
        return Math.min(times * 50, 2000);
    }
}) : null;

/* ==========================================================
    📰 নিউজ ইঞ্জিন (Optional: যদি অ্যাপে আর না লাগে তবে ডিলিট করতে পারেন)
========================================================== */
app.get("/api/news", async (req, res) => {
    try {
        const apiKey = process.env.NEWS_API_KEY; 
        if (!apiKey) return res.status(500).json({ error: "News API Key missing" });

        const response = await axios.get(`https://gnews.io/api/v4/top-headlines?category=technology&lang=en&apikey=${apiKey}`);
        
        const formattedNews = response.data.articles.map((article, index) => ({
            _id: `news-${index}-${Date.now()}`,
            authorName: article.source.name || "Global News",
            authorAvatar: "https://cdn-icons-png.flaticon.com/512/21/21601.png", 
            isVerified: true,
            createdAt: article.publishedAt || new Date().toISOString(),
            text: article.title || "Neural Signal Received", 
            media: article.image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c",
            mediaType: "image",
            link: article.url,
            feedType: 'news' 
        }));

        res.json(formattedNews);
    } catch (error) {
        res.status(500).json({ error: "Failed to sync world news" });
    }
});

// ৬. এপিআই রাুটস
app.use("/api/user", userRoutes); 
app.use("/api/profile", profileRoutes); 
app.use("/api/posts", postRoutes); 
app.use("/api/messages", messageRoutes); 
app.use("/api/stories", storyRoute);
app.use("/api/reels", reelRoutes); 

app.get("/", (req, res) => res.send("🚀 OnyxDrift Neural Core is Online!"));

// ৭. গ্লোবাল এরর হ্যান্ডলার
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
    socket.on("addNewUser", async (userId) => {
        if (!userId) return;
        if (redis) {
            await redis.hset("online_users", userId, socket.id);
            const allUsers = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
        } else {
            socket.join(userId); 
        }
    });

    socket.on("sendMessage", async (data) => {
        const { receiverId } = data;
        if (redis) {
            const socketId = await redis.hget("online_users", receiverId);
            if (socketId) io.to(socketId).emit("getMessage", data);
        } else {
            io.to(receiverId).emit("getMessage", data);
        }
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
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Core Active on Port: ${PORT}`));