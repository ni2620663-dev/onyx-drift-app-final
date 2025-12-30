import express from 'express';
import Post from '../data_models/post.js'; 

const router = express.Router();

// ১. সব পোস্ট গেট করা
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ২. নতুন পোস্ট তৈরি
router.post('/', async (req, res) => {
    try {
        const newPost = new Post(req.body);
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ৩. লাইক হ্যান্ডলার (এটি যোগ করুন)
router.put('/:id/like', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const { userId } = req.body; // ফ্রন্টএন্ড থেকে ইউজার আইডি পাঠাতে হবে

        if (!post.likes.includes(userId)) {
            await post.updateOne({ $push: { likes: userId } });
            res.status(200).json("The post has been liked");
        } else {
            await post.updateOne({ $pull: { likes: userId } });
            res.status(200).json("The post has been disliked");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// ৪. কমেন্ট হ্যান্ডলার (এটি যোগ করুন)
router.post('/:id/comment', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const newComment = {
            userId: req.body.userId,
            userName: req.body.userName,
            userAvatar: req.body.userAvatar,
            text: req.body.text,
            createdAt: new Date()
        };
        post.comments.push(newComment);
        await post.save();
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json(err);
    }
});

// ৫. পোস্ট ডিলিট করা (এটি যোগ করুন)
router.delete('/:id', async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json("Post deleted successfully");
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;