import Post from "../models/Post.js";
import User from "../models/User.js";
import axios from "axios";

export const processNeuralInput = async (req, res) => {
    try {
        const { text, auth0Id, mood } = req.body;
        const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

        if (!text) {
            return res.status(400).json({ message: "Neural Signal Empty." });
        }

        // ১. ইউজার ভ্যালিডেশন
        const user = await User.findOne({ auth0Id });
        if (!user) return res.status(404).json({ message: "Node not found." });

        // ২. কন্টেন্ট টাইপ ডিটেকশন
        let contentType = text.length > 60 || text.includes("/") ? "REELS" : "POST";
        
        let mediaUrl = "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg"; // Default
        let mediaType = "image";

        // ৩. Pexels API কল (Safety added)
        if (PEXELS_API_KEY) {
            try {
                const query = text.split(" ").slice(0, 3).join(" ") || "abstract";
                
                if (contentType === "REELS") {
                    const response = await axios.get(`https://api.pexels.com/videos/search?query=${query}&per_page=1`, {
                        headers: { Authorization: PEXELS_API_KEY }
                    });
                    // চেক করা হচ্ছে ডেটা আছে কিনা
                    if (response.data.videos && response.data.videos.length > 0) {
                        mediaUrl = response.data.videos[0].video_files[0].link;
                        mediaType = "video";
                    }
                } else {
                    const response = await axios.get(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
                        headers: { Authorization: PEXELS_API_KEY }
                    });
                    if (response.data.photos && response.data.photos.length > 0) {
                        mediaUrl = response.data.photos[0].src.large;
                        mediaType = "image";
                    }
                }
            } catch (apiErr) {
                console.error("Pexels API Error:", apiErr.message);
                // API এরর দিলে ডিফল্ট ইমেজেই থাকবে
            }
        }

        // ৪. পোস্ট অবজেক্ট তৈরি
        const newNeuralContent = new Post({
            author: user.auth0Id,
            authorName: user.name || user.nickname || "Anonymous",
            authorAvatar: user.avatar || user.picture,
            text: text,
            media: mediaUrl,
            mediaType: contentType === "REELS" ? "reel" : mediaType,
            syncRate: (Math.random() * (99 - 85) + 85).toFixed(2),
            likes: [],
            comments: []
        });

        const savedContent = await newNeuralContent.save();

        // ৫. ইউজারের ইমপ্যাক্ট আপডেট (নিশ্চিত করুন মডেলে neuralImpact ফিল্ড আছে)
        if (typeof user.neuralImpact !== 'undefined') {
            user.neuralImpact += 10;
            await user.save();
        }

        return res.status(201).json({
            success: true,
            type: contentType,
            data: savedContent
        });

    } catch (error) {
        console.error("General Server Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};