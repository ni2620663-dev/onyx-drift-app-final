import express from "express";
import mongoose from "mongoose";
import auth from "../../middleware/auth.js";
import User from "../../models/User.js";

const router = express.Router();

// ১. সকল ইউজারদের লিস্ট পাওয়ার রুট
// Route: GET /api/user/all
router.get("/all", auth, async (req, res) => {
  try {
    const users = await User.find().select("name nickname avatar auth0Id isVerified bio followers following");
    res.json(users);
  } catch (err) {
    console.error("Fetch All Error:", err);
    res.status(500).json({ msg: "Failed to load neural network users" });
  }
});

// ২. ফলো/আনফলো করার মূল লজিক
// Route: POST /api/user/follow/:targetId
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myAuth0Id = req.user.id || req.user.sub;
    const { targetId } = req.params; // এটি target ইউজারের Auth0 ID

    const [me, targetUser] = await Promise.all([
      User.findOne({ auth0Id: myAuth0Id }),
      User.findOne({ auth0Id: targetId })
    ]);

    if (!targetUser || !me) return res.status(404).json({ msg: "User connection lost" });
    if (me.auth0Id === targetUser.auth0Id) return res.status(400).json({ msg: "Self-link blocked" });

    const isFollowing = me.following.includes(targetUser.auth0Id);

    if (isFollowing) {
      // Unfollow
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: me.auth0Id }, { $pull: { following: targetUser.auth0Id } }),
        User.findOneAndUpdate({ auth0Id: targetUser.auth0Id }, { $pull: { followers: me.auth0Id } })
      ]);
      res.json({ msg: "Unfollowed", isFollowing: false });
    } else {
      // Follow
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: me.auth0Id }, { $addToSet: { following: targetUser.auth0Id } }),
        User.findOneAndUpdate({ auth0Id: targetUser.auth0Id }, { $addToSet: { followers: me.auth0Id } })
      ]);
      res.json({ msg: "Followed", isFollowing: true });
    }
  } catch (err) {
    console.error("Follow Error:", err);
    res.status(500).json({ msg: "Follow action failed" });
  }
});

export default router;