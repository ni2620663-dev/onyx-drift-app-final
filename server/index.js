import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import Redis from "ioredis";
import { v2 as cloudinary } from 'cloudinary';
import { auth } from 'express-oauth2-jwt-bearer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import passport from 'passport';
import './config/passport.js';

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

// DB
connectDB();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);

// Redis
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// 🔥 ✅ FIXED AUTH0 CONFIG
const checkJwt = auth({
  audience: 'https://onyx-drift-api',
  issuerBaseURL: 'https://dev-ds5qpkme1dcprm7y.us.auth0.com/',
  tokenSigningAlg: 'RS256'
});

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// CORS
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(passport.initialize());

// Upload folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// 🧠 Pulse middleware
const updateNeuralPulse = async (req, res, next) => {
  try {
    const auth0Id = req.auth?.payload?.sub;
    if (auth0Id) {
      await User.updateOne(
        { auth0Id },
        { $set: { "deathSwitch.lastPulseTimestamp": new Date() } }
      );
    }
  } catch (err) {
    console.error("Pulse update failed:", err.message);
  }
  next();
};

// 🌐 PUBLIC
app.get("/", (req, res) => {
  res.send("🚀 OnyxDrift Neural Core Online!");
});

app.use('/api/auth', authRoutes);

// 🔥 TEST ROUTE (VERY IMPORTANT)
app.get("/api/test-auth", checkJwt, (req, res) => {
  console.log("USER:", req.auth);
  res.json({
    message: "✅ Auth Working!",
    user: req.auth
  });
});

// 🔒 PROTECTED
app.use("/api/posts/neural-feed", checkJwt, updateNeuralPulse, getNeuralFeed);
app.use("/api/users", checkJwt, updateNeuralPulse, userRoutes);
app.use("/api/profile", checkJwt, updateNeuralPulse, profileRoutes);
app.use("/api/posts", checkJwt, updateNeuralPulse, postRoutes);
app.use("/api/reels", checkJwt, updateNeuralPulse, reelRoutes);
app.use("/api/stories", checkJwt, updateNeuralPulse, storyRoute);
app.use("/api/messages", checkJwt, updateNeuralPulse, messageRoutes);
app.use("/api/groups", checkJwt, updateNeuralPulse, groupRoutes);
app.use("/api/market", checkJwt, updateNeuralPulse, marketRoutes);
app.use("/api/admin", checkJwt, updateNeuralPulse, adminRoutes);

// Socket
const io = new Server(server, {
  cors: { origin: "*" }
});

// ❌ → 401 handler
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    console.log("❌ AUTH ERROR:", err.message);
    return res.status(401).json({
      error: "Neural Link Severed",
      message: err.message
    });
  }
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: "Grid Breakdown",
    message: err.message
  });
});

// Start
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  -----------------------------------------
  🚀 ONYX CORE ACTIVE ON PORT: ${PORT}
  🔗 STATUS: NEURAL FEED READY
  🛡️ AUTH: RS256 ENABLED
  -----------------------------------------
  `);
});