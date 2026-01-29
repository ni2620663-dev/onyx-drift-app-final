import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import Redis from "ioredis"; 
import { v2 as cloudinary } from 'cloudinary';
import { auth } from 'express-oauth2-jwt-bearer'; // <--- নতুন ইম্পোর্ট

// ১. কনফিগারেশন ও ডাটাবেস কানেকশন
dotenv.config();
import connectDB from "./config/db.js"; 
connectDB();

// 🛡️ Auth0 JWT ভেরিফিকেশন মিডলওয়্যার
// এটি নিশ্চিত করবে যে আপনার ফ্রন্টএন্ড থেকে পাঠানো টোকেনটি ভ্যালিড কি না
const checkJwt = auth({
  audience: 'https://onyx-drift-api.com', // আপনার Auth0 API Identifier
  issuerBaseURL: `https://dev-6d0nxccsaycctfl1.us.auth0.com/`, // আপনার Auth0 Domain
  tokenSigningAlg: 'RS256'
});

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// ২. রাউট ইম্পোর্ট
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
    "https://onyx-drift-app-final-u29m.onrender.com",
    "https://onyx-drift-app-final-llhhmwcfh-naimusshakib582-pixels-projects.vercel.app", 
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

// ৪. সকেট আইও কনফিগারেশন
const io = new Server(server, {
    cors: corsOptions,
    transports: ['polling', 'websocket'], 
    allowEIO3: true, 
    pingTimeout: 60000,   
    pingInterval: 25000
});

// ৫. Redis Setup
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
}) : null;

// এপিআই রাউটস
app.use("/api/user", userRoutes); 
app.use("/api/profile", profileRoutes); 
app.use("/api/posts", postRoutes); 

// 🚨 এখানে checkJwt যোগ করা হয়েছে যাতে মেসেজিং সুরক্ষিত থাকে
app.use("/api/messages", checkJwt, messageRoutes); 

app.use("/api/stories", storyRoute);
app.use("/api/reels", reelRoutes); 

app.get("/", (req, res) => res.send("🚀 OnyxDrift Neural Core is Online!"));

/* ==========================================================
    📡 REAL-TIME ENGINE (Socket.io)
========================================================== */
io.on("connection", (socket) => {
    
    socket.on("addNewUser", async (userId) => {
        if (!userId) return;
        socket.join(userId); 
        if (redis) {
            await redis.hset("online_users", userId, socket.id);
            const allUsers = await redis.hgetall("online_users");
            io.emit("getOnlineUsers", Object.keys(allUsers).map(id => ({ userId: id })));
        }
    });

    socket.on("sendMessage", async (data) => {
        const { receiverId, isGroup, members } = data;
        if (isGroup && members) {
            members.forEach(memberId => {
                if (memberId !== data.senderId) {
                    io.to(memberId).emit("getMessage", data);
                }
            });
        } else if (receiverId) {
            io.to(receiverId).emit("getMessage", data);
        }
    });

    socket.on("typing", (data) => {
        if (data.isGroup && data.members) {
            data.members.forEach(mId => {
                if (mId !== data.senderId) io.to(mId).emit("displayTyping", data);
            });
        } else if (data.receiverId) {
            io.to(data.receiverId).emit("displayTyping", data);
        }
    });

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("incomingCall", {
            signal: data.signalData,
            from: data.from,
            name: data.senderName,
            type: data.type,
            roomId: data.roomId
        });
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
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
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Core Active on Port: ${PORT}`);
});