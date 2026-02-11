import { auth } from 'express-oauth2-jwt-bearer';
import User from "../models/User.js"; 

/**
 * Auth0 JWT Validation Configuration
 */
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE || 'https://onyx-drift-api.com', 
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN || 'dev-6d0nxccsaycctfl1.us.auth0.com'}/`, 
  tokenSigningAlg: 'RS256'
});

/**
 * 🚀 Smart Auth Middleware with Database Sync (Fixed)
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ১. যদি টোকেন না থাকে (গেস্ট ইউজার)
  if (!authHeader) {
    req.user = { isGuest: true, id: null };
    return next();
  }

  // ২. টোকেন থাকলে ভেরিফাই করো
  checkJwt(req, res, async (err) => {
    if (err) {
      console.warn("⚠️ Token Invalid:", err.message);
      
      // গুরুত্বপূর্ণ অ্যাকশনের ক্ষেত্রে গেস্ট অ্যালাউড না
      if (req.method === "POST" || req.method === "PATCH" || req.method === "DELETE") {
         return res.status(401).json({ 
           msg: "Session expired or invalid token. Please login again." 
         });
      }
      
      req.user = { isGuest: true, id: null };
      return next();
    }
    
    // ৩. টোকেন ভ্যালিড হলে ডাটাবেসে ইউজার সিঙ্ক করো
    try {
      if (req.auth && req.auth.payload) {
        const payload = req.auth.payload;
        const auth0Id = payload.sub;

        // ✅ ফিক্স: ইমেইল না থাকলে সেটি আপডেট অবজেক্টে পাঠানো যাবে না
        const updateData = {
          auth0Id: auth0Id,
          name: payload.name || payload.nickname || "Drifter",
          nickname: payload.nickname || "Drifter",
          avatar: payload.picture || ""
        };

        // যদি পে-লোডে ইমেইল থাকে, তবেই সেটি অ্যাড করো
        if (payload.email) {
          updateData.email = payload.email;
        }

        // ডাটাবেসে ইউজার সিঙ্ক (Upsert)
        // $set এর মাধ্যমে শুধুমাত্র পাঠানো ডাটা আপডেট হবে
        const user = await User.findOneAndUpdate(
          { auth0Id: auth0Id },
          { $set: updateData },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

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
      // ✅ লজিক: ডুপ্লিকেট কি এরর বা অন্য ডাটাবেস এরর হলে ক্রাশ না করে এগিয়ে যান
      console.error("❌ Database Sync Error:", dbErr.message);
      
      // গেস্ট মুড বা টেম্পোরারি মুডে ইউজারকে রাখা যাতে অ্যাপ সচল থাকে
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