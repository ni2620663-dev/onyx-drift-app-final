import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// --- ১. প্রোফাইল আপডেট বা তৈরি করা (Fixes 404 update-profile) ---
router.put("/update-profile", auth, async (req, res) => {
  try {
    const { name, avatar, bio, workplace, location, email } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: req.user.id }, // auth middleware থেকে আসা id
      { 
        $set: { 
          name, 
          avatar, 
          bio, 
          workplace, 
          location, 
          email 
        } 
      },
      { new: true, upsert: true } // ইউজার না থাকলে তৈরি করবে
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("Profile Update Error:", err.message);
    res.status(500).send("Server Error");
  }
});

// --- ২. ইউজার আইডি দিয়ে প্রোফাইল গেট করা ---
router.get('/:id', auth, async (req, res) => {
  try {
    // এখানে id বলতে Auth0 sub আইডি বোঝানো হচ্ছে
    const user = await User.findOne({ auth0Id: req.params.id });
    
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Fetch Profile Error:', err.message);
    res.status(500).send('Server error');
  }
});

// --- ৩. ফলো ইউজার ---
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.user.id === req.params.id) return res.status(400).json({ msg: "Can't follow yourself" });

    const me = await User.findOne({ auth0Id: req.user.id });
    const other = await User.findOne({ auth0Id: req.params.id });

    if (!other || !me) return res.status(404).json({ msg: 'User not found' });

    if (other.followers.includes(req.user.id)) {
      return res.status(400).json({ msg: 'Already following' });
    }

    other.followers.push(req.user.id);
    me.following.push(req.params.id);

    await other.save();
    await me.save();
    
    res.json({ msg: 'Followed', followersCount: other.followers.length });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// --- ৪. আনফলো ইউজার ---
router.post('/:id/unfollow', auth, async (req, res) => {
  try {
    const me = await User.findOne({ auth0Id: req.user.id });
    const other = await User.findOne({ auth0Id: req.params.id });

    if (!other || !me) return res.status(404).json({ msg: 'User not found' });

    other.followers = other.followers.filter(id => id !== req.user.id);
    me.following = me.following.filter(id => id !== req.params.id);

    await other.save();
    await me.save();
    
    res.json({ msg: 'Unfollowed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

export default router;