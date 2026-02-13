import { auth } from 'express-oauth2-jwt-bearer';
import User from "../models/User.js"; 

/**
 * 🔐 Auth0 JWT Validation Configuration
 * আপনার কনসোল এরর অনুযায়ী ডোমেইনটি একদম নির্ভুল করা হয়েছে।
 */
const checkJwt = auth({
  // Render-এর এনভায়রনমেন্ট ভ্যারিয়েবল অথবা ডিফল্ট হিসেবে আপনার বর্তমান API Identifier
  audience: process.env.AUTH0_AUDIENCE || 'https://onyx-drift-api.com', 
  
  // ডোমেইন ফরম্যাটটি আপনার লেটেস্ট সেটিংস অনুযায়ী ফিক্স করা হয়েছে
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN || 'dev-prxn6v2o08xp5loz.us.auth0.com'}/`, 
  tokenSigningAlg: 'RS256'
});

/**
 * 🧠 Smart Auth Middleware with Database Sync
 * এটি টোকেন ভেরিফাই করে এবং ইউজার প্রোফাইল স্বয়ংক্রিয়ভাবে MongoDB-তে সিঙ্ক করে।
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ১. যদি টোকেন না থাকে (Guest User/Public Access)
  if (!authHeader) {
    req.user = { isGuest: true, id: null };
    return next();
  }

  // ২. টোকেন থাকলে সেটি Auth0 দিয়ে ভেরিফাই করো
  checkJwt(req, res, async (err) => {
    if (err) {
      console.warn("⚠️ Neural Sync Interrupted (Invalid Token):", err.message);
      
      // গুরুত্বপূর্ণ অ্যাকশন (Create/Update/Delete) হলে ৪০১ এরর দাও
      if (req.method !== "GET") {
         return res.status(401).json({ 
           error: "Neural Grid Breakdown",
           message: "Session expired or invalid token. Please login again." 
         });
      }
      
      req.user = { isGuest: true, id: null };
      return next();
    }
    
    // ৩. টোকেন ভ্যালিড হলে ডাটাবেসে ইউজার ডাটা সিঙ্ক (Upsert) করো
    try {
      if (req.auth && req.auth.payload) {
        const payload = req.auth.payload;
        const auth0Id = payload.sub;

        // আপডেট করার জন্য ডাইনামিক ডাটা অবজেক্ট
        const updateData = {
          auth0Id: auth0Id,
          name: payload.name || payload.nickname || "Drifter",
          nickname: payload.nickname || `drifter_${auth0Id.slice(-5)}`,
          avatar: payload.picture || ""
        };

        // ইমেইল থাকলে সেটি যোগ হবে যাতে ইমেইল ছাড়া ইউজারদের ক্ষেত্রে এরর না আসে
        if (payload.email) {
          updateData.email = payload.email;
        }

        // MongoDB-তে ইউজার খুঁজুন এবং আপডেট করুন
        const user = await User.findOneAndUpdate(
          { auth0Id: auth0Id },
          { $set: updateData },
          { 
            upsert: true, 
            new: true, 
            setDefaultsOnInsert: true,
            runValidators: false 
          }
        );

        // রিকোয়েস্ট অবজেক্টে প্রসেসড ইউজার ডাটা সেট করা
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
      // ডাটাবেস এরর হলে লগ করে গেস্ট হিসেবে এগিয়ে যাও যাতে অ্যাপ ক্রাশ না করে
      console.error("❌ Neural Database Sync Error:", dbErr.message);
      
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