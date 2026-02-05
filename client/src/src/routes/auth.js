// client/src/routes/auth.js - AUTHENTICATION ROUTER
import express from 'express';
// ✅ User মডেল ইমপোর্ট: routes/auth.js থেকে দুই ধাপ উপরে (../../) data_models/user.js
import User from '../../data_models/user.js'; 
// ✅ verifyAuth মিডলওয়্যার ইমপোর্ট: routes/auth.js থেকে দুই ধাপ উপরে AuthMiddleware/auth.js
import { verifyAuth } from '../../AuthMiddleware/auth.js'; 
import mongoose from 'mongoose';

const router = express.Router();

// =======================================================
// ১. /api/auth/register - ইউজার রেজিস্ট্রেশন
// এটি Firebase Auth টোকেন নিশ্চিত করার পরে চালানো উচিত (যদি আপনি frontend-এ তৈরি করেন)
// =======================================================
router.post('/register', async (req, res) => {
    const { displayName, email, password } = req.body;
    
    // সাধারণ ইনপুট যাচাই
    if (!displayName || !email || !password) {
        return res.status(400).json({ message: 'Display name, email, and password are required.' });
    }

    try {
        // ডেটাবেসে ইউজার আগে থেকে আছে কিনা পরীক্ষা
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists with this email address.' });
        }

        // নতুন ইউজার তৈরি (পাসওয়ার্ড এখানে সেভ করা হচ্ছে, তবে এটি অবশ্যই হ্যাস করা উচিত)
        const newUser = new User({
            displayName,
            email,
            // ⚠️ WARNING: Real applications must hash passwords (e.g., using bcrypt)
            password: password 
        });

        const savedUser = await newUser.save();

        // পাসওয়ার্ড ছাড়া ইউজার ডেটা রিটার্ন
        const userResponse = {
            id: savedUser._id,
            displayName: savedUser.displayName,
            email: savedUser.email,
            createdAt: savedUser.createdAt
        };

        res.status(201).json({ message: 'User registered successfully!', user: userResponse });

    } catch (error) {
        // Mongoose বা অন্যান্য সার্ভার ত্রুটি
        if (error.code === 11000) { // Duplicate key error code
            return res.status(409).json({ message: 'Email address already in use.' });
        }
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});


// =======================================================
// ২. /api/auth/me - ইউজার প্রোফাইল ডেটা লোড করা (Protected Route)
// verifyAuth মিডলওয়্যার দ্বারা সুরক্ষিত
// =======================================================
router.get('/me', verifyAuth, async (req, res) => {
    try {
        // req.user এ থাকা MongoDB ID ব্যবহার করে সম্পূর্ণ ইউজার ডেটা লোড
        const user = await User.findById(req.user.id).select('-password'); 
        
        if (!user) {
            return res.status(404).json({ message: 'User profile not found.' });
        }

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve user profile.', error: error.message });
    }
});


// =======================================================
// ৩. /api/auth/google/login (অথবা সমতুল্য)
// যদি আপনি Firebase বা অন্য Auth Provider ব্যবহার করেন, এই রুটটি আইডি টোকেন হ্যান্ডেল করবে
// (আপনার প্রজেক্টের সম্পূর্ণ লজিক এখানে না থাকলেও, এটি একটি প্লেসহোল্ডার)
// =======================================================
router.post('/login', async (req, res) => {
    // ⚠️ NOTE: এখানে সাধারণত Firebase ID token বা Passport.js সেশন হ্যান্ডেল করা হয়
    res.status(501).json({ message: 'Login functionality requires implementation of Firebase token verification or local strategy.' });
});



export default router;