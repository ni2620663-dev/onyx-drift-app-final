import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaImage, FaMicrophone, FaPaperPlane, FaMagic, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';
import { BRAND_NAME, AI_NAME } from '../utils/constants';

const PostBox = ({ user, onPostCreated }) => {
  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const fileInputRef = useRef(null);
  const { getAccessTokenSilently } = useAuth0();

  // ১. এপিআই ইউআরএল কনফিগ
  const API_URL = import.meta.env.VITE_API_URL || "https://onyx-drift-api-server.onrender.com";

  // --- মিডিয়া সিলেক্ট হ্যান্ডলার ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // --- AI Magic Function ---
  const handleAIEnhance = async () => {
    if (!text.trim()) return alert("Write something first for the magic to work!");
    
    setIsEnhancing(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `${API_URL}/api/ai/enhance`, 
        { prompt: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.enhancedText) {
        setText(response.data.enhancedText);
      }
    } catch (error) {
      console.error("AI Magic Error:", error);
      alert("The AI cosmos is busy. Try again in a moment!");
    } finally {
      setIsEnhancing(false);
    }
  };

  // --- পোস্ট সাবমিট ফাংশন (Enterprise logic) ---
  const handlePost = async () => {
    if (!text.trim() && !selectedFile) return;
    
    setIsPosting(true);
    try {
      const token = await getAccessTokenSilently();
      
      // FormData ব্যবহার করা হয়েছে যাতে ইমেজ এবং টেক্সট একসাথে যায় (৪০০ এরর ফিক্স করবে)
      const formData = new FormData();
      formData.append("desc", text);
      formData.append("authorName", user?.nickname || user?.name || "Anonymous");
      formData.append("authorAvatar", user?.picture || "");
      
      if (selectedFile) {
        formData.append("media", selectedFile);
      }

      const response = await axios.post(
        `${API_URL}/api/posts`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data" 
          } 
        }
      );

      if (response.status === 200 || response.status === 201) {
        setText("");
        setSelectedFile(null);
        setPreviewUrl(null);
        if (onPostCreated) onPostCreated();
      }
    } catch (error) {
      console.error("Error creating post:", error.response?.data || error.message);
      alert("Transmission failed. The core rejected the signal.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl"
    >
      <div className="flex gap-4 items-start">
        <img 
          src={user?.picture || "https://placehold.jp/150x150.png"} 
          className="w-12 h-12 rounded-2xl border border-white/10 object-cover shadow-neon-blue"
          alt="User"
        />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isEnhancing ? `${AI_NAME} is weaving magic...` : `What's on your mind, ${user?.nickname || 'Drifter'}?`}
            className={`w-full bg-transparent border-none outline-none text-white text-sm placeholder:text-gray-600 resize-none h-20 pt-2 font-light tracking-wide transition-all ${isEnhancing ? 'opacity-50 blur-[1px]' : 'opacity-100'}`}
          />

          {/* ইমেজ প্রিভিউ এরিয়া */}
          <AnimatePresence>
            {previewUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative mt-2 inline-block"
              >
                <img src={previewUrl} className="w-full max-h-48 rounded-2xl border border-white/10 object-cover" alt="Preview" />
                <button 
                  onClick={() => {setSelectedFile(null); setPreviewUrl(null);}}
                  className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white hover:bg-red-500/50 transition-colors"
                >
                  <FaTimes />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <div className="flex gap-4">
          {/* মিডিয়া বাটন */}
          <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" />
          <motion.button 
            onClick={() => fileInputRef.current.click()}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-2 text-gray-400 hover:text-cyan-neon transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <FaImage className="text-lg" />
            <span className="hidden sm:block">Media</span>
          </motion.button>

          {/* AI Magic Button */}
          <motion.button 
            onClick={handleAIEnhance}
            disabled={isEnhancing || !text.trim()}
            whileTap={{ scale: 0.9 }}
            className={`flex items-center gap-2 transition-all text-xs font-bold uppercase tracking-widest ${isEnhancing ? 'text-purple-neon animate-pulse' : 'text-gray-400 hover:text-purple-neon'}`}
          >
            <FaMagic className="text-lg" />
            <span className="hidden sm:block">{isEnhancing ? 'Enhancing...' : `${BRAND_NAME} Magic`}</span>
          </motion.button>
        </div>

        <div className="flex gap-3">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="bg-white/5 p-3 rounded-2xl text-cyan-neon border border-white/5 hover:bg-white/10"
          >
            <FaMicrophone />
          </motion.button>
          
          <motion.button 
            onClick={handlePost}
            whileTap={{ scale: 0.95 }}
            disabled={(text.length === 0 && !selectedFile) || isPosting || isEnhancing}
            className={`px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all
              ${(text.length > 0 || selectedFile) && !isPosting
                ? 'bg-gradient-to-r from-cyan-neon to-purple-neon text-black shadow-neon-blue' 
                : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'}`}
          >
            {isPosting ? 'Broadcasting...' : 'Broadcast Signal'} <FaPaperPlane />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default PostBox;