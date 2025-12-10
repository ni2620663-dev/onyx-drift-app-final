import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // .js extension must for ES modules

const router = express.Router();

// =======================================================
// 🟢 রেজিস্ট্রেশন রুট (Register user)
// =======================================================
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  
  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Please provide name, email, and password' });
  }
  
  // 💡 ইমেলটিকে ছোট হাতের অক্ষরে রূপান্তর করা হচ্ছে, যাতে কেস-সংক্রান্ত সমস্যা এড়ানো যায়।
  const lowerCaseEmail = email.toLowerCase(); 

  try {
    // ১. ইউজার বিদ্যমান কিনা তা পরীক্ষা করা
    const existingUser = await User.findOne({ email: lowerCaseEmail }); 
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    // ২. পাসওয়ার্ড হ্যাশ করা
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ৩. নতুন ইউজার তৈরি এবং সেভ করা
    const user = new User({ name, email: lowerCaseEmail, password: hashedPassword }); 
    await user.save();

    // ৪. টোকেন তৈরি
    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // ৫. সফল প্রতিক্রিয়া
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
      },
    });
  } catch (err) {
    console.error('auth.register error:', err);
    res.status(500).send('Server error');
  }
});

// =======================================================
// 🔑 লগইন রুট (Login user)
// =======================================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide email and password' });
  }
  
  // 💡 ইনপুট করা ইমেইলটিকে ছোট হাতের অক্ষরে রূপান্তর করা হচ্ছে
  const lowerCaseEmail = email.toLowerCase();

  try {
    // ১. ডেটাবেসে ইউজারকে খোঁজা
    const user = await User.findOne({ email: lowerCaseEmail }); 
    
    // যদি ইউজার খুঁজে না পাওয়া যায়
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' }); 

    // ২. পাসওয়ার্ড তুলনা করা (মূল লজিক)
    const isMatch = await bcrypt.compare(password, user.password);
    
    // পাসওয়ার্ড না মিললে
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' }); 

    // ৩. টোকেন তৈরি (যদি পাসওয়ার্ড মেলে)
    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // ৪. সফল প্রতিক্রিয়া
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
      },
    });
  } catch (err) {
    console.error('auth.login error:', err);
    res.status(500).send('Server error');
  }
});

export default router;