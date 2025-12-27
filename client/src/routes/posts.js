import express from 'express';
import Post from '../data_models/post.js'; 
import { verifyAuth } from '../../AuthMiddleware/auth.js';

const router = express.Router();

// ----------------------------------------------------
// ১. সব পোস্ট নিয়ে আসা (Feed এর জন্য)
// GET /api/posts
// ----------------------------------------------------
router.get('/', async (req, res) => {
    try {
        // নতুন পোস্টগুলো সবার আগে দেখানোর জন্য sort({ createdAt: -1 })
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts", error: error.message });
    }
});

// ----------------------------------------------------
// ২. নতুন পোস্ট তৈরি করা (প্রমাণীকরণ প্রয়োজন)
// POST /api/posts
// ----------------------------------------------------
router.post('/', verifyAuth, async (req, res) => {
    try {
        const newPost = new Post({
            userId: req.user.sub, // Auth0 থেকে আসা অনন্য ID
            userName: req.body.userName,
            userAvatar: req.body.userAvatar,
            content: req.body.content,
            image: req.body.image || ""
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(500).json({ message: "Post creation failed", error: error.message });
    }
});

// ----------------------------------------------------
// ৩. পোস্টে লাইক বা আনলাইক করা
// PUT /api/posts/:postId/like
// ----------------------------------------------------
router.put('/:postId/like', verifyAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json("Post not found");

        // যদি ইউজার আগে লাইক না দিয়ে থাকে, তবে লাইক হবে
        if (!post.likes.includes(req.user.sub)) {
            await post.updateOne({ $push: { likes: req.user.sub } });
            res.status(200).json({ message: "The post has been liked", liked: true });
        } else {
            // আগে লাইক দেওয়া থাকলে এখন আনলাইক হবে
            await post.updateOne({ $pull: { likes: req.user.sub } });
            res.status(200).json({ message: "The post has been unliked", liked: false });
        }
    } catch (err) {
        res.status(500).json({ message: "Like action failed", error: err.message });
    }
});

// ----------------------------------------------------
// ৪. পোস্টে কমেন্ট করা
// POST /api/posts/:postId/comment
// ----------------------------------------------------
router.post('/:postId/comment', verifyAuth, async (req, res) => {
    try {
        const { text, userName, userAvatar } = req.body;
        
        if (!text) return res.status(400).json("Comment text is required");

        const comment = {
            userId: req.user.sub,
            userName: userName,
            userAvatar: userAvatar,
            text: text,
            createdAt: new Date()
        };

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.postId,
            { $push: { comments: comment } },
            { new: true } // আপডেট হওয়ার পর নতুন ডাটা রিটার্ন করবে
        );

        res.status(200).json(updatedPost);
    } catch (err) {
        res.status(500).json({ message: "Comment failed", error: err.message });
    }
});

// ----------------------------------------------------
// ৫. পোস্ট ডিলিট করা
// DELETE /api/posts/:postId
// ----------------------------------------------------
router.delete('/:postId', verifyAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json("Post not found");

        // শুধুমাত্র পোস্টের মালিক ডিলিট করতে পারবে
        if (post.userId === req.user.sub) {
            await post.deleteOne();
            res.status(200).json("Post deleted successfully");
        } else {
            res.status(403).json("You can only delete your own posts");
        }
    } catch (err) {
        res.status(500).json({ message: "Delete failed", error: err.message });
    }
});

export default router;