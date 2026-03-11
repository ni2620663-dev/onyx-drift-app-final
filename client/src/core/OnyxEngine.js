import { FaceMesh } from "@mediapipe/face_mesh";
import { Hands } from "@mediapipe/hands";

const OnyxEngine = {
  faceMesh: null,
  hands: null,
  isInitialized: false,

  async init(onResults) {
    if (this.isInitialized) return;

    // MediaPipe এর জন্য সঠিক পাথ কনফিগারেশন
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    // কনফিগারেশন
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    faceMesh.onResults((results) => onResults("FACE", results));
    hands.onResults((results) => onResults("HANDS", results));

    this.faceMesh = faceMesh;
    this.hands = hands;

    // ইনিশিয়ালাইজেশন সিকোয়েন্স
    await this.faceMesh.initialize();
    await this.hands.initialize();
    
    this.isInitialized = true;
    console.log("🚀 OnyxEngine: Neural Core Fully Operational.");
  },

  async process(videoElement) {
    if (!this.isInitialized) return;
    
    // আলাদাভাবে সেন্ড করা, প্রমিজ একসাথে রান না করে সিরিয়ালি করা বেশি স্ট্যাবল
    try {
      await this.faceMesh.send({ image: videoElement });
      await this.hands.send({ image: videoElement });
    } catch (err) {
      console.warn("Onyx Engine skipped frame:", err.message);
    }
  },

  async terminate() {
    if (this.faceMesh) await this.faceMesh.close();
    if (this.hands) await this.hands.close();
    this.isInitialized = false;
  }
};

export default OnyxEngine;