import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// --- লগইন রাউট (POST /api/auth/login) ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // গুরুত্বপূর্ণ: মডেলে select: false থাকায় এখানে .select('+password') যোগ করা হয়েছে
        const user = await User.findOne({ username }).select('+password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // পাসওয়ার্ড চেক করা
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.status(200).json({ 
            message: "Login successful", 
            user: { id: user._id, name: user.name, username: user.username } 
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login", error: error.message });
    }
});

// --- রেজিস্ট্রেশন রাউট (POST /api/auth/register) ---
router.post('/register', async (req, res) => {
    try {
        const { name, email, username, password } = req.body;

        if (!name || !email || !username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        let userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({ name, email, username, password: hashedPassword });

        res.status(201).json({ message: "Success", userId: user._id });
    } catch (error) {
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
});

export default router;
