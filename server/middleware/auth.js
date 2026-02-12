import { auth } from 'express-oauth2-jwt-bearer';
import User from "../models/User.js"; 

/**
 * Auth0 JWT Validation Configuration
 */
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE || 'https://onyx-drift-api.com', 
  // এখানে ডিফল্ট ডোমেইনটি আপনার বর্তমান ডোমেইন দিয়ে আপডেট করুন
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN || 'dev-prxn6v2o08xp5loz.us.auth0.com'}/`, 
  tokenSigningAlg: 'RS256'
});
/**
 * 🚀 Smart Auth Middleware with Database Sync
 * এটি টোকেন ভেরিফাই করে এবং ইউজার প্রোফাইল ডাটাবেসে সিঙ্ক করে।
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ১. যদি টোকেন না থাকে (Guest User)
  if (!authHeader) {
    req.user = { isGuest: true, id: null };
    return next();
  }

  // ২. টোকেন থাকলে সেটি Auth0 দিয়ে ভেরিফাই করো
  checkJwt(req, res, async (err) => {
    if (err) {
      console.warn("⚠️ Token Invalid:", err.message);
      
      // গুরুত্বপূর্ণ অ্যাকশন (Create/Update/Delete) হলে এরর দাও
      if (req.method !== "GET") {
         return res.status(401).json({ 
           msg: "Session expired or invalid token. Please login again." 
         });
      }
      
      req.user = { isGuest: true, id: null };
      return next();
    }
    
    // ৩. টোকেন ভ্যালিড হলে ডাটাবেসে ইউজার সিঙ্ক (Sync) করো
    try {
      if (req.auth && req.auth.payload) {
        const payload = req.auth.payload;
        const auth0Id = payload.sub;

        // আপডেট করার জন্য ডাটা অবজেক্ট তৈরি
        const updateData = {
          auth0Id: auth0Id,
          name: payload.name || payload.nickname || "Drifter",
          nickname: payload.nickname || `drifter_${auth0Id.slice(-5)}`,
          avatar: payload.picture || ""
        };

        // শুধুমাত্র ইমেইল থাকলেই সেটি আপডেট ডাটায় যোগ হবে
        // এটি Duplicate Key Error (email: "") বন্ধ করবে
        if (payload.email) {
          updateData.email = payload.email;
        }

        // ডাটাবেসে ইউজার খুঁজুন এবং আপডেট করুন (Upsert)
        const user = await User.findOneAndUpdate(
          { auth0Id: auth0Id },
          { $set: updateData },
          { 
            upsert: true, 
            new: true, 
            setDefaultsOnInsert: true,
            runValidators: false // ইনডেক্স ক্লিন করার সময় ভ্যালিডেশন স্কিপ করা নিরাপদ
          }
        );

        // রিকোয়েস্ট অবজেক্টে ইউজার ডাটা সেট করা
        req.user = {
          id: auth0Id,
          sub: auth0Id,
          mongoId: user._id,
          isGuest: false,
          name: user.name
        };
        
        next();
      } else {
        req.user = { isGuest: true, id: null };
        next();
      }
    } catch (dbErr) {
      // ডুপ্লিকেট কি বা অন্য ডাটাবেস এরর হলে সার্ভার ক্রাশ না করে এগিয়ে যাবে
      console.error("❌ Database Sync Error:", dbErr.message);
      
      req.user = {
        id: req.auth?.payload?.sub,
        isGuest: false,
        dbError: true
      };
      next();
    }
  });
};

export default authMiddleware;