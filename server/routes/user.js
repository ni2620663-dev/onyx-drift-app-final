import express from 'express';
const router = express.Router();
import User from '../models/User.js'; // আপনার ইউজার মডেল পাথ চেক করে নিন
import auth from '../middleware/auth.js'; // আপনার অথ মিডলওয়্যার
import upload from '../middleware/multer.js'; // আপনার মাল্টার ও ক্লাউডিনারি কনফিগ

// @route   PUT api/user/update-profile
// @desc    Update user identity (Avatar, Cover, Bio, etc.)
// @access  Private
router.put("/update-profile", auth, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    const { nickname, bio, location, workplace } = req.body;
    
    // ১. ডাটাবেসে যে ফিল্ডগুলো আপডেট হবে সেগুলো সাজানো
    let updateFields = {};
    if (nickname) updateFields.name = nickname;
    if (bio) updateFields.bio = bio;
    if (location) updateFields.location = location;
    if (workplace) updateFields.workplace = workplace;

    // ২. ইমেজ ফাইল চেক করা (Cloudinary Path)
    if (req.files) {
      if (req.files.avatar) {
        updateFields.avatar = req.files.avatar[0].path;
      }
      if (req.files.cover) {
        updateFields.coverImg = req.files.cover[0].path;
      }
    }

    // ৩. সঠিক ID দিয়ে ইউজারকে খুঁজে আপডেট করা
    const targetAuth0Id = req.user.sub || req.user.id;

    console.log("Synchronizing Identity for:", targetAuth0Id);

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: targetAuth0Id }, 
      { $set: updateFields },
      { new: true, upsert: true } // upsert: true মানে ইউজার না থাকলে নতুন বানাবে
    );

    if (!updatedUser) {
      return res.status(404).json({ msg: "Neural Identity not found in database" });
    }

    // ৪. সফল রেসপন্স পাঠানো
    res.json(updatedUser);

  } catch (err) {
    console.error("Critical Sync Error:", err);
    res.status(500).json({ 
      msg: 'Identity Synchronization Failed', 
      error: err.message 
    });
  }
});

// --- নিচে নতুন লজিকগুলো যোগ করা হলো যা সার্চ বারের জন্য প্রয়োজন ---

// @route   GET api/user/search
// @desc    Search users by name or nickname for the search bar
// @access  Private
router.get("/search", auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    // ডাটাবেজে ইউজারদের খুঁজে বের করা (Case Insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { nickname: { $regex: query, $options: "i" } }
      ]
    })
    .select("name nickname avatar auth0Id location isPremium") // শুধু প্রয়োজনীয় ডাটা পাঠানো হচ্ছে
    .limit(10);

    res.json(users);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ msg: "Neural Search failed" });
  }
});

// @route   GET api/user/profile/:id
// @desc    Get specific user profile by auth0Id
// @access  Private
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

// @route   POST api/user/friend-request/:targetAuth0Id
// @desc    Send friend request
// @access  Private
router.post("/friend-request/:targetAuth0Id", auth, async (req, res) => {
  try {
    const senderId = req.user.sub || req.user.id;
    const targetId = req.params.targetAuth0Id;

    if (senderId === targetId) return res.status(400).json({ msg: "Self-linking not allowed" });

    await User.findOneAndUpdate(
      { auth0Id: targetId },
      { $addToSet: { pendingRequests: senderId } }
    );

    res.json({ msg: "Neural Link Request Sent" });
  } catch (err) {
    res.status(500).json({ msg: "Connection Request Failed" });
  }
});

// @route   POST api/user/accept-friend/:senderAuth0Id
// @desc    Accept friend request
// @access  Private
router.post("/accept-friend/:senderAuth0Id", auth, async (req, res) => {
  try {
    const myId = req.user.sub || req.user.id;
    const friendId = req.params.senderAuth0Id;

    // ১. নিজের থেকে রিকোয়েস্ট সরানো এবং ফ্রেন্ডে যোগ করা
    await User.findOneAndUpdate(
      { auth0Id: myId },
      { 
        $pull: { pendingRequests: friendId },
        $addToSet: { friends: friendId } 
      }
    );

    // ২. অন্যের ফ্রেন্ড লিস্টেও নিজেকে যোগ করা
    await User.findOneAndUpdate(
      { auth0Id: friendId },
      { $addToSet: { friends: myId } }
    );

    res.json({ msg: "Neural Link Established" });
  } catch (err) {
    res.status(500).json({ msg: "Neural Sync Failed" });
  }
});

// --- এটি নতুন যোগ করা হলো সাইডবারে ইউজার দেখানোর জন্য ---

// @route   GET api/user/suggested-users
// @desc    Get random users for sidebar suggestions
// @access  Private
router.get("/all", auth, async (req, res) => {
  try {
    const currentUserId = req.user.sub || req.user.id;
    // বর্তমান ইউজার ছাড়া অন্য ৫ জন ইউজারকে র‍্যান্ডমলি দেখানো
    const users = await User.find({ auth0Id: { $ne: currentUserId } })
      .select("name nickname avatar auth0Id")
      .limit(5);
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Could not fetch suggested drifters" });
  }
});

export default router;