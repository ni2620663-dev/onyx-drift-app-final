/**
 * OnyxDrift Neural Core - Hand Gesture Engine
 * এটি MediaPipe Hands এর ল্যান্ডমার্ক ব্যবহার করে জেসচার শনাক্ত করে।
 */
class HandGestureEngine {
  /**
   * ল্যান্ডমার্ক থেকে জেসচার ডিটেক্ট করার মূল ফাংশন
   * @param {Array} landmarks - ২১টি হ্যান্ড ল্যান্ডমার্কের অ্যারে
   */
  static detectGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) return "NONE";

    // ১. প্রয়োজনীয় ল্যান্ডমার্ক পয়েন্টগুলো (Tips & Joints)
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];
    const indexTip = landmarks[8];
    const indexBase = landmarks[5]; // Index MCP joint
    const middleTip = landmarks[12];
    const middleBase = landmarks[9];
    const ringTip = landmarks[16];
    const ringBase = landmarks[13];
    const pinkyTip = landmarks[20];
    const pinkyBase = landmarks[17];

    // ২. আঙ্গুলগুলো কি খোলা (Open)? 
    // লজিক: ডগা যদি বেস জয়েন্টের উপরে থাকে (y অক্ষ ছোট মানে স্ক্রিনের উপরে)
    const isIndexOpen = indexTip.y < landmarks[6].y;
    const isMiddleOpen = middleTip.y < landmarks[10].y;
    const isRingOpen = ringTip.y < landmarks[14].y;
    const isPinkyOpen = pinkyTip.y < landmarks[18].y;
    
    // থাম্ব ওপেন কি না তা বের করতে x-অক্ষ চেক করা ভালো (হাত ডান না বাম তার ওপর নির্ভর করে)
    const isThumbOpen = Math.abs(thumbTip.x - landmarks[17].x) > 0.1;

    

    // ৩. THUMBS_UP লজিক:
    // থাম্ব উপরে থাকবে এবং বাকি সব আঙ্গুল মুষ্টিবদ্ধ (folded) থাকবে।
    if (
      thumbTip.y < thumbBase.y && 
      !isIndexOpen && 
      !isMiddleOpen && 
      !isRingOpen && 
      !isPinkyOpen
    ) {
      return "THUMBS_UP";
    }

    // ৪. VICTORY (V) / PEACE SIGN লজিক:
    // ইনডেক্স এবং মিডল ওপেন থাকবে, বাকিগুলো ফোল্ডেড।
    if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) {
      return "VICTORY";
    }

    // ৫. OK SIGN লজিক:
    // থাম্ব এবং ইনডেক্স এর ডগা একে অপরের খুব কাছে থাকবে।
    const thumbIndexDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
    if (thumbIndexDist < 0.05 && isMiddleOpen && isRingOpen) {
      return "OK_SIGN";
    }

    // ৬. SWIPE লজিক:
    // যখন পুরো হাত খোলা থাকে এবং নির্দিষ্ট সীমানা অতিক্রম করে।
    if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) {
      // স্ক্রিনের ৩০% এর বামে থাকলে Left, ৭০% এর ডানে থাকলে Right
      if (indexTip.x < 0.3) return "SWIPE_LEFT";
      if (indexTip.x > 0.7) return "SWIPE_RIGHT";
      
      return "OPEN_PALM"; // হাত খোলা কিন্তু সোয়াইপ হয়নি
    }

    // ৭. LIKE_MESSAGE (Gesture Trigger for AI)
    // এটি আপনার সকেটে পাঠানোর জন্য সিগন্যাল হিসেবে কাজ করবে
    if (isThumbOpen && !isIndexOpen && !isMiddleOpen) {
       // এটি একটি থাম্ব-আউট জেসচার (যেমন মেসেজে লাইক দেওয়া)
       return "NEURAL_LIKE";
    }

    return "NONE";
  }
}

export default HandGestureEngine;