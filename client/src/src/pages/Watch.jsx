import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { 
  FaPlay, FaRegHeart, FaHeart, FaRegComment, FaShare, 
  FaCheckCircle, FaPaperPlane, FaTimes, FaVideo, FaCloudUploadAlt, FaSpinner,
  FaTv, FaCompass, FaBookmark, FaBolt
} from "react-icons/fa";

const Watch = () => {
  const { user } = useAuth0();
  const [videos, setVideos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadData, setUploadData] = useState({ title: "", file: null });
  const fileInputRef = useRef();

  // ১. এপিআই ইউআরএল সেটআপ
  const BASE_URL = "https://onyx-drift-app-final.onrender.com";

  // ২. ডাটাবেস থেকে ভিডিও নিয়ে আসা
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // এখানে ফিক্স করা হয়েছে: ডাইরেক্ট এন্ডপয়েন্ট কল
        const res = await axios.get(`${BASE_URL}/api/watch`);
        setVideos(res.data);
      } catch (err) {
        console.error("Fetch failed", err);
      }
    };
    fetchVideos();
  }, []);

  // ৩. ভিডিও আপলোড হ্যান্ডলার (Cloudinary + MongoDB)
  const handleUpload = async () => {
    if (!uploadData.title || !uploadData.file) return alert("Title and Video required!");
    
    setLoading(true);
    const formData = new FormData();
    formData.append("file", uploadData.file);
    formData.append("upload_preset", "onyx_upload"); 

    try {
      // Cloudinary তে ভিডিও আপলোড
      const cloudRes = await axios.post(
        "https://api.cloudinary.com/v1_1/dx0cf0ggu/video/upload", 
        formData
      );

      const videoPayload = {
        title: uploadData.title,
        videoUrl: cloudRes.data.secure_url,
        user: user?.name || "Onyx User",
        userImg: user?.picture
      };

      // আপনার সার্ভারে সেভ করা (localhost বদলে BASE_URL ব্যবহার করা হয়েছে)
      const res = await axios.post(`${BASE_URL}/api/watch/upload`, videoPayload);
      setVideos([res.data, ...videos]);
      setIsUploading(false);
      setUploadData({ title: "", file: null });
    } catch (err) {
      alert("Upload failed! Make sure it's a small video.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = (id) => {
    setVideos(videos.map(v => v._id === id ? { ...v, liked: !v.liked, likesCount: v.liked ? v.likesCount - 1 : v.likesCount + 1 } : v));
  };

  return (
    <div className="flex bg-[#050505] min-h-screen">
      
      {/* বাম পাশের মেনু */}
      <div className="hidden xl:flex w-[350px] sticky top-[80px] h-[calc(100vh-80px)] flex-col p-4 border-r border-white/5">
        <h1 className="text-2xl font-black text-white px-4 mb-6">Watch</h1>
        <div className="space-y-1">
          <WatchMenuItem icon={<FaTv />} title="Home" active />
          <WatchMenuItem icon={<FaBolt />} title="Live" />
          <WatchMenuItem icon={<FaCompass />} title="Explore" />
          <WatchMenuItem icon={<FaBookmark />} title="Saved Videos" />
        </div>
      </div>

      {/* মেইন ভিডিও ফিড */}
      <div className="flex-1 max-w-[700px] mx-auto p-4 space-y-6">
        
        {/* উপরের আপলোড বার */}
        <div className="bg-[#1c1c1c] rounded-2xl p-4 border border-white/5 flex items-center gap-4">
          <img src={user?.picture} className="w-10 h-10 rounded-full" alt="" />
          <button 
            onClick={() => setIsUploading(true)}
            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 text-left px-5 py-2.5 rounded-full font-bold transition"
          >
            What video is on your mind?
          </button>
        </div>

        {/* ভিডিও লিস্ট */}
        <div className="space-y-6 pb-20">
          {videos.map(video => (
            <div key={video._id} className="bg-[#1c1c1c] rounded-3xl overflow-hidden border border-white/5 shadow-2xl animate-in fade-in duration-500">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={video.userImg || "https://i.pravatar.cc/100"} className="w-10 h-10 rounded-full border border-blue-500/50" alt="" />
                  <div>
                    <h4 className="font-black text-white text-sm flex items-center gap-1">
                      {video.user} <FaCheckCircle className="text-blue-500 text-[10px]" />
                    </h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Suggested for you</p>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4 text-gray-200 text-sm">{video.title}</div>

              {/* ভিডিও প্লেয়ার */}
              <div className="aspect-video bg-black relative">
                <video 
                  src={video.videoUrl} 
                  controls 
                  className="w-full h-full object-contain"
                  poster={video.thumbnail}
                />
              </div>

              {/* একশন বাটন */}
              <div className="p-2 flex gap-1 border-t border-white/5">
                <ActionButton 
                  icon={video.liked ? <FaHeart className="text-blue-500" /> : <FaRegHeart />} 
                  label={video.likesCount || 0} 
                  active={video.liked} 
                  onClick={() => toggleLike(video._id)} 
                />
                <ActionButton icon={<FaRegComment />} label="Comment" />
                <ActionButton icon={<FaShare />} label="Share" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* আপলোড মোডাল */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[#1c1c1c] w-full max-w-lg rounded-3xl border border-white/10 p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-black text-white">Create Video Post</h2>
              <button onClick={() => setIsUploading(false)} className="text-gray-500"><FaTimes /></button>
            </div>
            
            <input 
              type="text" 
              placeholder="Write a caption..." 
              value={uploadData.title}
              onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none mb-4 focus:border-blue-500"
            />

            <div 
              onClick={() => fileInputRef.current.click()}
              className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center cursor-pointer hover:bg-white/5"
            >
              {loading ? <FaSpinner className="animate-spin text-blue-500 text-3xl" /> : <FaCloudUploadAlt className="text-blue-500 text-4xl mb-2" />}
              <p className="text-gray-400 font-bold text-sm">{uploadData.file ? uploadData.file.name : "Select Video File"}</p>
              <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})} />
            </div>

            <button 
              onClick={handleUpload}
              disabled={loading}
              className={`w-full mt-6 py-4 rounded-xl font-black text-white uppercase transition ${loading ? "bg-gray-700" : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"}`}
            >
              {loading ? "Uploading to Cloud..." : "Post Now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// হেল্পার কম্পোনেন্ট
const WatchMenuItem = ({ icon, title, active }) => (
  <div className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer font-bold transition ${active ? "bg-blue-500/10 text-blue-500" : "text-gray-400 hover:bg-white/5"}`}>
    <div className="text-lg">{icon}</div>
    <span>{title}</span>
  </div>
);

const ActionButton = ({ icon, label, onClick, active }) => (
  <button onClick={onClick} className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition ${active ? "bg-blue-500/10 text-blue-500" : "text-gray-400 hover:bg-white/5"}`}>
    {icon} {label}
  </button>
);

export default Watch;