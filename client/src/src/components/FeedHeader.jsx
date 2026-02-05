import React, { useRef } from "react";
// SweetAlert2 ব্যবহার করলে সুন্দর পপআপ আসবে, নাহলে সাধারণ alert ও চলে
// npm install sweetalert2
import Swal from 'sweetalert2';

const FeedHeader = () => {
  // গ্যালারি ওপেন করার জন্য রিফ (Ref)
  const fileInputRef = useRef(null);

  // ১. স্টোরি ক্লিক হ্যান্ডলার
  const handleStoryClick = () => {
    alert("Story Clicked!");
  };

  // ২. ফটো/গ্যালারি ক্লিক হ্যান্ডলার
  const handlePhotoClick = () => {
    fileInputRef.current.click(); // ইনপুট ফাইল ডায়ালগ ওপেন করবে
  };

  // ৩. লাইভ ক্লিক হ্যান্ডলার
  const handleLiveClick = () => {
    Swal.fire({
      title: 'Go Live?',
      text: "Do you want to start a live broadcast?",
      icon: 'video',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Start Live'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log("Live feature starting...");
      }
    });
  };

  // ৪. ফিলিংস ক্লিক হ্যান্ডলার
  const handleFeelingClick = () => {
    const feelings = ["😊 Happy", "😇 Blessed", "🥰 Loved", "😔 Sad", "😡 Angry", "🥳 Excited"];
    Swal.fire({
      title: 'How are you feeling?',
      input: 'select',
      inputOptions: {
        'Happy': '😊 Happy',
        'Sad': '😔 Sad',
        'Excited': '🥳 Excited',
        'Angry': '😡 Angry'
      },
      placeholder: 'Select a feeling',
      showCancelButton: true
    });
  };

  return (
    <div className="bg-[#242526] rounded-xl p-4 shadow-md text-gray-300 w-full max-w-xl mx-auto">
      {/* ইনপুট বক্স */}
      <div className="flex gap-3 items-center mb-4 border-b border-gray-700 pb-4">
        <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center font-bold text-white text-xl">
          N
        </div>
        <input 
          type="text" 
          placeholder="What's on your mind, Naimus?" 
          className="bg-[#3a3b3c] hover:bg-[#4e4f50] cursor-pointer rounded-full flex-1 py-2 px-4 outline-none text-sm"
        />
      </div>

      {/* বাটন্স সেকশন */}
      <div className="flex justify-between items-center text-sm font-semibold">
        {/* লাইভ বাটন */}
        <div onClick={handleLiveClick} className="flex-1 flex justify-center items-center gap-2 py-2 hover:bg-[#3a3b3c] rounded-lg cursor-pointer transition">
          <span className="text-red-500 text-xl">📹</span> Live Video
        </div>

        {/* ফটো বাটন */}
        <div onClick={handlePhotoClick} className="flex-1 flex justify-center items-center gap-2 py-2 hover:bg-[#3a3b3c] rounded-lg cursor-pointer transition">
          <span className="text-green-500 text-xl">🖼️</span> Photo/video
          {/* হিডেন ইনপুট যা গ্যালারি ওপেন করবে */}
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*,video/*"
            onChange={(e) => console.log(e.target.files[0])}
          />
        </div>

        {/* ফিলিংস বাটন */}
        <div onClick={handleFeelingClick} className="flex-1 flex justify-center items-center gap-2 py-2 hover:bg-[#3a3b3c] rounded-lg cursor-pointer transition">
          <span className="text-yellow-500 text-xl">😊</span> Feeling/activity
        </div>
      </div>

      {/* স্টোরি সেকশন (আপনার ড্রয়িং অনুযায়ী) */}
      <div className="flex gap-2 mt-4 overflow-x-auto pt-2">
        <div 
          onClick={handleStoryClick}
          className="relative w-28 h-48 rounded-xl overflow-hidden cursor-pointer group shrink-0"
        >
          <div className="w-full h-3/4 bg-orange-600 flex items-center justify-center text-white text-4xl font-bold">N</div>
          <div className="absolute bottom-0 w-full h-1/4 bg-[#242526] flex flex-col items-center justify-center">
            <div className="absolute -top-4 bg-blue-600 rounded-full p-1 border-4 border-[#242526] group-hover:scale-110 transition">
              ➕
            </div>
            <span className="text-[10px] mt-2 font-bold">Create story</span>
          </div>
        </div>
        {/* অন্যান্য স্টোরিগুলো এখানে লুপ হবে */}
      </div>
    </div>
  );
};

export default FeedHeader;