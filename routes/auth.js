import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // .js extension must for ES modules

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Please provide name, email, and password' });
  }
  
  // 💡 রেজিস্ট্রেশন করার সময়ও ইমেইল ছোট হাতে রূপান্তর করা হচ্ছে
  const lowerCaseEmail = email.toLowerCase(); 

  try {
    // এখন ইউজারকে ছোট হাতের ইমেইল দিয়ে খোঁজা হচ্ছে
    const existingUser = await User.findOne({ email: lowerCaseEmail }); 
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    // ডেটাবেসেও ছোট হাতের ইমেইল সেভ করা হচ্ছে
    const user = new User({ name, email: lowerCaseEmail, password: hashedPassword }); 
    await user.save();

    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

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

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide email and password' });
  }
  
  // 💡 লগইন করার জন্য ইনপুট করা ইমেইলটিকে ছোট হাতের অক্ষরে রূপান্তর করা হচ্ছে 
  const lowerCaseEmail = email.toLowerCase();

  try {
    // ডেটাবেসে ছোট হাতের ইমেইল দিয়ে ইউজারকে খোঁজা হচ্ছে
    const user = await User.findOne({ email: lowerCaseEmail }); 
    
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' }); // ইউজার খুঁজে না পেলে ত্রুটি

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' }); // পাসওয়ার্ড না মিললে ত্রুটি

    const payload = { user: { id: user._id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

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