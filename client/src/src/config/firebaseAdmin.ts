import * as admin from 'firebase-admin';

// লোকাল এবং প্রোডাকশনের জন্য কনফিগারেশন হ্যান্ডেল করা
const initializeFirebaseAdmin = () => {
    // Render/Production এ, আমরা ENUM ব্যবহার করব
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        
        // 1. এনভায়রনমেন্ট ভ্যারিয়েবল থেকে JSON স্ট্রিং লোড করুন
        const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        
        // 2. স্ট্রিংটিকে JSON অবজেক্টে রূপান্তর করুন
        const serviceAccount = JSON.parse(serviceAccountJsonString);

        admin.initializeApp({
            // 3. রূপান্তর করা JSON অবজেক্ট ব্যবহার করে ইনিশিয়ালাইজ করুন
            credential: admin.credential.cert(serviceAccount),
        });
        
        console.log("Firebase Admin Initialized using Render Environment Variables.");

    } 
    // লোকাল টেস্টিং এর জন্য, আমরা এখনও ফাইলটি ব্যবহার করতে পারি
    else if (process.env.NODE_ENV !== 'production') {
        // Warning: This path still requires the file to be present locally
        const serviceAccount = require('./serviceAccount.json');
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        
        console.log("Firebase Admin Initialized using Local serviceAccount.json file.");
    }
    else {
        console.error("ERROR: FIREBASE_SERVICE_ACCOUNT_JSON is missing in production environment!");
    }
};

initializeFirebaseAdmin();

// আপনার auth ভেরিফিকেশন ফাংশন
export const verifyIdToken = async (idToken: string) => {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        throw new Error('Invalid or expired token.');
    }
};