import express from 'express';
import passport from 'passport';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// --- ১. কাস্টম রেজিস্ট্রেশন (Email/Password) ---
router.post('/register', async (req, res) => {
    try {
        const { name, email, username, password } = req.body;

        // সব ফিল্ড দেওয়া হয়েছে কি না চেক
        if (!name || !email || !username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // ইমেল বা ইউজারনেম দিয়ে অলরেডি কেউ আছে কি না চেক
        let userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: "User already exists with this email or username" });
        }

        // পাসওয়ার্ড হ্যাশ করা (নিরাপত্তার জন্য)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // নতুন ইউজার তৈরি
        const user = await User.create({
            name,
            email,
            username,
            password: hashedPassword
        });

        res.status(201).json({ message: "User registered successfully", userId: user._id });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
});

// --- ২. কাস্টম লগইন ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // গুরুত্বপূর্ণ: মডেলে select: false থাকায় এখানে .select('+password') যোগ করা হয়েছে
        const user = await User.findOne({ username }).select('+password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // পাসওয়ার্ড ম্যাচ করা
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
        res.status(500).json({ message: "Login server error", error: error.message });
    }
});

// --- ৩. গুগল লগইন ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: 'https://onyx-drift.com/login' }), 
    (req, res) => {
        res.redirect('https://onyx-drift.com/feed');
    }
);

// --- ৪. ফেসবুক লগইন ---
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback', 
    passport.authenticate('facebook', { failureRedirect: 'https://onyx-drift.com/login' }), 
    (req, res) => {
        res.redirect('https://onyx-drift.com/feed');
    }
);

// --- ৫. লগআউট ---
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('https://onyx-drift.com/');
    });
});

// --- ৬. বর্তমান ইউজারের তথ্য দেখা ---
router.get('/current_user', (req, res) => {
    res.send(req.user || null);
});

export default router;
