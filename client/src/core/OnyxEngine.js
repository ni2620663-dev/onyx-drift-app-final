// src/core/OnyxEngine.js
// MediaPipe-এর ক্লায়েন্ট সাইড লাইব্রেরিগুলো ইমপোর্ট করুন
import "@mediapipe/face_mesh";
import "@mediapipe/hands";

const OnyxEngine = {
  faceMesh: null,
  hands: null,
  
  async init(onResults) {
    // উইন্ডো অবজেক্ট থেকে কনস্ট্রাক্টরগুলো সরাসরি এক্সেস করুন 
    // এটি বিল্ড টুলের 'tree-shaking' বা মডিউল ইস্যু এড়িয়ে চলে
    const { FaceMesh, Hands } = window;

    if (!FaceMesh || !Hands) {
      throw new Error("MediaPipe libraries not loaded globally.");
    }

    this.faceMesh = new FaceMesh({
      locateFile: (file) => `/models/mediapipe/${file}`,
    });

    this.hands = new Hands({
      locateFile: (file) => `/models/mediapipe/${file}`,
    });

    this.faceMesh.setOptions({ 
      maxNumFaces: 1, 
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    this.hands.setOptions({ 
      maxNumHands: 2, 
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults((results) => onResults("FACE", results));
    this.hands.onResults((results) => onResults("HANDS", results));

    // ফাইলগুলো আগে থেকে লোড হওয়ার জন্য ইনিশিয়ালাইজেশন
    await Promise.all([
      this.faceMesh.initialize(),
      this.hands.initialize()
    ]);
  },

  async process(videoElement) {
    if (!videoElement || videoElement.readyState !== 4) return;
    
    try {
      await Promise.all([
        this.faceMesh.send({ image: videoElement }),
        this.hands.send({ image: videoElement })
      ]);
    } catch (err) {
      console.warn("OnyxEngine: Pipeline processing skipped.", err);
    }
  }
};

export default OnyxEngine;