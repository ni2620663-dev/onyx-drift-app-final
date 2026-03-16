import express from 'express';
import passport from 'passport';
import User from '../models/User.js'; // ইউজার মডেল ইমপোর্ট করা জরুরি
import bcrypt from 'bcryptjs'; // পাসওয়ার্ড এনক্রিপশনের জন্য

const router = express.Router();
router.get('/ping', (req, res) => res.send("Auth API is Online!"));

// --- ১. কাস্টম রেজিস্ট্রেশন (Email/Password) ---
// ফ্রন্টএন্ডের /api/auth/register এখান থেকে কাজ করবে
router.post('/register', async (req, res) => {
    try {
        const { name, email, username, password } = req.body;

        // ইউজার অলরেডি আছে কি না চেক করা
        let userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: "User already exists with this email or username" });
        }

        // নতুন ইউজার তৈরি
        const user = await User.create({
            name,
            email,
            username,
            password // আপনার User মডেলে অবশ্যই পাসওয়ার্ড হ্যাশ করার প্রি-সেভ হুক থাকতে হবে
        });

        res.status(201).json({ message: "User registered successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Server Error during registration", error: error.message });
    }
});

// --- ২. কাস্টম লগইন (Email/Password) ---
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // পাসওয়ার্ড চেক (যদি মডেলে matchPassword মেথড থাকে)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // এখানে আপনি সেশন বা JWT সেট করতে পারেন
        res.status(200).json({ message: "Login successful", user });
    } catch (error) {
        res.status(500).json({ message: "Server Error during login" });
    }
});

// --- ৩. গুগল লগইন শুরু ---
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: 'https://onyx-drift.com/login' }), 
    (req, res) => {
        // প্রোডাকশন ইউআরএল ব্যবহার করুন (localhost নয়)
        res.redirect('https://onyx-drift.com/feed'); 
    }
);

// --- ৪. ফেসবুক লগইন শুরু ---
router.get('/facebook', passport.authenticate('facebook', { 
    scope: ['email'] 
}));

router.get('/facebook/callback', 
    passport.authenticate('facebook', { failureRedirect: 'https://onyx-drift.com/login' }), 
    (req, res) => {
        res.redirect('https://onyx-drift.com/feed');
    }
);

// --- ৫. লগআউট (Logout) ---
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('https://onyx-drift.com/');
    });
});

// --- ৬. বর্তমান ইউজারের তথ্য চেক করা ---
router.get('/current_user', (req, res) => {
    res.send(req.user);
});

export default router;