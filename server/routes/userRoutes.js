import express from "express";
const router = express.Router();
// কন্ট্রোলার ইম্পোর্ট করার সময় অবশ্যই শেষে .js দিবেন
import * as userController from "../controllers/userController.js"; 

// প্রোফাইল সিঙ্ক করার জন্য
router.post("/update-profile", userController.updateUserProfile);

// ফ্রেন্ড রিকোয়েস্ট সিস্টেম
router.post("/send-request", userController.sendRequest);
router.post("/accept-request", userController.acceptRequest);

// ইউজারের সব তথ্য গেট করার জন্য
router.get("/data/:id", userController.getUserData);

// ✅ এটিই সবথেকে গুরুত্বপূর্ণ পরিবর্তন (ESM Export)
export default router;