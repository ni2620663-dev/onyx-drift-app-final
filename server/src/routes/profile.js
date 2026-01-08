import express from "express";
import multer from "multer";
import mongoose from "mongoose"; 
import { v2 as cloudinary } from "cloudinary";
import auth from "../../middleware/auth.js";
import User from "../../models/User.js";

const router = express.Router();

// ১. Multer Setup (Temporary File Storage)
const upload = multer({ dest: 'uploads/' });

/* ==========================================================
    ২. GET ALL USERS (Fixes 404 for /api/user/all)
    Route: GET /api/profile/all (or /api/user/all based on server.js)
========================================================== */
router.get("/all", auth, async (req, res) => {
  try {
    const users = await User.find().select("name nickname avatar auth0Id isVerified bio");
    res.json(users);
  } catch (err) {
    console.error("Fetch All Users Error:", err);
    res.status(500).json({ msg: "Failed to fetch neural network users" });
  }
});

/* ==========================================================
    ৩. GET PROFILE BY ID
    Route: GET /api/profile/:userId
========================================================== */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Auth0 ID অথবা MongoDB ObjectId দিয়ে ইউজার খোঁজা
    const user = await User.findOne({ 
      $or: [
        { auth0Id: userId }, 
        { _id: mongoose.Types.ObjectId.isValid(userId) ? userId : null }
      ] 
    }).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found in neural orbit" });
    res.json(user);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).send("Neural Fetch Failed");
  }
});

/* ==========================================================
    ৪. UPDATE PROFILE (With Image Support)
    Route: PUT /api/profile/update-profile
========================================================== */
router.put('/update-profile', auth, upload.fields([{ name: 'avatar' }, { name: 'cover' }]), async (req, res) => {
  try {
    const { nickname, bio, location, workplace } = req.body;
    let updateFields = { nickname, bio, location, workplace };

    // Avatar Upload logic
    if (req.files && req.files['avatar']) {
      const avatarRes = await cloudinary.uploader.upload(req.files['avatar'][0].path, {
        folder: "onyx_profiles/avatars"
      });
      updateFields.avatar = avatarRes.secure_url;
    }

    // Cover Image Upload logic
    if (req.files && req.files['cover']) {
      const coverRes = await cloudinary.uploader.upload(req.files['cover'][0].path, {
        folder: "onyx_profiles/covers"
      });
      updateFields.coverImg = coverRes.secure_url;
    }

    const targetId = req.user.id || req.user.sub;
    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: targetId }, 
      { $set: updateFields }, 
      { new: true, upsert: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ msg: "Update Failed", error: err.message });
  }
});

/* ==========================================================
    ৫. FOLLOW / UNFOLLOW SYSTEM
    Route: POST /api/profile/follow/:targetId
========================================================== */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myAuth0Id = req.user.id || req.user.sub;
    const targetId = req.params.targetId;

    if (myAuth0Id === targetId) {
        return res.status(400).json({ msg: "Cannot follow yourself" });
    }

    const currentUser = await User.findOne({ auth0Id: myAuth0Id });
    if (!currentUser) return res.status(404).json({ msg: "User not found" });

    // অলরেডি ফলো করা আছে কি না চেক
    const isFollowing = currentUser.following.includes(targetId);

    if (isFollowing) {
      // Unfollow - Atomic Update
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myAuth0Id }, { $pull: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $pull: { followers: myAuth0Id } })
      ]);
      res.json({ msg: "Unfollowed successfully", isFollowing: false });
    } else {
      // Follow - Atomic Update
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: myAuth0Id }, { $addToSet: { following: targetId } }),
        User.findOneAndUpdate({ auth0Id: targetId }, { $addToSet: { followers: myAuth0Id } })
      ]);
      res.json({ msg: "Followed successfully", isFollowing: true });
    }
  } catch (err) {
    console.error("Follow Error:", err);
    res.status(500).json({ msg: "Follow action failed", error: err.message });
  }
});

export default router;