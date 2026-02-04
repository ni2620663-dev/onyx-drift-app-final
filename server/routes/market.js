import express from 'express';
import mongoose from 'mongoose';
const router = express.Router();

// প্রোডাক্ট স্কিমা
const ProductSchema = new mongoose.Schema({
  name: String,
  price: String,
  img: String,
  category: String,
  isAffiliate: { type: Boolean, default: false },
  link: String,
  sellerId: String,
  sellerName: String,
  isApproved: { type: Boolean, default: false }, // অ্যাডমিন অ্যাপ্রুভালের জন্য
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', ProductSchema);

// সব অ্যাপ্রুভড প্রোডাক্ট পাওয়ার API
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ isApproved: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// নতুন প্রোডাক্ট আপলোড (পেন্ডিং অবস্থায় থাকবে)
router.post('/upload', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(200).json(savedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;