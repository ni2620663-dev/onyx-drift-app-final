// server/routes/users.js
import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
// Example Route (Express.js)
router.put("/profile/update", checkJwt, async (req, res) => {
  try {
    const userId = req.user.sub; // Auth0 থেকে আসা ইউজার আইডি
    const { name, bio, workplace, location, isVerified } = req.body;

    // আপনার User মডেল অনুযায়ী আপডেট করুন
    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: userId }, 
      { $set: { name, bio, workplace, location, isVerified } },
      { new: true, upsert: true }
    );

    res.json(updatedUser);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
const router = express.Router();

// get user profile by id
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers following', 'name avatar');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('users.getProfile:', err);
    res.status(500).send('Server error');
  }
});

// follow user
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.user.id === req.params.id) return res.status(400).json({ msg: "Can't follow yourself" });
    const me = await User.findById(req.user.id);
    const other = await User.findById(req.params.id);
    if (!other) return res.status(404).json({ msg: 'User not found' });

    if (other.followers.includes(me.id)) return res.status(400).json({ msg: 'Already following' });

    other.followers.push(me.id);
    me.following.push(other.id);
    await other.save();
    await me.save();
    res.json({ msg: 'Followed', followersCount: other.followers.length, followingCount: me.following.length });
  } catch (err) {
    console.error('users.follow:', err);
    res.status(500).send('Server error');
  }
});

// unfollow user
router.post('/:id/unfollow', auth, async (req, res) => {
  try {
    if (req.user.id === req.params.id) return res.status(400).json({ msg: "Can't unfollow yourself" });
    const me = await User.findById(req.user.id);
    const other = await User.findById(req.params.id);
    if (!other) return res.status(404).json({ msg: 'User not found' });

    other.followers = other.followers.filter(f => f.toString() !== me.id.toString());
    me.following = me.following.filter(f => f.toString() !== other.id.toString());
    await other.save();
    await me.save();
    res.json({ msg: 'Unfollowed', followersCount: other.followers.length, followingCount: me.following.length });
  } catch (err) {
    console.error('users.unfollow:', err);
    res.status(500).send('Server error');
  }
});

export default router;
