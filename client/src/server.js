// client/src/server.js বা src/server.js

// CommonJS 'require' এর পরিবর্তে ES Module 'import' ব্যবহার করুন
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';  // 'path' আমদানি করা হলো
import { fileURLToPath } from 'url'; // Path ঠিক করার জন্য আমদানি করা হলো

// Auth0 JWT Bearer মিডলওয়্যার আমদানি করুন
import { auth } from 'express-oauth2-jwt-bearer';

// .env ফাইল লোড করুন
dotenv.config();

const app = express();

// ⭐⭐ Node.js ES Modules এর জন্য __dirname এবং __filename তৈরি করা ⭐⭐
// Node.js এ __dirname তৈরি করা
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... (আপনার পরিবেশ ভেরিয়েবল এবং CORS কনফিগারেশন) ...
const PORT = process.env.PORT || 10000; 
//... (corsOptions এবং মিডলওয়্যার) ...

app.use(cors(corsOptions));
app.use(express.json());

// ... (Auth0 JWT চেক এবং API রুটস) ...

// --- API রুটস ---
// ... (আপনার /api এবং /api/posts রুটগুলি এখানে থাকবে) ...


// ⭐⭐⭐ স্ট্যাটিক ফাইল পরিবেশন এবং ফ্রন্টএন্ড রাউটিং ফলব্যাক (সংশোধিত) ⭐⭐⭐

// মনোরেপো কাঠামো: রুট ডিরেক্টরি থেকে client/dist এর পাথ
// Render এ, রুট ডিরেক্টরি হলো /opt/render/project/src/
// আমরা নিশ্চিতভাবে /client/dist ফোল্ডারটি খুঁজব।

// path.join() ব্যবহার করে প্রজেক্ট রুটের সাপেক্ষে client/dist এর পাথ তৈরি করা
// এটি নিশ্চিত করবে যে Express /client/dist ফোল্ডারের স্ট্যাটিক অ্যাসেটগুলো খুঁজে পাবে।
const buildPath = path.join(__dirname, '..', 'client', 'dist');


// 3. স্ট্যাটিক ফাইল পরিবেশন
app.use(express.static(buildPath));

// 4. ক্লায়েন্ট-সাইড রাউটিং-এর জন্য ক্যাচ-অল রুট (ফলব্যাক)
app.get('*', (req, res) => {
    // index.html ফাইলটি dist ফোল্ডারের মধ্যে থাকবে
    res.sendFile(path.join(buildPath, 'index.html'));
});

// --- সার্ভার চালু করুন ---
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});