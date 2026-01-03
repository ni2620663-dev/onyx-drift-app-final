import express from 'express';
import auth from '../middleware/auth.js'; 
import Post from '../models/Post.js';

const router = express.Router();

// --- ১. সব পোস্ট গেট করা (Global Feed) ---
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Fetch Error:', err.message);
    res.status(500).send('Server error');
  }
});

// --- ২. নির্দিষ্ট ইউজারের সব পোস্ট গেট করা (FIXES PROFILE 404 ERROR) ---
// এটি আপনার প্রোফাইল পেজের ৪MD৪ এররটি সমাধান করবে
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // এখানে userId হলো Auth0 সাব আইডি (google-oauth2|...) 
    // আমরা ডাটাবেসের 'author' ফিল্ডের সাথে এটি মেলাচ্ছি
    const posts = await Post.find({ author: req.params.userId }).sort({ createdAt: -1 });
    
    // যদি পোস্ট না থাকে তবে খালি অ্যারে পাঠাবে, এরর নয়
    res.json(posts || []); 
  } catch (err) {
    console.error('User Post Fetch Error:', err.message);
    res.status(500).send('Server error');
  }
});

// --- ৩. নতুন পোস্ট তৈরি করা ---
router.post('/create', auth, async (req, res) => {
  try {
    const { text, media, mediaType, authorName, authorAvatar } = req.body;

    const newPost = new Post({
      text,
      media,
      mediaType: mediaType || 'text',
      authorName,
      authorAvatar,
      author: req.user.id, // Auth0 থেকে আসা ইউনিক আইডি
      likes: [],
      comments: []
    });

    const post = await newPost.save();
    res.json(post);
  } catch (err) {
    console.error('Create Post Error:', err.message);
    res.status(500).json({ msg: 'Database save failed', error: err.message });
  }
});

// --- ৪. পোস্ট আপডেট/এডিট করা ---
router.put('/:id', auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    // Ownership Check
    if (post.author !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized to edit this post' });
    }

    const { text, media } = req.body;
    const updatedData = {};
    if (text) updatedData.text = text;
    if (media) updatedData.media = media;

    post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// --- ৫. পোস্ট ডিলিট করা ---
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    // Ownership Check
    if (post.author !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Post removed successfully' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// --- ৬. লাইক বা আনলাইক করা ---
router.put('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    const likeIndex = post.likes.indexOf(req.user.id);
    
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Like Error:', err.message);
    res.status(500).send('Server error');
  }
});

export default router;