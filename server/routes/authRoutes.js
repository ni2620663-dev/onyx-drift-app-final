import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// নিশ্চিত করুন .env ফাইলে JWT_SECRET সেট করা আছে
const SECRET = process.env.JWT_SECRET || 'your_secret_key_onyxdrift';

// --- লগইন রাউট ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // পাসওয়ার্ডসহ ইউজার খুঁজে বের করা
        const user = await User.findOne({ username }).select('+password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // টোকেন জেনারেশন
        const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: '7d' });

        // স্পষ্টভাবে রেসপন্স পাঠানো
        return res.status(200).json({ 
            token: token, 
            user: { 
                id: user._id, 
                name: user.name, 
                username: user.username 
            } 
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// --- রেজিস্ট্রেশন রাউট ---
router.post('/register', async (req, res) => {
    try {
        const { name, email, username, password } = req.body;

        if (!name || !email || !username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({ 
            name, 
            email, 
            username, 
            password: hashedPassword 
        });

        const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: '7d' });

        return res.status(201).json({ 
            message: "Success", 
            token: token, 
            user: { 
                id: user._id, 
                name: user.name, 
                username: user.username 
            } 
        });
    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({ message: "Registration failed", error: error.message });
    }
});

export default router;