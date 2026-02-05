import express from 'express';
import Post from '../data_models/post.js'; 
import { verifyAuth } from '../../AuthMiddleware/auth.js';

const router = express.Router();

// ১. সব পোস্ট গেট করা (ফিড)
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ২. নতুন পোস্ট তৈরি
router.post('/', verifyAuth, async (req, res) => {
    try {
        const newPost = new Post({
            userId: req.user.sub, // Auth0 থেকে আসা আইডি
            userName: req.body.userName,
            userAvatar: req.body.userAvatar,
            content: req.body.content,
            image: req.body.image || ""
        });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ৩. লাইক বা আনলাইক করা
router.put('/:postId/like', verifyAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json("Post not found");

        if (!post.likes.includes(req.user.sub)) {
            await post.updateOne({ $push: { likes: req.user.sub } });
            res.status(200).json("Liked");
        } else {
            await post.updateOne({ $pull: { likes: req.user.sub } });
            res.status(200).json("Unliked");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// ৪. কমেন্ট করা (নতুন যোগ করা হয়েছে)
router.post('/:postId/comment', verifyAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json("Post not found");

        const newComment = {
            userId: req.user.sub,
            userName: req.body.userName || "Anonymous", // ফ্রন্টএন্ড থেকে পাঠানো নাম
            userAvatar: req.body.userAvatar || "",      // ফ্রন্টএন্ড থেকে পাঠানো ইমেজ
            text: req.body.text,
            createdAt: new Date()
        };

        await post.updateOne({ $push: { comments: newComment } });
        res.status(200).json("Comment added");
    } catch (err) {
        res.status(500).json(err);
    }
});

// ৫. পোস্ট ডিলিট করা (নতুন যোগ করা হয়েছে)
router.delete('/:postId', verifyAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json("Post not found");

        // চেক করা হচ্ছে যে ইউজার তার নিজের পোস্ট ডিলিট করছে কিনা
        if (post.userId === req.user.sub) {
            await post.deleteOne();
            res.status(200).json("Post deleted successfully");
        } else {
            res.status(403).json("You can only delete your own posts");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;