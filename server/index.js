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

// ৪. বডি পার্সার লিমিট
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

/* ==========================================================
    🧠 NEURAL PULSE UPDATE MIDDLEWARE
    ইউজার যখনই কোনো এপিআই রিকোয়েস্ট করবে, তার Pulse আপডেট হবে।
========================================================== */
const updateNeuralPulse = async (req, res, next) => {
    // Auth0 payload চেক করা হচ্ছে (checkJwt মিডলওয়্যার থেকে আসে)
    const auth0Id = req.auth?.payload?.sub; 
    if (auth0Id) {
        try {
            await User.findOneAndUpdate(
                { auth0Id: auth0Id },
                { "deathSwitch.lastPulseTimestamp": new Date() }
            );
        } catch (err) {
            console.error("Pulse Update Failed:", err.message);
        }
    }
    next();
};

// ৫. সকেট আইও কনফিগারেশন
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    allowEIO3: true, 
    path: '/socket.io/', 
    connectTimeout: 45000,
    pingTimeout: 60000,   
    pingInterval: 25000
});

// ৬. Redis Setup
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    }
}) : null;

/* ==========================================================
    📡 এপিআই রাউটস (ইন্টিগ্রেটেড মিডলওয়্যার সহ)
========================================================== */
// এখানে checkJwt এবং updateNeuralPulse ব্যবহার করা হয়েছে সিকিউরিটির জন্য
app.use("/api/user", checkJwt, updateNeuralPulse, userRoutes);      
app.use("/api/posts", checkJwt, updateNeuralPulse, postRoutes);  
app.use("/api/profile", checkJwt, updateNeuralPulse, profileRoutes); 
app.use("/api/stories", checkJwt, updateNeuralPulse, storyRoute);
app.use("/api/reels", checkJwt, updateNeuralPulse, reelRoutes); 
app.use("/api/market", checkJwt, updateNeuralPulse, marketRoutes); 
app.use("/api/admin", checkJwt, updateNeuralPulse, adminRoutes); 
app.use("/api/messages", checkJwt, updateNeuralPulse, messageRoutes); 
app.use("/api/groups", checkJwt, updateNeuralPulse, groupRoutes); 

app.get("/", (req, res) => res.status(200).send("🚀 OnyxDrift Neural Core is Online!"));

/* ==========================================================
    💀 DEATH-SWITCH CRON JOB
========================================================== */
cron.schedule('0 0 * * *', async () => {
    try {
        const users = await User.find({ "deathSwitch.isActive": true, "deathSwitch.isTriggered": false });
        const now = new Date();
        for (let user of users) {
            if (!user.deathSwitch.lastPulseTimestamp) continue;
            
            const thresholdDate = new Date(user.deathSwitch.lastPulseTimestamp);
            thresholdDate.setMonth(thresholdDate.getMonth() + user.deathSwitch.inactivityThresholdMonths);
            
            if (now > thresholdDate) {
                user.deathSwitch.isTriggered = true;
                user.legacyProtocol.vaultStatus = 'RELEASED';
                await user.save();
                console.log(`💀 Vault Released for user: ${user.auth0Id}`);
            }
        }
    } catch (err) {
        console.error("Cron Job Error:", err);
    }
});

/* ==========================================================
    📡 REAL-TIME ENGINE (Socket.io)
========================================================== */
io.on("connection", (socket) => {
    console.log(`⚡ New Neural Link: ${socket.id}`);

    socket.on("addNewUser", async (auth0Id) => { 
        if (!auth0Id) return;
        socket.userId = auth0Id; 
        socket.join(auth0Id); 
        
        if (redis) {
            await redis.hset("online_users", auth0Id, socket.id);
            const allUsers = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
        }

        try {
            // সকেট কানেক্ট হলেও পালস আপডেট হবে
            await User.findOneAndUpdate(
                { auth0Id: auth0Id }, 
                { "deathSwitch.lastPulseTimestamp": new Date() }
            );
        } catch (e) {
            console.error("Socket Pulse Update Error:", e.message);
        }
    });

    socket.on("sendMessage", (data) => {
        const { receiverId, isGroup, conversationId } = data;
        if (isGroup) {
            socket.to(conversationId).emit("getMessage", data);
        } else if (receiverId) {
            io.to(receiverId).emit("getMessage", data);
        }
    });

    socket.on("disconnect", async () => {
        if (redis && socket.userId) {
            await redis.hdel("online_users", socket.userId);
            const updated = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(updated).map(id => ({ userId: id })));
        }
        console.log(`🔌 Link Severed: ${socket.id}`);
    });
});

// ৮. সার্ভার লিসেনিং
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =========================================
    🚀 ONYX CORE ACTIVE ON PORT: ${PORT}
    🌐 ENVIRONMENT: ${process.env.NODE_ENV || 'development'}
    🧠 NEURAL LINK: READY
    =========================================
    `);
});