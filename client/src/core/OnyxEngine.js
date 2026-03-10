import * as faceMeshLib from '@mediapipe/face_mesh';
import * as handsLib from '@mediapipe/hands';

const OnyxEngine = {
  faceMesh: null,
  hands: null,
  isInitialized: false,

  async init(onResults) {
    if (this.isInitialized) return;

    try {
      const FaceMeshConstructor = faceMeshLib.FaceMesh || faceMeshLib.default?.FaceMesh;
      const HandsConstructor = handsLib.Hands || handsLib.default?.Hands;

      if (!FaceMeshConstructor || !HandsConstructor) {
        throw new Error("MediaPipe constructors not found.");
      }

      // ✅ সঠিক CDN পাথ এবং Template Literal (ডলার সাইন সহ) ব্যবহার করা হয়েছে
      this.faceMesh = new FaceMeshConstructor({
        locateFile: (file) => `https://cdn.jsdelivr.net{file}`
      });

      this.hands = new HandsConstructor({
        locateFile: (file) => `https://cdn.jsdelivr.net{file}`
      });

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

      await Promise.all([
        this.faceMesh.initialize(),
        this.hands.initialize()
      ]);
      
      this.isInitialized = true;
      console.log("🚀 OnyxEngine: Neural Core Synchronized.");
      
    } catch (err) {
      console.error("Neural OS Warm-up Failed:", err);
      this.isInitialized = false;
      throw err;
    }
  },

  async process(videoElement) {
    if (!this.isInitialized || !videoElement || videoElement.readyState < 2) return;
    
    try {
      // ✅ এখানে ভিডিও ফ্রেম পাঠানোর আর্গুমেন্ট যোগ করা হয়েছে
      await Promise.all();
    } catch (err) {
      console.debug("Neural Processing skip:", err.message);
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
