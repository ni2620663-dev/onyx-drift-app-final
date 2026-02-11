import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';
import { auth } from 'express-oauth2-jwt-bearer';
import cron from 'node-cron';

// ১. কনফিগারেশন ও ডাটাবেস কানেকশন
dotenv.config();
import connectDB from "./config/db.js"; 
import User from "./models/User.js"; 
connectDB();

// ২. রাউট ইম্পোর্ট
import userRoutes from './routes/user.js'; 
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import storyRoute from "./routes/stories.js";
import reelRoutes from "./routes/reels.js"; 
import profileRoutes from "./routes/profile.js"; 
import groupRoutes from "./routes/group.js"; 
import marketRoutes from "./routes/market.js"; 
import adminRoutes from "./routes/admin.js";      
import { getNeuralFeed } from "./controllers/feedController.js";

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

// ৩. CORS কনফিগারেশন (Refined)
const allowedOrigins = [
    "http://localhost:5173", 
    "https://onyx-drift-app-final.onrender.com",
    "https://onyx-drift-app-final-u29m.onrender.com",
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

// ৪. বডি পার্সার
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

/* ==========================================================
    🧠 NEURAL PULSE & SYNC MIDDLEWARE
========================================================== */
const updateNeuralPulse = async (req, res, next) => {
    const auth0Id = req.auth?.payload?.sub; 
    if (auth0Id) {
        try {
            // ইউজারের শেষ অ্যাক্টিভিটি আপডেট করা (Digital Legacy-র জন্য জরুরি)
            await User.updateOne(
                { auth0Id: auth0Id },
                { $set: { "deathSwitch.lastPulseTimestamp": new Date() } }
            );
        } catch (err) {
            console.log("Pulse background bypass");
        }
    }
    next();
};

// ৫. সকেট আইও কনফিগারেশন
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    path: '/socket.io/'
});

// ৬. Redis কানেকশন (With Error Handling)
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
}) : null;

if (redis) {
    redis.on("error", (err) => console.error("Redis Grid Error:", err));
    redis.on("connect", () => console.log("📡 Neural Cache Connected (Redis)"));
}

/* ==========================================================
    ⏰ CRON JOBS (Digital Legacy & Maintenance)
========================================================== */
// প্রতি ২৪ ঘণ্টায় একবার রান হবে ইউজারের পালস চেক করতে
cron.schedule('0 0 * * *', async () => {
    console.log("Running Neural Pulse Audit...");
    // এখানে আপনার Legacy Logic (যেমন: ৩ মাস ইনঅ্যাক্টিভ থাকলে অটো-পোস্ট বা মেসেজ পাঠানো) লিখতে পারেন।
});

/* ==========================================================
    📡 এপিআই রাউটস
========================================================== */



// পাবলিক বেস রাউট
app.get("/", (req, res) => res.status(200).send("🚀 OnyxDrift Neural Core is Online!"));

// 🛠️ Neural Feed - এটাকে একদম প্রথমে রাখুন কনফ্লিক্ট এড়াতে
app.get("/api/posts/neural-feed", checkJwt, updateNeuralPulse, getNeuralFeed);

// 🛠️ Feature Routes
app.use("/api/users", checkJwt, updateNeuralPulse, userRoutes);
app.use("/api/profile", checkJwt, updateNeuralPulse, profileRoutes);
app.use("/api/posts", checkJwt, updateNeuralPulse, postRoutes); 
app.use("/api/reels", checkJwt, updateNeuralPulse, reelRoutes); 
app.use("/api/stories", checkJwt, updateNeuralPulse, storyRoute);
app.use("/api/messages", checkJwt, updateNeuralPulse, messageRoutes); 
app.use("/api/groups", checkJwt, updateNeuralPulse, groupRoutes); 
app.use("/api/market", checkJwt, updateNeuralPulse, marketRoutes);
app.use("/api/admin", checkJwt, updateNeuralPulse, adminRoutes);

/* ==========================================================
    📡 REAL-TIME ENGINE (Socket.io)
========================================================== */
io.on("connection", (socket) => {
    socket.on("addNewUser", async (auth0Id) => { 
        if (!auth0Id) return;
        socket.userId = auth0Id; 
        socket.join(auth0Id); 
        
        if (redis) {
            await redis.hset("online_users", auth0Id, socket.id);
            const allUsers = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
        }
    });

    socket.on("disconnect", async () => {
        if (redis && socket.userId) {
            await redis.hdel("online_users", socket.userId);
            const allUsers = await redis.hgetall("online_users");
            // ইউজার অফলাইন হলে বাকিদের জানানো
            io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
        }
    });
});

/* ==========================================================
    🛡️ GLOBAL ERROR HANDLER
========================================================== */
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Identity Verification Failed', message: "Please Login Again" });
    }
    console.error("Critical Error:", err.stack);
    res.status(500).json({ 
        error: "Neural Grid Breakdown", 
        message: err.message 
    });
});

/* ==========================================================
    🚀 SERVER START
========================================================== */
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =========================================
    🚀 ONYX CORE ACTIVE ON PORT: ${PORT}
    🧠 NEURAL SYNC: ENABLED
    📡 DATABASE: CONNECTED
    =========================================
    `);
});