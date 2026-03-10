const OnyxEngine = {
  faceMesh: null,
  hands: null,
  isInitialized: false,

  async init(onResults) {
    // MediaPipe লাইব্রেরি উইন্ডো অবজেক্টে আছে কি না চেক করা
    const { FaceMesh, Hands } = window;

    if (!FaceMesh || !Hands) {
      console.warn("OnyxEngine: Libraries missing. Retrying...");
      // একটু পর আবার ট্রাই করার জন্য একটি লুপ তৈরি করা যেতে পারে
      return;
    }

    // ফেস মেশ কনফিগারেশন - লোকাল পাথ ব্যবহার করে
    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `/mediapipe/${file}`; 
      },
    });

    // হ্যান্ডস কনফিগারেশন - লোকাল পাথ ব্যবহার করে
    this.hands = new Hands({
      locateFile: (file) => {
        return `/mediapipe/${file}`;
      },
    });

    this.faceMesh.setOptions({ 
      maxNumFaces: 1, 
      refineLandmarks: true, 
      minDetectionConfidence: 0.6, // একটু বাড়ানো হলো স্থায়িত্বের জন্য
      minTrackingConfidence: 0.6
    });
    
    this.hands.setOptions({ 
      maxNumHands: 2, 
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    this.faceMesh.onResults((results) => onResults("FACE", results));
    this.hands.onResults((results) => onResults("HANDS", results));

    try {
      // একসাথে লোড করা
      await Promise.all([this.faceMesh.initialize(), this.hands.initialize()]);
      this.isInitialized = true;
      console.log("🚀 OnyxEngine: Neural Core Synchronized.");
    } catch (err) {
      console.error("Neural OS Warm-up Failed:", err);
      // এখানে রি-ইনিশিয়াল লজিক যোগ করতে পারেন
    }
  },

  async process(videoElement) {
    if (!this.isInitialized || !videoElement || videoElement.readyState !== 4) return;
    try {
      // ভিডিও ফ্রেমগুলো প্রসেস করা
      await this.faceMesh.send({ image: videoElement });
      await this.hands.send({ image: videoElement });
    } catch (err) {
      console.error("Neural Processing Error:", err);
    }
  }
};

export default OnyxEngine;