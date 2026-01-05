const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); 
const User = require('../models/User'); // ইউজার মডেলটি প্রয়োজন
const { checkJwt } = require('../middleware/authMiddleware');

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
router.post('/', checkJwt, async (req, res) => {
    try {
        const { text, media, mediaType, authorName, authorAvatar, authorId } = req.body;
        if (authorId !== req.user.sub) {
            return res.status(403).json({ message: "Identity mismatch!" });
        }
        const newPost = new Post({ text, media, mediaType, authorName, authorAvatar, authorId });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(400).json({ message: "Post creation failed", error: err.message });
    }
});

// ৩. পোস্ট ডিলিট করা (Strictly Private)
router.delete('/:id', checkJwt, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.authorId !== req.user.sub) {
            return res.status(401).json({ message: "Unauthorized! You can only delete your own posts." });
        }
        await post.deleteOne();
        res.json({ message: "Post deleted successfully", postId: req.params.id });
    } catch (err) {
        res.status(500).json({ message: "Delete failed", error: err.message });
    }
});

// ৪. পোস্ট লাইক করা (Fix: 404 issue handle)
router.put('/:id/like', checkJwt, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const userId = req.user.sub;
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

// --- FRIEND SYSTEM LOGIC ---

// ৫. ফ্রেন্ড রিকোয়েস্ট পাঠানো (Send Friend Request)
router.post('/friend-request/:targetUserId', checkJwt, async (req, res) => {
    try {
        const senderId = req.user.sub;
        const { targetUserId } = req.params;

        if (senderId === targetUserId) return res.status(400).json({ msg: "You cannot add yourself" });

        const targetUser = await User.findOne({ auth0Id: targetUserId });
        if (!targetUser) return res.status(404).json({ msg: "User not found" });

        if (targetUser.friendRequests.includes(senderId)) {
            return res.status(400).json({ msg: "Request already sent" });
        }

        targetUser.friendRequests.push(senderId);
        await targetUser.save();
        res.json({ msg: "Friend Request Sent" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ৬. ফ্রেন্ড রিকোয়েস্ট এক্সেপ্ট করা (Accept Friend Request)
router.post('/friend-accept/:senderId', checkJwt, async (req, res) => {
    try {
        const receiverId = req.user.sub; // যে রিকোয়েস্ট এক্সেপ্ট করছে
        const senderId = req.params.senderId; // যে রিকোয়েস্ট পাঠিয়েছিল

        const receiver = await User.findOne({ auth0Id: receiverId });
        const sender = await User.findOne({ auth0Id: senderId });

        if (!receiver || !sender) return res.status(404).json({ msg: "User not found" });

        // ১. রিকোয়েস্ট লিস্ট থেকে রিমুভ করা
        receiver.friendRequests = receiver.friendRequests.filter(id => id !== senderId);

        // ২. দুজনের ফ্রেন্ড লিস্টে একে অপরকে অ্যাড করা
        if (!receiver.friends.includes(senderId)) {
            receiver.friends.push(senderId);
        }
        if (!sender.friends.includes(receiverId)) {
            sender.friends.push(receiverId);
        }

        await receiver.save();
        await sender.save();

        res.json({ msg: "Friend Request Accepted", friends: receiver.friends });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;