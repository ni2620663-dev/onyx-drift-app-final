import { auth } from 'express-oauth2-jwt-bearer';

/**
 * Auth0 JWT Validation Configuration
 */
const checkJwt = auth({
  // 🔥 পরিবর্তন: ফ্রন্টএন্ডের main.jsx এর সাথে মিল রেখে এটি পরিবর্তন করা হলো
  audience: 'https://onyx-drift-app-final.onrender.com', 
  issuerBaseURL: 'https://dev-6d0nxccsaycctfl1.us.auth0.com/', 
  tokenSigningAlg: 'RS256'
});

/**
 * 🚀 Smart Auth Middleware
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ১. যদি টোকেন না থাকে (Guest)
  if (!authHeader) {
    req.user = { isGuest: true, id: null };
    return next();
  }

  // ২. টোকেন থাকলে ভেরিফাই করো
  checkJwt(req, res, (err) => {
    if (err) {
      // টোকেন ভুল হলে বা Audience না মিললে এখানে এরর আসবে
      console.warn("⚠️ Token Invalid:", err.message);
      
      // পোস্ট করার সময় যদি টোকেন ইনভ্যালিড হয়, তবে আমরা চাই ইউজার জানুক (৪০১ এরর)
      if (req.method === "POST") {
         return res.status(401).json({ msg: "Session expired or invalid token. Please login again." });
      }
      
      req.user = { isGuest: true, id: null };
      return next();
    }
    
    // ৩. টোকেন ভ্যালিড হলে
    if (req.auth && req.auth.payload) {
      req.user = {
        id: req.auth.payload.sub,
        sub: req.auth.payload.sub,
        isGuest: false
      };
      next();
    } else {
      req.user = { isGuest: true, id: null };
      next();
    }
  });
};

export default authMiddleware;