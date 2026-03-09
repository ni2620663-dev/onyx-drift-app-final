class HandGestureEngine {
  static detectGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) return "NONE";

    // ১. প্রয়োজনীয় ল্যান্ডমার্ক পয়েন্টগুলো চিহ্নিত করা
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3]; // থাম্ব জয়েন্ট
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    // ২. আঙ্গুলগুলো কি ভাঁজ করা (Folded)? 
    // যদি আঙ্গুলের ডগা (Tip) তার নিচের জয়েন্টের চেয়ে নিচে থাকে, তবে সেটি ভাঁজ করা।
    const isIndexFolded = indexTip.y > landmarks[6].y;
    const isMiddleFolded = middleTip.y > landmarks[10].y;
    const isRingFolded = ringTip.y > landmarks[14].y;
    const isPinkyFolded = pinkyTip.y > landmarks[18].y;

    // ৩. THUMBS_UP লজিক:
    // থাম্ব উপরে থাকবে এবং বাকি সব আঙ্গুল মুষ্টিবদ্ধ (folded) থাকবে।
    if (
      thumbTip.y < thumbIP.y &&      // থাম্ব উপরে
      thumbTip.y < indexTip.y &&     // থাম্ব ইনডেক্স থেকে উপরে
      isIndexFolded &&               // ইনডেক্স ভাঁজ করা
      isMiddleFolded &&              // মিডল ভাঁজ করা
      isRingFolded                   // রিং ফিঙ্গার ভাঁজ করা
    ) {
      return "THUMBS_UP";
    }

    // ৪. SWIPE_LEFT / SWIPE_RIGHT লজিক (বোনাস):
    // যদি সব আঙ্গুল খোলা থাকে এবং হাত ডানে বা বামে যায়
    if (!isIndexFolded && !isMiddleFolded && !isRingFolded) {
        if (indexTip.x < 0.3) return "SWIPE_LEFT";
        if (indexTip.x > 0.7) return "SWIPE_RIGHT";
    }

    return "NONE";
  }
}

export default HandGestureEngine;