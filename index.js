import express from "express";
import cors from "cors";

const app = express();

// 1. CORS middleware: এটি নিশ্চিত করে যে ফ্রন্টএন্ড থেকে আসা অনুরোধগুলি অনুমোদিত।
app.use(cors());

// 2. JSON middleware: এটি incoming request body (POST/PUT রিকোয়েস্টের ডেটা) কে JSON ফরমেটে পার্স করে।
app.use(express.json());

// --- রুট রাউট (সার্ভার হেলথ চেক) ---
// Render-এ Cannot GET / ত্রুটি এড়াতে এই রাউটটি অপরিহার্য।
app.get('/', (req, res) => {
    res.status(200).send("OnyxDrift Backend Server is Live and Operational!");
});

// --- API রাউট ---

// Example login route
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    // Dummy check (আসল প্রোজেক্টে ডেটাবেস চেক হবে)
    if (email === "test@example.com" && password === "123456") {
        res.json({ success: true, message: "Login successful" });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});


// Render-এর পরিবেশ থেকে PORT ব্যবহার করুন, না পেলে 5000 ব্যবহার করুন।
const PORT = process.env.PORT || 5000; 

// Server listen
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));