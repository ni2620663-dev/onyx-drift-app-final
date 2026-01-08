import express from 'express';
const router = express.Router();
import User from '../models/User.js'; 
import auth from '../middleware/auth.js'; 
import upload from '../middleware/multer.js'; // নিশ্চিত করুন এখানে cloudinaryStorage কনফিগার করা আছে

/* ==========================================================
   1️⃣ UPDATE PROFILE (Avatar, Cover, Bio, Workplace)
   Route: PUT api/user/update-profile
========================================================== */
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nickname, name, bio, location, workplace } = req.body;
    
    let updateFields = {};
    if (name) updateFields.name = name;
    if (nickname) updateFields.nickname = nickname;
    if (bio) updateFields.bio = bio;
    if (location) updateFields.location = location;
    if (workplace) updateFields.workplace = workplace;

    // ইমেজ চেক (Cloudinary URL সেভ হবে)
    if (req.files) {
      if (req.files.avatar) {
        updateFields.avatar = req.files.avatar[0].path;
      }
      if (req.files.cover) {
        updateFields.coverImg = req.files.cover[0].path;
      }
    }

    const targetAuth0Id = req.user.sub || req.user.id;

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: targetAuth0Id }, 
      { $set: updateFields },
      { new: true, upsert: true }
    );

    res.json(updatedUser);

  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ msg: 'Identity Sync Failed', error: err.message });
  }
});

/* ==========================================================
   2️⃣ NEURAL SEARCH (Search Users for SearchBar)
   Route: GET api/user/search?query=name
========================================================== */
router.get("/search", auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    // ইউজার সার্চ (Case Insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { nickname: { $regex: query, $options: "i" } }
      ]
    })
    .select("name nickname avatar auth0Id location isPremium")
    .limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Search failed" });
  }
});

/* ==========================================================
   3️⃣ GET PROFILE BY ID
   Route: GET api/user/profile/:id
========================================================== */
router.get("/profile/:id", auth, async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.params.id })
      .populate("friends", "name avatar auth0Id");
    
    if (!user) return res.status(404).json({ msg: "User not found in orbit" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching neural profile" });
  }
});

/* ==========================================================
   4️⃣ FRIEND REQUEST SYSTEM (Connect Signals)
========================================================== */

// @desc Send Request
router.post("/friend-request/:targetAuth0Id", auth, async (req, res) => {
  try {
    const senderId = req.user.sub || req.user.id;
    const targetId = req.params.targetAuth0Id;

    if (senderId === targetId) return res.status(400).json({ msg: "Self-linking prohibited" });

    await User.findOneAndUpdate(
      { auth0Id: targetId },
      { $addToSet: { pendingRequests: senderId } }
    );

    res.json({ msg: "Neural Request Dispatched" });
  } catch (err) {
    res.status(500).json({ msg: "Connection Request Failed" });
  }
});

// @desc Accept Request
router.post("/accept-friend/:senderAuth0Id", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const friendId = req.params.senderAuth0Id;

    await User.findOneAndUpdate(
      { auth0Id: myId },
      { $pull: { pendingRequests: friendId }, $addToSet: { friends: friendId } }
    );

    await User.findOneAndUpdate(
      { auth0Id: friendId },
      { $addToSet: { friends: myId } }
    );

    res.json({ msg: "Neural Link Established" });
  } catch (err) {
    res.status(500).json({ msg: "Sync Failed" });
  }
});

/* ==========================================================
   5️⃣ SUGGESTED USERS (Sidebar/Connect Page)
   Route: GET api/user/all
========================================================== */
router.get("/all", auth, async (req, res) => {
  try {
    const currentUserId = req.user.sub || req.user.id;
    
    // বর্তমান ইউজার এবং যারা অলরেডি ফ্রেন্ড তাদের বাদ দিয়ে সাজেশন দেওয়া
    const users = await User.find({ 
      auth0Id: { $ne: currentUserId } 
    })
    .select("name nickname avatar auth0Id bio")
    .limit(8);

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Could not fetch drifters" });
  }
});

export default router;