import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// ১. Cloudinary কনফিগারেশন
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ২. স্টোরেজ ইঞ্জিন সেটআপ
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "onyx_drift_assets", // ক্লাউডিনারিতে এই ফোল্ডারে সেভ হবে
    resource_type: "auto", // ইমেজ এবং ভিডিও দুইটাই সাপোর্ট করবে
    allowed_formats: ["jpg", "jpeg", "png", "gif", "mp4", "webm"],
    public_id: (req, file) => {
      // ফাইলের ইউনিক নাম তৈরি করা
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      return file.fieldname + "-" + uniqueSuffix;
    },
  },
});

// ৩. ফাইল ফিল্টার (নিরাপত্তার জন্য)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type! Only images and videos are allowed."), false);
  }
};

// ৪. মাল্টার ইনিশিয়ালাইজেশন
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // সর্বোচ্চ ৫০ মেগাবাইট (ভিডিওর জন্য)
  },
});

export default upload;