import express from 'express';
import auth from '../middleware/auth.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// Create post
router.post('/', auth, async (req, res) => {
  const { text, media } = req.body || {};
  try {
    const post = new Post({ author: req.user.id, text: text || '', media: media || null });
    await post.save();
    await post.populate('author', 'name avatar');
    res.json(post);
  } catch (err) {
    console.error('posts.create:', err);
    res.status(500).send('Server error');
  }
});

// Get timeline
router.get('/', auth, async (req, res) => {
  const { feed } = req.query;
  try {
    let query = {};
    if (feed === 'personal') {
      const me = await User.findById(req.user.id);
      query = { author: { $in: [...me.following, me.id] } };
    }
    const posts = await Post.find(query)
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(posts);
  } catch (err) {
    console.error('posts.getTimeline:', err);
    res.status(500).send('Server error');
  }
});

// Get single post
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ msg: 'Invalid id' });
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar');
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error('posts.get:', err);
    res.status(500).send('Server error');
  }
});

// Update post
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    if (post.author.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not allowed' });

    const { text, media } = req.body || {};
    if (text !== undefined) post.text = text;
    if (media !== undefined) post.media = media;
    await post.save();
    res.json(post);
  } catch (err) {
    console.error('posts.update:', err);
    res.status(500).send('Server error');
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    if (post.author.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not allowed' });
    await post.remove();
    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error('posts.delete:', err);
    res.status(500).send('Server error');
  }
});

// Like/unlike
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    const liked = post.likes.some((u) => u.toString() === req.user.id);
    if (liked) {
      post.likes = post.likes.filter((u) => u.toString() !== req.user.id);
      await post.save();
      return res.json({ msg: 'Unliked', likesCount: post.likes.length });
    } else {
      post.likes.push(req.user.id);
      await post.save();
      return res.json({ msg: 'Liked', likesCount: post.likes.length });
    }
  } catch (err) {
    console.error('posts.like:', err);
    res.status(500).send('Server error');
  }
});

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ msg: 'Comment text required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    const comment = { author: req.user.id, text };
    post.comments.push(comment);
    await post.save();
    await post.populate('comments.author', 'name avatar');
    res.json(post.comments[post.comments.length - 1]);
  } catch (err) {
    console.error('posts.addComment:', err);
    res.status(500).send('Server error');
  }
});

// Reply to a comment
router.post('/:postId/comments/:commentId/reply', auth, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ msg: 'Reply text required' });
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });
    const reply = { author: req.user.id, text };
    comment.replies = comment.replies || [];
    comment.replies.push(reply);
    await post.save();
    await post.populate('comments.author comments.replies.author', 'name avatar');
    res.json(comment);
  } catch (err) {
    console.error('posts.reply:', err);
    res.status(500).send('Server error');
  }
});

export default router;
