import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose"; 
import { GoogleGenerativeAI } from "@google/generative-ai";

// ১. ডাটাবেস ও রাউট ইমপোর্ট
import connectDB from "./config/db.js"; 
import profileRoutes from "./src/routes/profile.js"; 
import postRoutes from "./routes/posts.js";
import usersRoutes from './routes/users.js'; 
import messageRoutes from "./routes/messages.js";   

dotenv.config();

const app = express();
const server = http.createServer(app);

// ২. AI কনফিগারেশন
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ৩. মিডলওয়্যার ও CORS ফিক্স
const allowedOrigins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173", 
    "https://onyx-drift-app-final.onrender.com",
    "https://www.onyx-drift.com",
    "https://onyx-drift.com"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("CORS Access Denied"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ৪. সকেট কনফিগারেশন (404 এরর ফিক্স করার জন্য)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  // SockJS এরর এড়াতে standard websocket আগে দেওয়া হয়েছে
  transports: ['websocket', 'polling'],
  allowEIO3: true // পুরোনো ক্লায়েন্ট সাপোর্ট করার জন্য
});

// ৫. ডাটাবেস কানেকশন ও ক্লিনআপ
connectDB();

mongoose.connection.once('open', async () => {
  try {
    const adminDb = mongoose.connection.db;
    const collections = await adminDb.listCollections({ name: 'users' }).toArray();
    
    if (collections.length > 0) {
      const indexes = await adminDb.collection('users').listIndexes().toArray();
      const hasEmailIndex = indexes.some(idx => idx.name === 'email_1');
      
      if (hasEmailIndex) {
        await adminDb.collection('users').dropIndex('email_1');
        console.log('✅ System: Old index dropped.');
      }
    }
    console.log('📡 System: Database Synced.');
  } catch (err) {
    console.log('ℹ️ System: Database is clean.');
  }
});

// ৬. এপিআই এন্ডপয়েন্টস
app.use("/api/profile", profileRoutes);
app.use("/api/user", usersRoutes); 
app.use("/api/posts", postRoutes); 

if (messageRoutes) {
    app.use("/api/messages", messageRoutes);
}

// AI Enhance Route
app.post("/api/ai/enhance", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No signal detected." });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `You are the AI of OnyxDrift. Rewrite this post to be aesthetic and cool. Max 2 sentences + 2 hashtags. Text: "${prompt}"`;

    const result = await model.generateContent(fullPrompt);
    res.json({ enhancedText: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: "AI Transmission Interrupted" });
  }
});

app.get("/", (req, res) => res.send("✅ OnyxDrift Neural Server Online"));

// ৭. সকেট লজিক (Real-time Drift)
let onlineUsers = []; 

io.on("connection", (socket) => {
  console.log(`📡 New Drift Node: ${socket.id}`);

  socket.on("addNewUser", (userId) => {
    if (userId && !onlineUsers.some(u => u.userId === userId)) {
      onlineUsers.push({ userId, socketId: socket.id });
    }
    io.emit("getOnlineUsers", onlineUsers);
  });

  socket.on("sendNewPost", (newPost) => {
    io.emit("receiveNewPost", newPost);
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });
});

// ৮. পোর্ট কনফিগারেশন
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 System Active on Port: ${PORT}`);
});