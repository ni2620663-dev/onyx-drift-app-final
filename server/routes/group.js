import express from 'express';
import Group from '../models/Group.js'; // নিশ্চিত করুন এই মডেলটি আছে
import auth from '../middleware/auth.js';

const router = express.Router();

// ১. নতুন গ্রুপ (Hive) তৈরি করা
router.post('/create', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const newGroup = new Group({
      name,
      creator: req.user.sub || req.user.id,
      members: [req.user.sub || req.user.id],
      isPublic: true
    });
    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    res.status(500).json({ message: "Hive creation failed", error: err.message });
  }
});

// ২. সব গ্রুপ লিস্ট দেখা
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: "Discovery signal lost" });
  }
});

export default router;