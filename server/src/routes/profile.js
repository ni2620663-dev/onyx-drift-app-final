import express from "express";
import mongoose from "mongoose";
import auth from "../../middleware/auth.js";
import User from "../../models/User.js";

const router = express.Router();

/* ==========================================================
    ১. GET ALL USERS (Fixes 404 for /api/user/all)
========================================================== */
router.get("/all", auth, async (req, res) => {
  try {
    const users = await User.find().select("name nickname avatar auth0Id isVerified bio");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch users" });
  }
});

/* ==========================================================
    ২. SEARCH USERS (Fixes Search Bar)
========================================================== */
router.get("/search", auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { nickname: { $regex: query, $options: "i" } }
      ]
    }).select("name nickname avatar auth0Id isVerified").limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Search failed" });
  }
});

/* ==========================================================
    ৩. FOLLOW SYSTEM (Fixes Follow Button)
========================================================== */
router.post("/follow/:targetId", auth, async (req, res) => {
  try {
    const myAuth0Id = req.user.id || req.user.sub;
    const { targetId } = req.params;

    const [me, targetUser] = await Promise.all([
      User.findOne({ auth0Id: myAuth0Id }),
      User.findOne({
        $or: [
          { auth0Id: targetId },
          { _id: mongoose.Types.ObjectId.isValid(targetId) ? targetId : null }
        ]
      })
    ]);

    if (!targetUser || !me) return res.status(404).json({ msg: "User not found" });

    const isFollowing = me.following.includes(targetUser.auth0Id);

    if (isFollowing) {
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: me.auth0Id }, { $pull: { following: targetUser.auth0Id } }),
        User.findOneAndUpdate({ auth0Id: targetUser.auth0Id }, { $pull: { followers: me.auth0Id } })
      ]);
      res.json({ msg: "Unfollowed", isFollowing: false });
    } else {
      await Promise.all([
        User.findOneAndUpdate({ auth0Id: me.auth0Id }, { $addToSet: { following: targetUser.auth0Id } }),
        User.findOneAndUpdate({ auth0Id: targetUser.auth0Id }, { $addToSet: { followers: me.auth0Id } })
      ]);
      res.json({ msg: "Followed", isFollowing: true });
    }
  } catch (err) {
    res.status(500).json({ msg: "Follow action failed" });
  }
});

export default router;