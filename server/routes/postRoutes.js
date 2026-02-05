import express from 'express';
const router = express.Router();
import Post from '../models/Post.js'; 
import authMiddleware from '../middleware/authMiddleware.js';
import { GoogleGenerativeAI } from "@google/generative-ai"; 

// Gemini Config
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ==========================================================
    🤖 AI Analysis Route
========================================================== */
router.post("/ai-analyze", authMiddleware, async (req, res) => {
    const { text, authorName } = req.body;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            System: You are 'Onyx Neural Analyst', a witty, futuristic, and mysterious AI for the Onyx Drift social network.
            Task: Analyze the post signal from drifter '${authorName}'.
            Post Content: "${text}"
            Requirement: Give a reaction in max 15-20 words. Use cyberpunk slang (e.g., neural, signal, drift, echo, cyber, uplink). 
            Be encouraging but maintain a cool AI persona.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiText = response.text();

        res.json({ analysis: aiText });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ analysis: "Neural Link unstable. Could not parse signal." });
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
                { mediaType: 'video' }
            ] 
        }).sort({ createdAt: -1 });
        
        res.json(reels);
    } catch (err) {
        console.error("Neural Reels Fetch Error:", err);
        res.status(500).json({ message: "Failed to fetch neural reels" });
    }
});

/* ==========================================================
    ২. সব পোস্ট গেট করা (Public Feed)
========================================================== */
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

/* ==========================================================
    ৩. নির্দিষ্ট ইউজারের পোস্ট গেট করা
========================================================== */
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const targetId = decodeURIComponent(req.params.userId);
        
        const posts = await Post.find({ 
            $or: [
                { authorId: targetId },
                { authorAuth0Id: targetId }
            ] 
        }).sort({ createdAt: -1 });

        res.json(posts);
    } catch (err) {
        console.error("Neural Fetch Error:", err);
        res.status(500).json({ message: "Failed to fetch user signals" });
    }
});

/* ==========================================================
    ৪. নতুন পোস্ট তৈরি করা (FIXED: Added '/create' path)
========================================================== */
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { text, media, mediaType, authorName, authorAvatar } = req.body;
        const currentUserId = req.user.sub || req.user.id; 

        const newPost = new Post({ 
            text, 
            media, 
            mediaType: mediaType || 'photo', 
            authorName, 
            authorAvatar, 
            authorId: currentUserId,
            authorAuth0Id: currentUserId,
            likes: [] 
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(400).json({ message: "Post creation failed", error: err.message });
    }
});

/* ==========================================================
    ৫. রিলস ভিডিও আপলোড করা
========================================================== */
router.post('/reels', authMiddleware, async (req, res) => {
    try {
        const { text, mediaUrl, authorName, authorAvatar } = req.body;
        const currentUserId = req.user.sub || req.user.id;

        const newReel = new Post({
            text,
            media: mediaUrl,
            mediaUrl: mediaUrl, 
            mediaType: 'video',
            postType: 'reels', 
            authorName,
            authorAvatar,
            authorId: currentUserId,
            authorAuth0Id: currentUserId,
            likes: []
        });

        const savedReel = await newReel.save();
        res.status(201).json(savedReel);
    } catch (err) {
        res.status(400).json({ message: "Reel transmission failed", error: err.message });
    }
});

/* ==========================================================
    ৬. পোস্ট লাইক করা
========================================================== */
router.put('/:id/like', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const userId = req.user.sub || req.user.id;

        if (!Array.isArray(post.likes)) {
            post.likes = [];
        }

        if (post.likes.includes(userId)) {
            post.likes = post.likes.filter(id => id !== userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();
        res.json(post);
    } catch (err) {
        console.error("Like Error:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
});

/* ==========================================================
    ৭. পোস্ট ডিলিট করা
========================================================== */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const currentUserId = req.user.sub || req.user.id;
        if (post.authorId !== currentUserId && post.authorAuth0Id !== currentUserId) {
            return res.status(401).json({ message: "Unauthorized!" });
        }
        
        await post.deleteOne();
        res.json({ message: "Post deleted successfully", postId: req.params.id });
    } catch (err) {
        res.status(500).json({ message: "Delete failed", error: err.message });
    }
});

export default router;