import { FaceMesh } from '@mediapipe/face_mesh';
import { Hands } from '@mediapipe/hands';

const OnyxEngine = {
  faceMesh: null,
  hands: null,
  isInitialized: false,

  async init(onResults) {
    if (this.isInitialized) return;

    try {
      // CDN ব্যবহার করে ফাইল পাথ কনফিগারেশন
      const baseCdnUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/";

      this.faceMesh = new FaceMesh({
        locateFile: (file) => `${baseCdnUrl}face_mesh/${file}`
      });

      this.hands = new Hands({
        locateFile: (file) => `${baseCdnUrl}hands/${file}`
      });

      // অপশন সেটআপ
      this.faceMesh.setOptions({ 
        maxNumFaces: 1, 
        refineLandmarks: true, 
        minDetectionConfidence: 0.6, 
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

      // সিরিয়াল বুটিং (WASM লোড হওয়ার জন্য অপেক্ষা)
      console.log("🧬 OnyxEngine: Booting Neural Core via CDN...");
      
      await this.faceMesh.initialize();
      await this.hands.initialize();
      
      this.isInitialized = true;
      console.log("🚀 OnyxEngine: Neural Core Fully Operational.");
      
    } catch (err) {
      console.error("❌ Neural OS Critical Failure:", err);
      this.isInitialized = false;
      throw err;
    }
  },

  async process(videoElement) {
    // ইমেজ প্রসেসিং চেক
    if (!this.isInitialized || !videoElement || videoElement.readyState < 2) return;
    
    try {
      // ধারাবাহিকভাবে প্রসেস করা যাতে ওভারলোড না হয়
      await this.faceMesh.send({ image: videoElement });
      await this.hands.send({ image: videoElement });
    } catch (err) {
      console.debug("Onyx Engine skipped frame:", err.message);
    }
  },

  async terminate() {
    if (this.faceMesh) await this.faceMesh.close();
    if (this.hands) await this.hands.close();
    this.isInitialized = false;
    console.log("🛑 OnyxEngine: Terminated.");
  }
};

export default OnyxEngine;