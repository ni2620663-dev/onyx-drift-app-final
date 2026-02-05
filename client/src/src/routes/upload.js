// src/routes/upload.js
import express from 'express';
// 🚨 আপলোডের জন্য Multer ইনস্টল করুন: npm install multer
import multer from 'multer'; 
// 🚨 Firebase Storage ব্যবহার করলে: import { storage } from '../config/firebase.js';

const router = express.Router();

// Multer কনফিগারেশন: লোকাল আপলোডের জন্য
// 🚨 Note: Production এ Firebase Storage বা Cloudinary ব্যবহার করা ভালো।
const storage = multer.memoryStorage(); // মেমরিতে ফাইল সেভ করুন
const upload = multer({ storage: storage });

// ----------------------------------------------------
// ফাইল আপলোড করার রুট
// POST /api/upload
// ----------------------------------------------------
router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    
    // 💡 এখানে Firebase Storage বা Cloudinary তে আপলোডের লজিক থাকবে
    // বর্তমানে এটি কেবল একটি ডামি রিপ্লে
    
    try {
        // উদাহরণ: Firebase Storage এ আপলোড করার লজিক এখানে যাবে
        // const fileRef = storage.bucket().file(`uploads/${Date.now()}_${req.file.originalname}`);
        // await fileRef.save(req.file.buffer, { contentType: req.file.mimetype });
        // const downloadURL = await fileRef.getSignedUrl({ action: 'read', expires: '03-09-2491' });

        const dummyURL = `https://dummy-cdn.com/uploads/${req.file.originalname}`;
        
        res.status(200).json({ 
            message: "File uploaded successfully", 
            url: dummyURL 
        });

    } catch (error) {
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
});

export default router;