import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';

// User Serialization
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// --- Google Strategy ---
// ১০০ মিলিয়ন ইউজারের স্কেলেবিলিটির জন্য প্রক্সি সাপোর্ট অ্যাড করা হয়েছে
if (process.env.GOOGLE_CLIENT_ID) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        proxy: true // Render বা Cloud-এ থাকলে এটি জরুরি
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                user = await User.create({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    profilePic: profile.photos[0].value,
                    isVerified: true // OAuth ইউজাররা সাধারণত ভেরিফাইড হয়
                });
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
}

// --- Facebook Strategy ---
if (process.env.FACEBOOK_APP_ID) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "/api/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'photos', 'email'],
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ facebookId: profile.id });
            if (!user) {
                user = await User.create({
                    facebookId: profile.id,
                    name: profile.displayName,
                    email: profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
                    profilePic: profile.photos?.[0]?.value || ""
                });
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));
}

export default passport;