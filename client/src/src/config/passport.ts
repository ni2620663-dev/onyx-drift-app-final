// src/config/passport.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import { Application } from 'express';

// ENV Variables থেকে লোড করুন
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'আপনার_GOOGLE_CLIENT_ID_এখানে';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'আপনার_GOOGLE_CLIENT_SECRET_এখানে';

// (এটি শুধুমাত্র উদাহরণ। আপনার নিজস্ব ইউজার টাইপ ব্যবহার করুন)
interface UserProfile {
    id: string;
    displayName: string;
    // ডাটাবেস থেকে অন্যান্য তথ্য
}

export const configurePassport = (app: Application) => {
    
    // Express সেশন সেটআপ
    app.use(session({
        secret: process.env.SESSION_SECRET || 'a_strong_session_secret',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: process.env.NODE_ENV === 'production' }
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());

    // সেশন সিরিয়ালাইজেশন এবং ডিসিরিয়ালাইজেশন
    // ইউজার যখন সফলভাবে লগইন করবে, তখন Passport এই ইউজারকে কীভাবে সেশনে রাখবে?
    passport.serializeUser((user: any, done) => {
        // আমরা ইউজার অবজেক্টের শুধু Google ID-টি সেশনে রাখছি
        done(null, user.id); 
    });

    // যখন প্রতি রিকোয়েস্টে সেশন থেকে ইউজারকে পুনরুদ্ধার করা হবে
    passport.deserializeUser(async (id: string, done) => {
        // **ডাটাবেস সিমুলেশন:** এখানে আপনি ডাটাবেসে এই 'id' দিয়ে ইউজারকে খুঁজে বের করবেন।
        // const user = await User.findById(id); 
        
        // আপাতত একটি ডামি ইউজার অবজেক্ট রিটার্ন করা হলো
        const user: UserProfile = { id: id, displayName: `User-${id}` }; 
        done(null, user);
    });

    // Google Strategy কনফিগারেশন
    passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        // এটি Google Cloud Console-এ সেট করা Authorized redirect URIs এর সাথে মিলতে হবে
        callbackURL: "/auth/google/callback", 
        // আপনি email এবং profile অ্যাক্সেস চাইছেন
        scope: ['profile', 'email'],
    },
    // verify callback ফাংশন
    function(accessToken, refreshToken, profile, done) {
        // এই ফাংশনটি সফলভাবে Google থেকে তথ্য পাওয়ার পর কল হয়
        
        console.log("--- Google Profile Received ---");
        console.log(`Email: ${profile.emails?.[0]?.value}`);
        console.log(`Name: ${profile.displayName}`);
        
        // **ডাটাবেস লজিক:**
        // ১. `profile.id` ব্যবহার করে আপনার ডাটাবেসে এই ইউজারটি খুঁজুন।
        // ২. যদি খুঁজে পান, `foundUser` কে রিটার্ন করুন।
        // ৩. যদি না পান, নতুন ইউজার তৈরি করে তাকে রিটার্ন করুন।

        // User.findOrCreate({ googleId: profile.id }, function (err, user) {
        //     return done(err, user);
        // });
        
        // **আপাতত টেস্টিং এর জন্য:**
        return done(null, profile); // প্রোফাইলটি সরাসরি serializeUser-এ পাঠানো হলো
    }));
};