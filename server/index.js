import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ১. ডাটাবেস কনফিগারেশন
import connectDB from "./config/db.js"; 

// ২. রাউট ইমপোর্ট
import profileRoutes from "./src/routes/profile.js"; 
import postRoutes from "./routes/posts.js";
import usersRoutes from './routes/users.js'; // নাম পরিবর্তন করে 'usersRoutes' করা হয়েছে
import messageRoutes from "./routes/messages.js";   

dotenv.config();

const app = express();
const server = http.createServer(app);

// ৩. AI কনফিগারেশন
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ৪. মিডলওয়্যার (CORS & JSON)
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
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ৫. সকেট কনফিগারেশন
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// ৬. ডাটাবেস কানেকশন
connectDB();

// ৭. এপিআই এন্ডপয়েন্টস মাউন্টিং
app.use("/api/profile", profileRoutes);
app.use("/api/user", usersRoutes); // এখানে সঠিক রাউটটি মাউন্ট করা হয়েছে
app.use("/api/posts", postRoutes); 
if (messageRoutes) {
    app.use("/api/messages", messageRoutes);
}

// --- AI Enhance Route ---
app.post("/api/ai/enhance", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No text provided" });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `You are the AI of a futuristic social media platform called OnyxDrift. 
    Rewrite the following user post to be more engaging, professional yet cool, and aesthetic. 
    Keep it concise (maximum 2-3 sentences) and add 2 relevant hashtags. 
    Original text: "${prompt}"`;

    const result = await model.generateContent(fullPrompt);
    const enhancedText = result.response.text();
    
    res.json({ enhancedText });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "AI processing failed" });
  }
});

// সার্ভার স্ট্যাটাস চেক
app.get("/", (req, res) => res.send("✅ OnyxDrift Neural Server is online..."));

// ৮. সকেট লজিক
let onlineUsers = []; 

io.on("connection", (socket) => {
  console.log(`📡 New Drift Connection: ${socket.id}`);

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

// ৯. সার্ভার লিসেন
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 OnyxDrift Server Live on Port: ${PORT}`);
});