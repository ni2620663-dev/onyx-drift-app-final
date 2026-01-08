import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// ১. Cloudinary কনফিগারেশন (আপনার .env থেকে ডাটা নেবে)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ২. Cloudinary স্টোরেজ সেটআপ (রেন্ডারের জন্য এটিই সেরা)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'onyx_drift_uploads', // ফোল্ডারের নাম
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'pdf'], // অনুমোদিত ফরম্যাট
    resource_type: 'auto', // ভিডিও বা ইমেজ অটো ডিটেক্ট করবে
  },
});

const upload = multer({ storage });

/* =========================
   Single file upload route
   Endpoint: POST /api/upload
========================= */
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    // Cloudinary থেকে আসা সরাসরি ইউআরএল (path) পাঠানো হচ্ছে
    res.json({ 
      msg: 'File uploaded successfully to Neural Cloud', 
      filePath: req.file.path, // এটি একটি https লিংক হবে
      public_id: req.file.filename 
    });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ msg: 'Neural Upload Failed', error: err.message });
  }
});

export default router;