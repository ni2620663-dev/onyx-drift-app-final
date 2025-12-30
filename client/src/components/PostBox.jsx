import React, { useState } from "react";
import { FaVideo, FaImages, FaRegSmile } from "react-icons/fa";

const PostBox = ({ onPostCreated }) => {
  const [isOpen, setIsOpen] = useState(false); // মডাল ওপেন/ক্লোজ স্টেট
  const [postText, setPostText] = useState("");

  const handlePostSubmit = () => {
    // এখানে আপনার API কল হবে
    console.log("Posting:", postText);
    setPostText("");
    setIsOpen(false);
    if (onPostCreated) onPostCreated();
  };

  return (
    <div className="bg-[#242526] rounded-xl p-4 shadow-md w-full">
      {/* উপরের অংশ: প্রোফাইল পিকচার ও ইনপুট */}
      <div className="flex items-center space-x-3 border-b border-[#3e4042] pb-3">
        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
          N
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#3a3b3c] hover:bg-[#4e4f50] transition-all text-[#b0b3b8] flex-1 text-left py-2 px-4 rounded-full"
        >
          What's on your mind, Naimus?
        </button>
      </div>

      {/* নিচের অংশ: লাইভ, ফটো, ফিলিং বাটন */}
      <div className="flex justify-between mt-2 pt-1">
        <button className="flex items-center space-x-2 hover:bg-[#3a3b3c] p-2 rounded-lg flex-1 justify-center transition">
          <FaVideo className="text-red-500" />
          <span className="text-[#b0b3b8] text-sm font-semibold">Live</span>
        </button>
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 hover:bg-[#3a3b3c] p-2 rounded-lg flex-1 justify-center transition"
        >
          <FaImages className="text-green-500" />
          <span className="text-[#b0b3b8] text-sm font-semibold">Photo</span>
        </button>
        <button className="flex items-center space-x-2 hover:bg-[#3a3b3c] p-2 rounded-lg flex-1 justify-center transition">
          <FaRegSmile className="text-yellow-500" />
          <span className="text-[#b0b3b8] text-sm font-semibold">Feeling</span>
        </button>
      </div>

      {/* --- পোস্ট মডাল (Popup) --- */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-[#242526] w-full max-w-[500px] rounded-lg shadow-2xl border border-[#3e4042]">
            {/* মডাল হেডার */}
            <div className="flex justify-between items-center p-4 border-b border-[#3e4042]">
              <h3 className="text-white text-xl font-bold text-center flex-1">Create post</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-[#3a3b3c] hover:bg-[#4e4f50] text-white rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* মডাল বডি */}
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">N</div>
                <span className="text-white font-semibold">Naimus</span>
              </div>
              
              <textarea
                className="w-full bg-transparent text-white text-lg outline-none resize-none min-h-[150px]"
                placeholder="What's on your mind, Naimus?"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
              ></textarea>

              {/* অ্যাড টু পোস্ট সেকশন */}
              <div className="border border-[#3e4042] rounded-lg p-3 flex justify-between items-center mt-4">
                <span className="text-white font-semibold text-sm">Add to your post</span>
                <div className="flex space-x-3">
                  <FaImages className="text-green-500 text-xl cursor-pointer" />
                  <FaVideo className="text-red-500 text-xl cursor-pointer" />
                  <FaRegSmile className="text-yellow-500 text-xl cursor-pointer" />
                </div>
              </div>

              {/* পোস্ট বাটন */}
              <button
                disabled={!postText.trim()}
                onClick={handlePostSubmit}
                className={`w-full mt-4 py-2 rounded-md font-semibold transition ${
                  postText.trim() ? "bg-[#0866ff] text-white" : "bg-[#505151] text-[#8c8d8e] cursor-not-allowed"
                }`}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostBox;