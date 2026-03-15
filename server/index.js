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
import passport from 'passport';
import './config/passport.js'; // Passport Strategy Config

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
import authRoutes from './routes/authRoutes.js'; 

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// 1. Auth0 Config
const checkJwt = auth({
  audience: 'https://onyx-drift-api.com', 
  issuerBaseURL: 'https://dev-prxn6v2o08xp5loz.us.auth0.com/', 
  tokenSigningAlg: 'RS256'
});

// 2. Cloudinary & Passport Config
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

app.use(cors({
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
}));

app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Passport Middleware
app.use(passport.initialize());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// Middleware: Neural Pulse (Auth0 support)
const updateNeuralPulse = async (req, res, next) => {
    try {
        const auth0Id = req.auth?.payload?.sub; 
        if (auth0Id) {
            User.updateOne({ auth0Id: auth0Id }, { $set: { "deathSwitch.lastPulseTimestamp": new Date() } }).catch(() => {});
        }
    } catch (err) {}
    next();
};

// 📡 ROUTES
app.get("/", (req, res) => res.status(200).send("🚀 OnyxDrift Neural Core Online!"));

// Auth Routes (Google/Facebook Passport routes don't need checkJwt)
app.use('/api/auth', authRoutes); 

// Protected Routes (Require Auth0 JWT)
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

// 📡 REAL-TIME ENGINE
const io = new Server(server, { 
    cors: { origin: allowedOrigins, credentials: true }, 
    transports: ['websocket', 'polling'] 
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    socket.on("addNewUser", (userId) => {
        socket.userId = userId;
        socket.join(userId);
    });

    socket.on("disconnect", () => console.log("User disconnected"));
});

// Error Handler
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: "Neural Grid Breakdown", message: err.message });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 ONYX CORE ACTIVE ON PORT: ${PORT}`));