import { FaceMesh } from '@mediapipe/face_mesh';
import { Hands } from '@mediapipe/hands';

const OnyxEngine = {
  faceMesh: null,
  hands: null,
  isInitialized: false,

  async init(onResults) {
    try {
      // পাথ আপডেট করা হয়েছে: /models/mediapipe/
      const locateFile = (file) => `/models/mediapipe/${file}`;

      this.faceMesh = new FaceMesh({ locateFile });
      this.hands = new Hands({ locateFile });

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

      // লাইব্রেরি ইনিশিয়াল করা
      await this.faceMesh.initialize();
      await this.hands.initialize();
      
      this.isInitialized = true;
      console.log("🚀 OnyxEngine: Neural Core Synchronized.");
      
    } catch (err) {
      console.error("Neural OS Warm-up Failed:", err);
      this.isInitialized = false;
    }
  },

  async process(videoElement) {
    if (!this.isInitialized || !videoElement || videoElement.readyState !== 4) return;
    
    try {
      await Promise.all([
        this.faceMesh.send({ image: videoElement }),
        this.hands.send({ image: videoElement })
      ]);
    } catch (err) {
      console.debug("Neural Processing skip:", err.message);
    }
  }
};

export default OnyxEngine;