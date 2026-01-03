import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   PUT /api/user/update-profile
 * @desc    Update user profile data or avatar
 * @access  Private
 */
router.put("/update-profile", auth, async (req, res) => {
  try {
    const { name, avatar, bio, workplace, location, email } = req.body;

    // auth middleware থেকে পাওয়া req.user.id (Auth0 sub) ব্যবহার করে আপডেট করা
    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: req.user.id }, 
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
      { new: true, upsert: true } // ইউজার ডাটাবেসে না থাকলে নতুন তৈরি করবে
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("❌ Profile Update Error:", err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

/**
 * @route   GET /api/user/:id
 * @desc    Get user profile by Auth0 ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.params.id });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

export default router;