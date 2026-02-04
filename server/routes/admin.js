import express from 'express';
import mongoose from 'mongoose';
const router = express.Router();

// প্রোডাক্ট মডেলটি এখান থেকেও এক্সেস করছি
const Product = mongoose.model('Product');

// পেন্ডিং প্রোডাক্টগুলোর লিস্ট দেখা
router.get('/pending-ads', async (req, res) => {
  try {
    const pending = await Product.find({ isApproved: false });
    res.json(pending);
  } catch (err) {
    res.status(500).json(err);
  }
});

// প্রোডাক্ট অ্যাপ্রুভ করা (মার্কেটপ্লেসে লাইভ করা)
router.put('/approve/:id', async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isApproved: true });
    res.json({ message: "Ad is now LIVE!" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// প্রোডাক্ট ডিলিট করা
router.delete('/reject/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Ad Rejected/Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;