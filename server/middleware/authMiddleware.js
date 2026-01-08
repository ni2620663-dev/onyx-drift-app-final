import { auth } from 'express-oauth2-jwt-bearer';

/**
 * Auth0 JWT Validation Configuration
 * এটি আপনার কাস্টম এপিআই আইডেন্টিফায়ার ব্যবহার করে টোকেন ভেরিফাই করবে.
 */
const checkJwt = auth({
  audience: 'https://onyx-drift-api.com', // আপনার স্ক্রিনশট অনুযায়ী সঠিক Identifier
  issuerBaseURL: 'https://dev-6d0nxccsaycctfl1.us.auth0.com/', // আপনার Auth0 Domain
  tokenSigningAlg: 'RS256'
});

/**
 * Custom Auth Middleware
 * টোকেন ভেরিফাই করার পর 'sub' আইডিকে req.user.id-তে সেট করে.
 */
const authMiddleware = (req, res, next) => {
  checkJwt(req, res, (err) => {
    if (err) {
      console.error("❌ Auth0 Middleware Error:", err.message);
      return res.status(401).json({ 
        msg: 'Unauthorized: Access Denied', 
        error: err.message 
      });
    }
    
    if (req.auth && req.auth.payload) {
      req.user = {
        id: req.auth.payload.sub // এটি আপনার MongoDB-তে ইউজার ট্র্যাক করতে সাহায্য করবে
      };
      next();
    } else {
      return res.status(401).json({ msg: 'Token payload missing' });
    }
  });
};

export default authMiddleware;