const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); 
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware'); // আপনার কাস্টম মিডলওয়্যার

// ১. সব পোস্ট গেট করা (Public)
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

// ২. নতুন পোস্ট তৈরি করা (Private)
// এন্ডপয়েন্ট: POST /api/posts
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { text, media, mediaType, authorName, authorAvatar, authorId } = req.body;

        // আপনার authMiddleware এ সেট করা req.user.id এর সাথে চেক করা হচ্ছে
        if (authorId !== req.user.id) {
            return res.status(403).json({ message: "Identity mismatch! Access Denied." });
        }

        const newPost = new Post({ 
            text, 
            media, 
            mediaType, 
            authorName, 
            authorAvatar, 
            authorId 
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(400).json({ message: "Post creation failed", error: err.message });
    }
});

// ৩. পোস্ট ডিলিট করা
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.authorId !== req.user.id) {
            return res.status(401).json({ message: "Unauthorized! You can only delete your own posts." });
        }
        await post.deleteOne();
        res.json({ message: "Post deleted successfully", postId: req.params.id });
    } catch (err) {
        res.status(500).json({ message: "Delete failed", error: err.message });
    }
});

// ৪. পোস্ট লাইক করা
router.put('/:id/like', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const userId = req.user.id;
        if (post.likes.includes(userId)) {
            post.likes = post.likes.filter(id => id !== userId);
        } else {
            post.likes.push(userId);
        }
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;