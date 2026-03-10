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

// ইমপোর্টস
import connectDB from "./config/db.js"; 
import User from "./models/User.js"; 
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
// মনে করে আপনার NeuralCore টি ইমপোর্ট করে নিন, নিচে উদাহরণ হিসেবে রাখা হলো
// import NeuralCore from "./services/NeuralCore.js"; 

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Auth0 & Cloudinary Config
const checkJwt = auth({
  audience: 'https://onyx-drift-api.com', 
  issuerBaseURL: 'https://dev-prxn6v2o08xp5loz.us.auth0.com/', 
  tokenSigningAlg: 'RS256'
});

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// CORS
const allowedOrigins = [
    "http://localhost:5173", 
    "https://onyx-drift-app-final.onrender.com",
    "https://onyx-drift-app-final-u29m.onrender.com",
    "https://www.onyx-drift.com",
    "https://onyx-drift.com"
];

const corsOptions = {
    origin: (origin, callback) => {
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
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// Middleware
const updateNeuralPulse = async (req, res, next) => {
    try {
        const auth0Id = req.auth?.payload?.sub; 
        if (auth0Id) {
            User.updateOne({ auth0Id: auth0Id }, { $set: { "deathSwitch.lastPulseTimestamp": new Date() } }).catch(() => {});
        }
    } catch (err) {}
    next();
};

// Routes
app.get("/", (req, res) => res.status(200).send("🚀 OnyxDrift Neural Core Online!"));
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

// 📡 SOCKET.IO LOGIC (সঠিক স্কোপিং)
const io = new Server(server, { cors: corsOptions, transports: ['websocket', 'polling'] });
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
const roomUsers = {}; 
const userSocketMap = {}; 

io.on("connection", (socket) => {
    socket.emit("me", socket.id);

    // ইউজার লিঙ্কিং
    socket.on("addNewUser", async (auth0Id) => { 
        if (!auth0Id) return;
        socket.userId = auth0Id; 
        userSocketMap[auth0Id] = socket.id; 
        socket.join(auth0Id); 
        console.log(`User Linked: ${auth0Id} as ${socket.id}`);
        // Redis logic here...
    });

    // 📞 কল হ্যান্ডলার
    socket.on("callUser", (data) => {
        const recipientSocketId = userSocketMap[data.userToCall];
        if (recipientSocketId) io.to(recipientSocketId).emit("incomingCall", { signal: data.signalData, from: socket.id, name: data.name, pic: data.pic, type: data.type });
    });

    socket.on("answerCall", (data) => io.to(data.to).emit("callAccepted", data.signal));
    socket.on("endCall", (data) => {
        const target = userSocketMap[data.to] || data.to;
        io.to(target).emit("callEnded");
    });

    // 💬 মেসেজ ও নিউরাল কমান্ড
    socket.on("sendMessage", (message) => {
        if (message.receiverId) io.to(message.receiverId).emit("getMessage", message);
    });

    // নিউরাল কমান্ড হ্যান্ডলার (AI Agent Logic)
    socket.on("neuralCommand", async (data) => {
        console.log(`Neural Command Received: ${data.action}`);
        
        // উদাহরণস্বরূপ NeuralCore প্রসেসিং
        // const aiDecision = await NeuralCore.process(data.action, { isWorking: true });
        // socket.emit("aiResponse", aiDecision);

        if (data.action === "LIKE_MESSAGE") {
            io.to(data.targetId).emit("neuralReaction", { type: "LIKE", from: socket.userId });
        }
    });

    // এআই সাজেশন ও অভ্যাস হ্যান্ডলার
    socket.on("analyzeHabits", async (auth0Id) => {
        // const habits = await NeuralCore.predictAction(auth0Id, "SCHEDULE_MEETING");
        // socket.emit("aiSuggestion", habits);
    });

    socket.on("getPersonalizedAdvice", async (auth0Id) => {
        // const advice = await NeuralCore.getSmartSuggestion(auth0Id);
        // socket.emit("aiSuggestion", advice);
    });

    // 👥 গ্রুপ কলিং
    socket.on("join-room", (payload) => {
        const { roomId } = payload;
        socket.roomId = roomId;
        socket.join(roomId);
        if (!roomUsers[roomId]) roomUsers[roomId] = [];
        roomUsers[roomId].push(socket.id);
        socket.emit("all-users", roomUsers[roomId].filter(id => id !== socket.id));
    });

    // ডিসকানেক্ট
    socket.on("disconnect", () => {
        if (socket.userId) delete userSocketMap[socket.userId];
        if (socket.roomId && roomUsers[socket.roomId]) {
            roomUsers[socket.roomId] = roomUsers[socket.roomId].filter(id => id !== socket.id);
            socket.to(socket.roomId).emit("user-left", socket.id);
        }
        console.log("User disconnected");
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: "Neural Grid Breakdown", message: err.message });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 ONYX CORE ACTIVE ON PORT: ${PORT}`));