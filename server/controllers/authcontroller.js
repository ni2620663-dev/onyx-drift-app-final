const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // আপনার ইউজার মডেলটি ইমপোর্ট করুন

// Register logic
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const newUser = await User.create({
            username,
            password: hashedPassword
        });

        res.status(201).json({ message: "User created successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Login logic
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 1. ইউজার আছে কিনা চেক করুন
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "User not found!" });

        // 2. পাসওয়ার্ড কম্পেয়ার করুন
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials!" });

        // 3. টোকেন জেনারেট করুন
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // 4. কুকি হিসেবে পাঠিয়ে দিন
        res.cookie('token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', // প্রোডাকশনে ট্রু হবে
            sameSite: 'Strict' 
        });

        res.status(200).json({ message: "Login Successful", userId: user._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};