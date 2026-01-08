import React, { useState } from 'react';
import { Image as ImageIcon, Film, PlayCircle, Send, X, Sparkles } from 'lucide-react';
import axios from 'axios';

const PostCreator = () => {
  const [postType, setPostType] = useState('photo');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // ১. AI দিয়ে টেক্সট সুন্দর করার ফাংশন
  const enhanceAI = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const res = await axios.post('https://onyx-drift-app-final.onrender.com/api/ai/enhance', { prompt: content });
      setContent(res.data.enhancedText);
    } catch (err) { console.error("AI Error", err); }
    finally { setLoading(false); }
  };

  // ২. ডাটা ট্রান্সমিট (Cloudinary + MongoDB)
  const handleTransmit = async () => {
    if (!file || !content) return alert("Missing content or file!");
    setLoading(true);
    
    try {
      // ফাইলটিকে Base64 এ রূপান্তর
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result;

        // ব্যাকেন্ডে পাঠানো (Cloudinary আপলোড হবে)
        const uploadRes = await axios.post('https://onyx-drift-app-final.onrender.com/api/upload', { image: base64Data });
        
        // ফাইনাল পোস্ট সেভ
        await axios.post('https://onyx-drift-app-final.onrender.com/api/posts', {
          content,
          image: uploadRes.data.url,
          type: postType
        });

        alert("📡 Transmission Successful!");
        setFile(null);
        setContent('');
      };
    } catch (err) {
      alert("❌ Transmission Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#151515] rounded-[2.5rem] border border-white/5 p-6 shadow-xl">
      {/* Post Type Selectors */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setPostType('photo')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black tracking-widest flex items-center justify-center gap-2 transition-all ${postType === 'photo' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-400'}`}><ImageIcon size={16}/> PHOTO</button>
        <button onClick={() => setPostType('video')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black tracking-widest flex items-center justify-center gap-2 transition-all ${postType === 'video' ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400'}`}><Film size={16}/> VIDEO</button>
        <button onClick={() => setPostType('reel')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black tracking-widest flex items-center justify-center gap-2 transition-all ${postType === 'reel' ? 'bg-rose-500 text-white' : 'bg-white/5 text-gray-400'}`}><PlayCircle size={16}/> REELS</button>
      </div>

      <textarea 
        className="w-full bg-transparent border-none outline-none text-gray-300 placeholder:text-gray-600 text-sm resize-none h-20"
        placeholder={`What's drifting in your mind? #${postType}...`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {file && (
        <div className="relative mb-4 rounded-2xl overflow-hidden border border-white/10">
          <img src={URL.createObjectURL(file)} className="w-full h-48 object-cover" />
          <button onClick={() => setFile(null)} className="absolute top-2 right-2 p-1 bg-black rounded-full"><X size={16} className="text-white"/></button>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex gap-2">
            <label className="cursor-pointer p-3 bg-white/5 rounded-xl text-cyan-400 hover:bg-white/10 transition-all">
                <ImageIcon size={20} />
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} accept={postType === 'photo' ? 'image/*' : 'video/*'} />
            </label>
            <button onClick={enhanceAI} className="p-3 bg-white/5 rounded-xl text-yellow-400 hover:bg-white/10 transition-all">
                <Sparkles size={20} />
            </button>
        </div>
        
        <button 
            onClick={handleTransmit}
            disabled={loading}
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-cyan-400 transition-all disabled:opacity-50"
        >
          {loading ? 'Transmitting...' : 'Transmit'} <Send size={14} />
        </button>
      </div>
    </div>
  );
};

export default PostCreator;