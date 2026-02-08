import Post from "../models/Post.js";
import User from "../models/User.js";
import axios from "axios";

export const processNeuralInput = async (req, res) => {
    try {
        const { text, auth0Id, mood } = req.body;
        const PEXELS_API_KEY = process.env.PEXELS_API_KEY; // আপনার .env ফাইলে কি-টি রাখুন

        if (!text) {
            return res.status(400).json({ message: "Neural Signal Empty." });
        }

        // ১. কন্টেন্ট টাইপ ডিটেকশন
        let contentType = text.length > 60 || text.includes("/") ? "REELS" : "POST";
        
        // ২. ইউজার ভ্যালিডেশন
        const user = await User.findOne({ auth0Id });
        if (!user) return res.status(404).json({ message: "Node not found." });

        let mediaUrl = "";
        let mediaType = "image";

        // ৩. Pexels API থেকে ভিডিও/ইমেজ খোঁজা
        try {
            const query = text.split(" ").slice(0, 3).join(" "); // প্রথম ৩টি শব্দকে কী-ওয়ার্ড হিসেবে নেওয়া
            
            if (contentType === "REELS") {
                const response = await axios.get(`https://api.pexels.com/videos/search?query=${query}&per_page=1`, {
                    headers: { Authorization: PEXELS_API_KEY }
                });
                mediaUrl = response.data.videos[0]?.video_files[0]?.link || "";
                mediaType = "video";
            } else {
                const response = await axios.get(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
                    headers: { Authorization: PEXELS_API_KEY }
                });
                mediaUrl = response.data.photos[0]?.src?.large || "";
                mediaType = "image";
            }
        } catch (apiErr) {
            console.error("Pexels API Error:", apiErr.message);
            // API ফেল করলে একটি ডিফল্ট নিউরাল ইমেজ দেওয়া
            mediaUrl = "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg"; 
        }

        // ৪. পোস্ট অবজেক্ট তৈরি
        const newNeuralContent = new Post({
            author: user.auth0Id,
            authorName: user.name,
            authorAvatar: user.avatar,
            text: text,
            media: mediaUrl,
            mediaType: contentType === "REELS" ? "reel" : mediaType,
            syncRate: (Math.random() * (99 - 85) + 85).toFixed(2), // ৮৫-৯৯% এর মধ্যে র‍্যান্ডম সিনক্রোনাইজেশন
            likes: [],
            comments: []
        });

        const savedContent = await newNeuralContent.save();

        // ৫. ইউজারের ইমপ্যাক্ট বাড়ানো
        user.neuralImpact += 10;
        await user.save();

        res.status(201).json({
            success: true,
            type: contentType,
            data: savedContent
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};