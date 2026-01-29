import { auth } from 'express-oauth2-jwt-bearer';
import User from "../models/User.js"; // ইউজার মডেল ইম্পোর্ট নিশ্চিত করুন

/**
 * Auth0 JWT Validation Configuration
 */
const checkJwt = auth({
  audience: 'https://onyx-drift-api.com', 
  issuerBaseURL: 'https://dev-6d0nxccsaycctfl1.us.auth0.com/', 
  tokenSigningAlg: 'RS256'
});

/**
 * 🚀 Smart Auth Middleware with Database Sync
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

        // ইউজারের বেসিক ডাটা অবজেক্ট (যদি টোকেনে নাম/ইমেইল থাকে)
        // নোট: Auth0 Access Token-এ নাম/ইমেইল পেতে হলে 'openid profile email' স্কোপ সেট করতে হয়
        const userData = {
          auth0Id: auth0Id,
          name: payload.name || "Drifter",
          email: payload.email || "",
          nickname: payload.nickname || "Drifter",
          avatar: payload.picture || ""
        };

        // ডাটাবেসে ইউজার আছে কি না চেক করে আপডেট বা ক্রিয়েট (Upsert) করা
        // এতে সার্চ লিস্টে ইউজারদের নাম আসা শুরু করবে
        const user = await User.findOneAndUpdate(
          { auth0Id: auth0Id },
          { $set: userData },
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
      console.error("❌ Database Sync Error:", dbErr);
      // ডাটাবেস এরর হলেও ইউজারকে রিকোয়েস্ট কন্টিনিউ করতে দিন
      next();
    }
  });
};

export default authMiddleware;