import 'dotenv/config'; 
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI; 

if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log("✅ MongoDB connected successfully!"))
        .catch(err => console.error("❌ MongoDB connection error:", err.message));
} else {
    console.warn("🔴 MONGO_URI not defined, running without DB");
}

const allowedOrigins = [
    'https://onyx-drift.com',
    'http://localhost:3000',
    'http://localhost:5173'
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Login API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (email === "test@example.com" && password === "123456") {
        return res.status(200).json({ 
            success: true,
            message: "Login successful (Dummy Test)",
            token: "fake_jwt_token_for_shakib"
        });
    } else if (email && password) {
        return res.status(401).json({ success: false, message: "Invalid credentials." });
    } else {
        return res.status(400).json({ success: false, message: "Email and password are required." });
    }
});

// Static files (optional)
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on port ${PORT}`));
