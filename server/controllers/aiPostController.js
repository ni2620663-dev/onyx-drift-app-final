import Post from "../models/Post.js";
import User from "../models/User.js";
import axios from "axios";

export const processNeuralInput = async (req, res) => {
    try {
        const { text, auth0Id } = req.body;
        const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

        if (!text) return res.status(400).json({ message: "Neural Signal Empty." });

        const user = await User.findOne({ auth0Id });
        if (!user) return res.status(404).json({ message: "Node not found." });

        let contentType = text.length > 60 || text.includes("/") ? "REELS" : "POST";
        let mediaUrl = "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg"; 
        let mediaType = "image";

        if (PEXELS_API_KEY) {
            try {
                const query = text.split(" ").slice(0, 3).join(" ") || "cyberpunk";
                const endpoint = contentType === "REELS" ? "videos" : "v1";
                const resPexels = await axios.get(`https://api.pexels.com/${endpoint}/search?query=${query}&per_page=1`, {
                    headers: { Authorization: PEXELS_API_KEY }
                });
                
                if (contentType === "REELS" && resPexels.data.videos?.[0]) {
                    mediaUrl = resPexels.data.videos[0].video_files[0].link;
                    mediaType = "reel"; // Model enum: 'reel'
                } else if (resPexels.data.photos?.[0]) {
                    mediaUrl = resPexels.data.photos[0].src.large;
                    mediaType = "image";
                }
            } catch (apiErr) { console.error("API Error:", apiErr.message); }
        }

        // মডেল অনুযায়ী সব required ফিল্ড দেওয়া হলো
        const newPost = new Post({
            author: user.auth0Id,           // Required field 1
            authorAuth0Id: user.auth0Id,    // Required field 2
            authorName: user.name || user.nickname || "Anonymous",
            authorAvatar: user.avatar || user.picture,
            text: text,
            media: mediaUrl,
            mediaType: mediaType,
            isAiGenerated: true,
            neuralSyncLevel: (Math.random() * (99 - 85) + 85).toFixed(2)
        });

        await newPost.save();
        
        // Impact update
        user.neuralImpact = (user.neuralImpact || 0) + 10;
        await user.save();

        res.status(201).json({ success: true, data: newPost });
    } catch (err) {
        console.error("AI Post Error:", err);
        res.status(500).json({ message: "Neural Link Overloaded." });
    }
};