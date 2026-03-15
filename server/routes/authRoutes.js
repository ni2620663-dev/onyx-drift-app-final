import express from 'express';
import passport from 'passport';
const router = express.Router();

// --- ১. গুগল লগইন শুরু ---
// ইউজার যখন গুগল বাটনে ক্লিক করবে, তখন এই রাউটে আসবে
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}));

// --- ২. গুগল লগইন কলব্যাক (Callback) ---
// গুগল থেকে লগইন শেষ করে ইউজার এই ঠিকানায় ফিরে আসবে
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login' }), 
    (req, res) => {
        // লগইন সফল হলে ফ্রন্টএন্ডের ফিড পেজে পাঠিয়ে দেবে
        res.redirect('http://localhost:5173/feed'); 
    }
);

// --- ৩. ফেসবুক লগইন শুরু ---
router.get('/facebook', passport.authenticate('facebook', { 
    scope: ['email'] 
}));

// --- ৪. ফেসবুক লগইন কলব্যাক (Callback) ---
router.get('/facebook/callback', 
    passport.authenticate('facebook', { failureRedirect: 'http://localhost:5173/login' }), 
    (req, res) => {
        res.redirect('http://localhost:5173/feed');
    }
);

// --- ৫. লগআউট (Logout) ---
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('http://localhost:5173/');
    });
});

// --- ৬. বর্তমান ইউজারের তথ্য চেক করা ---
router.get('/current_user', (req, res) => {
    res.send(req.user);
});

export default router;
