// C:\Development\onyx-drift-app-final\client\src\routes\users.js
import express from 'express';
// ✅ মিডলওয়্যার পাথ: দুই ধাপ উপরে (client) এসে AuthMiddleware/auth.js এ প্রবেশ
import { verifyAuth } from '../../AuthMiddleware/auth.js'; 
// ✅ মডেল পাথ: দুই ধাপ উপরে (client) এসে models/User.js এ প্রবেশ
 import User from '../../data_models/user.js';
// ----------------------------------------------------
// ৪. সব ইউজারদের লিস্ট পাওয়া (Search/Explore এর জন্য)
// GET /api/users
// ----------------------------------------------------
router.get('/', async (req, res) => {
    try {
        // সব ইউজারদের নিয়ে আসবে কিন্তু পাসওয়ার্ড ফিল্ড বাদ দিয়ে
        const users = await User.find().select('name avatar bio followers');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
});
const router = express.Router();

// ----------------------------------------------------
// 1. যেকোনো ব্যবহারকারীর প্রোফাইল দেখা
// GET /api/users/:userId
// ----------------------------------------------------
router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password'); 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error: error.message });
    }
});

// ----------------------------------------------------
// 2. ব্যবহারকারীকে ফলো করা (প্রমাণীকরণ প্রয়োজন)
// POST /api/users/:userId/follow
// ----------------------------------------------------
router.post('/:userId/follow', verifyAuth, async (req, res) => {
    if (req.user.id === req.params.userId) {
        return res.status(400).json({ message: "You cannot follow yourself" });
    }
    
    try {
        const userToFollow = await User.findById(req.params.userId);
        const currentUser = await User.findById(req.user.id);
        
        if (!userToFollow || !currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // ফলো করার লজিক
        if (!userToFollow.followers.includes(currentUser.id)) {
            userToFollow.followers.push(currentUser.id);
            currentUser.following.push(userToFollow.id);
            
            await userToFollow.save();
            await currentUser.save();

            res.status(200).json({ message: "User followed successfully" });
        } else {
            res.status(400).json({ message: "You already follow this user" });
        }
    } catch (error) {
        res.status(500).json({ message: "Follow failed", error: error.message });
    }
});

// ----------------------------------------------------
// 3. ব্যবহারকারীকে আনফলো করা
// POST /api/users/:userId/unfollow
// ----------------------------------------------------
router.post('/:userId/unfollow', verifyAuth, async (req, res) => {
    if (req.user.id === req.params.userId) {
        return res.status(400).json({ message: "You cannot unfollow yourself" });
    }

    try {
        const userToUnfollow = await User.findById(req.params.userId);
        const currentUser = await User.findById(req.user.id);

        if (!userToUnfollow || !currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

// PUT /api/users/:userId (প্রোফাইল আপডেট করার জন্য)
router.put('/:userId', verifyAuth, async (req, res) => {
    // শুধুমাত্র নিজের প্রোফাইল এডিট করতে পারবে
    if (req.user.id !== req.params.userId) {
        return res.status(403).json({ message: "You can only update your own profile" });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            {
                $set: {
                    name: req.body.name,
                    bio: req.body.bio,
                    avatar: req.body.avatar,
                    location: req.body.location
                }
            },
            { new: true } // এটি আপডেট হওয়া নতুন ডাটা রিটার্ন করবে
        ).select('-password');

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: "Update failed", error: error.message });
    }
});
        // আনফলো করার লজিক (অ্যারে থেকে আইডি মুছে ফেলা)
        if (userToUnfollow.followers.includes(currentUser.id)) {
            userToUnfollow.followers = userToUnfollow.followers.filter(
                (followerId) => followerId.toString() !== currentUser.id.toString()
            );

            currentUser.following = currentUser.following.filter(
                (followingId) => followingId.toString() !== userToUnfollow.id.toString()
            );

            await userToUnfollow.save();
            await currentUser.save();

            res.status(200).json({ message: "User unfollowed successfully" });
        } else {
            res.status(400).json({ message: "You are not following this user" });
        }
    } catch (error) {
        res.status(500).json({ message: "Unfollow failed", error: error.message });
    }
});

export default router;