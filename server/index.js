import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { auth } from 'express-oauth2-jwt-bearer';
import helmet from 'helmet'; // সিকিউরিটি হেডার
import rateLimit from 'express-rate-limit'; // রিকোয়েস্ট লিমিটিং
import profileRoutes from "./src/routes/profile.js";
import { Server } from "socket.io";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- ১. সিকিউরিটি মিডলওয়্যার ---
app.use(helmet({
    contentSecurityPolicy: false, // React এর জন্য সাময়িকভাবে ফলস রাখা হয়েছে
}));

// আপনার সকেট কানেকশনের ভেতরে এটি যোগ করুন
io.on("connection", (socket) => {

  // ১-টু-১ কল ইনভাইট পাঠানো
  socket.on("sendCallInvite", ({ senderName, roomId, receiverId }) => {
    const user = getUser(receiverId); // আপনার অনলাইন ইউজার খুঁজে বের করার ফাংশন
    if (user) {
      io.to(user.socketId).emit("incomingCall", {
        senderName,
        roomId,
      });
    }
  });

  // কল রিজেক্ট করার লজিক (ঐচ্ছিক কিন্তু ভালো)
  socket.on("rejectCall", ({ receiverId }) => {
    const user = getUser(receiverId);
    if (user) {
      io.to(user.socketId).emit("callRejected");
    }
  });
});
// --- ২. রেট লিমিটিং (যাতে কেউ সার্ভার ডাউন করতে না পারে) ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // ১৫ মিনিট
    max: 100, // প্রতি আইপি থেকে ১০০টির বেশি রিকোয়েস্ট নয়
    message: "Too many requests, please try again later."
});
app.use("/api/", limiter);

// --- ৩. CORS কনফিগারেশন ---
const allowedOrigins = [
    'https://www.onyx-drift.com',
    'https://onyx-drift.com',
    'https://onyx-drift-app-final.onrender.com',
    'http://localhost:5173'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// --- ৪. Auth0 Middleware (JWT Check) ---
const jwtCheck = auth({
    audience: process.env.AUTH0_AUDIENCE || 'https://onyx-drift-api.com',
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-6d0nxccsaycctfl1.us.auth0.com/',
    tokenSigningAlg: 'RS256'
});

// --- ৫. API Routes ---
app.use("/api/profile", profileRoutes);

// --- ৬. Static Files (React Build) ---
const buildPath = path.join(__dirname, "../client/dist");
app.use(express.static(buildPath));

app.get("*", (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(buildPath, "index.html"));
    }
});

// --- ৭. Server Start ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🛡️ Security Middlewares enabled (Helmet, RateLimit)`);
});