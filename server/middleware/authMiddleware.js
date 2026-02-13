import { auth } from 'express-oauth2-jwt-bearer';

/**
 * 🔐 Auth0 JWT Validation Configuration
 * আপনার লেটেস্ট কনফিগারেশন অনুযায়ী ডোমেইন এবং অডিয়েন্স সেট করা হয়েছে।
 */
const checkJwt = auth({
  // আপনার Auth0 API Identifier
  audience: 'https://onyx-drift-api.com', 
  
  // আপনার বর্তমান Auth0 ডোমেইন URL
  issuerBaseURL: 'https://dev-prxn6v2o08xp5loz.us.auth0.com/', 
  
  // টোকেন সাইনিং অ্যালগরিদম
  tokenSigningAlg: 'RS256'
});

/**
 * 🛡️ Strict Auth Middleware
 * এটি নিশ্চিত করে যে ইউজার ভ্যালিড টোকেন ছাড়া কোনো সুরক্ষিত এপিআই (API) এক্সেস করতে পারবে না।
 */
const authMiddleware = (req, res, next) => {
  // ১. হেডার থেকে টোকেন যাচাই করা শুরু
  checkJwt(req, res, (err) => {
    if (err) {
      // যদি টোকেন না থাকে বা ভুল থাকে তবে এরর লগ হবে
      console.error("❌ Neural Signal Lost (Auth Error):", err.message);
      
      //Unauthorized রেসপন্স পাঠিয়ে রিকোয়েস্ট এখানেই থামিয়ে দেওয়া হবে
      return res.status(401).json({ 
        error: 'Identity Verification Failed',
        msg: 'Unauthorized: Neural Signal Lost', 
        message: err.message 
      });
    }
    
    // ২. Auth0 থেকে প্রাপ্ত 'sub' (Subject ID) কে req.user-এ সেট করা হচ্ছে
    if (req.auth && req.auth.payload) {
      req.user = {
        id: req.auth.payload.sub, // Auth0 ইউনিক আইডি
        sub: req.auth.payload.sub,
        isGuest: false
      };
      
      // ৩. সব ঠিক থাকলে পরবর্তী ধাপে (Controller) নিয়ে যাওয়া হবে
      next();
    } else {
      // যদি পেলোড (Payload) না পাওয়া যায়
      return res.status(401).json({ 
        error: 'Neural Breakdown',
        msg: 'Authentication token payload missing' 
      });
    }
  });
};

export default authMiddleware;