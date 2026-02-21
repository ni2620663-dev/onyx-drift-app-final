import express from 'express';
const router = express.Router();
import Post from '../models/Post.js'; 
import authMiddleware from '../middleware/authMiddleware.js';
import { GoogleGenerativeAI } from "@google/generative-ai"; 

// Gemini AI Config
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ==========================================================
    🧠 0. NEURAL FEED (Fix for Home Feed Error)
    এটি সবার উপরে রাখা হয়েছে যাতে অন্য ডাইনামিক রাউটের সাথে কনফ্লিক্ট না হয়।
========================================================== */
router.get('/neural-feed', async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .lean(); // পারফরম্যান্সের জন্য lean() ব্যবহার করা হয়েছে
        res.status(200).json(posts);
    } catch (err) {
        console.error("Neural Feed Error:", err);
        res.status(500).json({ message: "Neural Link Failure" });
    }
});

/* ==========================================================
    🤖 AI Analysis Route
========================================================== */
router.post("/ai-analyze", authMiddleware, async (req, res) => {
    const { text, authorName } = req.body;
    if (!text) return res.status(400).json({ analysis: "Signal is empty, drifter." });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            System: You are 'Onyx Neural Analyst', a witty, futuristic, and mysterious AI for the Onyx Drift social network.
            Task: Analyze the post signal from drifter '${authorName || 'Anonymous'}'.
            Post Content: "${text}"
            Requirement: Give a reaction in max 15-20 words. Use cyberpunk slang like 'choom', 'chrome', 'nova', 'flatlined'. 
            Be encouraging but maintain a cool AI persona.
        `;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ analysis: response.text() });
    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ analysis: "Neural Link unstable. Try later." });
    }
});

/* ==========================================================
    ১. সব রিলস গেট করা
========================================================== */
router.get('/reels/all', async (req, res) => {
    try {
        const reels = await Post.find({ 
            $or: [
                { postType: 'reels' }, 
                { mediaType: 'video' },
                { mediaType: 'reel' }
            ] 
        }).sort({ createdAt: -1 }).lean();
        res.json(reels);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch neural reels" });
    }
});

/* ==========================================================
    ২. সব পোস্ট গেট করা (Generic Feed)
========================================================== */
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).limit(100);
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

/* ==========================================================
    ৩. নির্দিষ্ট ইউজারের পোস্ট (Profile Fix)
========================================================== */
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const targetId = decodeURIComponent(req.params.userId);
        // প্রোফাইলে পোস্ট না আসার ইস্যু ঠিক করতে এখানে সব সম্ভাব্য ID ফিল্ড চেক করা হচ্ছে
        const posts = await Post.find({ 
            $or: [ 
                { authorId: targetId }, 
                { authorAuth0Id: targetId }, 
                { author: targetId },
                { userId: targetId }
            ] 
        }).sort({ createdAt: -1 }).lean();
        
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch user signals" });
    }
});

/* ==========================================================
    ৪. নতুন পোস্ট তৈরি (Matched with Frontend)
========================================================== */
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { text, content, media, mediaType, authorName, authorAvatar, isEncrypted, type } = req.body;
        const currentUserId = req.user.sub || req.user.id; 

        const newPost = new Post({ 
            text: text || content, 
            media, 
            mediaType: mediaType || type || 'photo', 
            authorName: authorName || req.user.name || "Drifter", 
            authorAvatar: authorAvatar || req.user.picture || "", 
            authorId: currentUserId,
            authorAuth0Id: currentUserId,
            author: currentUserId,
            isEncrypted: isEncrypted === true || isEncrypted === 'true',
            likes: [],
            comments: []
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        console.error("Post Creation Error:", err);
        res.status(400).json({ message: "Post creation failed" });
    }
});

/* ==========================================================
    ৫. পোস্ট লাইক / আনলাইক
========================================================== */
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const userId = req.user.sub || req.user.id;

        if (!Array.isArray(post.likes)) post.likes = [];

        if (post.likes.includes(userId)) {
            post.likes = post.likes.filter(id => id !== userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* ==========================================================
    ৬. কমেন্ট করা
========================================================== */
router.post('/:id/comment', authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: "Comment cannot be empty" });

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const newComment = {
            userId: req.user.sub || req.user.id,
            userName: req.user.name || "Anonymous Drifter",
            userAvatar: req.user.picture || "",
            text,
            createdAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: "Comment injection failed" });
    }
});



/* ==========================================================
    ৭. পোস্ট ডিলিট
========================================================== */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const currentUserId = req.user.sub || req.user.id;
        // চেক করা হচ্ছে ডিলিট রিকোয়েস্টকারীই পোস্টের মালিক কি না
        if (post.authorId !== currentUserId && post.authorAuth0Id !== currentUserId && post.author !== currentUserId) {
            return res.status(401).json({ message: "Unauthorized! This is not your signal." });
        }
        
        await post.deleteOne();
        res.json({ message: "Post terminated successfully", postId: req.params.id });
    } catch (err) {
        res.status(500).json({ message: "Delete failed" });
    }
});
const router = express.Router();

router.post("/:id/energy", auth, toggleEnergy);
router.post("/:id/comment", auth, addComment);

const express = require('express');
const router = express.Router();
const multer = require('multer');
const videoController = require('../controllers/videoController');

// ফাইল আপলোড কনফিগারেশন
const upload = multer({ dest: 'uploads/' });

// আপনার এডিটর থেকে এই রাউটে ডাটা আসবে
router.post('/process', upload.single('media'), videoController.processAndUploadVideo);



export default router;