import { auth } from 'express-oauth2-jwt-bearer';

/**
 * 🔐 Auth0 JWT Validation Configuration
 */
const checkJwt = auth({
  audience: 'https://onyx-drift-api.com', 
  issuerBaseURL: 'https://dev-prxn6v2o08xp5loz.us.auth0.com/', // আপনার বর্তমান ডোমেইন
  tokenSigningAlg: 'RS256'
});
/**
 * 🚀 Strict Auth Middleware
 * এটি নিশ্চিত করে যে ইউজার ভ্যালিড টোকেন ছাড়া কোনো এপিআই এক্সেস করতে পারবে না।
 */
const authMiddleware = (req, res, next) => {
  checkJwt(req, res, (err) => {
    if (err) {
      console.error("❌ Auth0 Middleware Error:", err.message);
      // টোকেন না থাকলে বা ইনভ্যালিড হলে এখানেই রিকোয়েস্ট আটকে দিবে
      return res.status(401).json({ 
        msg: 'Unauthorized: Neural Signal Lost', 
        error: err.message 
      });
    }
    
    // Auth0 থেকে প্রাপ্ত 'sub' (Subject ID) কে req.user.id হিসেবে সেট করা হচ্ছে
    if (req.auth && req.auth.payload) {
      req.user = {
        id: req.auth.payload.sub,
        sub: req.auth.payload.sub, // ডাবল প্রোটেকশন
        isGuest: false
      };
      next();
    } else {
      return res.status(401).json({ msg: 'Token payload missing' });
    }
  });
};

export default authMiddleware;