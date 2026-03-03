import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';
import { auth } from 'express-oauth2-jwt-bearer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ১. কনফিগারেশন ও ডাটাবেস কানেকশন
dotenv.config();
import connectDB from "./config/db.js"; 
import User from "./models/User.js"; 
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  audience: 'https://onyx-drift-api.com', 
  issuerBaseURL: 'https://dev-prxn6v2o08xp5loz.us.auth0.com/', 
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
        // origin না থাকলে (যেমন মোবাইল অ্যাপ বা সার্ভার-টু-সার্ভার) বা লিস্টে থাকলে অ্যালাউ করবে
        if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
            callback(null, true);
        } else {
            callback(new Error('Signal Blocked: CORS Security Policy'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

/* ==========================================================
    🧠 NEURAL PULSE (User Activity Sync)
========================================================== */
const updateNeuralPulse = async (req, res, next) => {
    try {
        const auth0Id = req.auth?.payload?.sub; 
        if (auth0Id) {
            // await করার দরকার নেই যাতে API রেসপন্স স্লো না হয়
            User.updateOne(
                { auth0Id: auth0Id },
                { $set: { "deathSwitch.lastPulseTimestamp": new Date() } }
            ).catch(() => {});
        }
    } catch (err) {}
    next();
};

/* ==========================================================
    📡 API ROUTES
========================================================== */
app.get("/", (req, res) => res.status(200).send("🚀 OnyxDrift Neural Core Online!"));

// রাউটগুলো ডিফাইন করার সময় সঠিক মিডলওয়্যার সিকোয়েন্স নিশ্চিত করা হয়েছে
app.get("/api/posts/neural-feed", checkJwt, updateNeuralPulse, getNeuralFeed);
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
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
    path: '/socket.io/'
});

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
const roomUsers = {}; 
const userSocketMap = {}; 



io.on("connection", (socket) => {
    
    // ১. নিজের সকেট আইডি ক্লায়েন্টকে জানানো
    socket.emit("me", socket.id);

    // ২. অনলাইন ইউজার হ্যান্ডলিং
    socket.on("addNewUser", async (auth0Id) => { 
        if (!auth0Id) return;
        socket.userId = auth0Id; 
        userSocketMap[auth0Id] = socket.id; 
        socket.join(auth0Id); 
        
        try {
            if (redis) {
                await redis.hset("online_users", auth0Id, socket.id);
                const allUsers = await redis.hgetall("online_users");
                io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
            }
        } catch (e) { console.error("Redis Sync Error"); }
        
        console.log(`User Linked: ${auth0Id} as ${socket.id}`);
    });

    /* --- 📞 CALL SIGNALS --- */
    socket.on("callUser", (data) => {
        const recipientSocketId = userSocketMap[data.userToCall];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("incomingCall", { 
                signal: data.signalData, 
                from: socket.id, 
                name: data.name, 
                pic: data.pic, 
                type: data.type 
            });
        }
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });

    socket.on("endCall", (data) => {
        const target = userSocketMap[data.to] || data.to;
        io.to(target).emit("callEnded");
    });

    /* --- 💬 MESSAGE & TYPING --- */
    socket.on("sendMessage", (message) => {
        if (message.receiverId) {
            // receiverId যদি Auth0 ID হয় তবে তাকে রুমে পাঠানো হচ্ছে
            io.to(message.receiverId).emit("getMessage", message);
        }
    });

    /* --- 👥 GROUP CALLING --- */
    socket.on("join-room", (payload) => {
        const { roomId } = payload;
        socket.roomId = roomId;
        socket.join(roomId); // Socket.io এর নেটিভ রুম ফাংশন ব্যবহার
        if (roomUsers[roomId]) roomUsers[roomId].push(socket.id);
        else roomUsers[roomId] = [socket.id];
        
        const otherUsersInRoom = roomUsers[roomId].filter(id => id !== socket.id);
        socket.emit("all-users", otherUsersInRoom);
    });

    socket.on("disconnect", async () => {
        if (socket.userId) {
            delete userSocketMap[socket.userId]; 
            socket.broadcast.emit("callEnded");
        }

        const roomId = socket.roomId;
        if (roomId && roomUsers[roomId]) {
            roomUsers[roomId] = roomUsers[roomId].filter(id => id !== socket.id);
            socket.to(roomId).emit("user-left", socket.id);
        }

        try {
            if (redis && socket.userId) {
                await redis.hdel("online_users", socket.userId);
                const allUsers = await redis.hgetall("online_users");
                io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
            }
        } catch (e) {}
    });
});

/* ==========================================================
    🛡️ ERROR HANDLER & START
========================================================== */
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: "Neural Grid Breakdown", message: err.message });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ONYX CORE ACTIVE ON PORT: ${PORT}`);
});