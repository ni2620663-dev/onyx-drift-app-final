import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl'; 
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

class OnyxEngine {
  constructor() {
    this.detector = null;
    this.handDetector = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      // ১. TensorFlow Backend Check & Warmup
      await tf.setBackend('webgl');
      await tf.ready();
      console.log("Onyx-Core: TF Backend Status ->", tf.getBackend());

      // ২. Model Path & Face Detector Setup
      // নিশ্চিত করুন যে public/models/mediapipe ফোল্ডারে model.json আছে
      const faceModel = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      this.detector = await faceLandmarksDetection.createDetector(faceModel, {
        runtime: 'tfjs',
        refineLandmarks: true,
        modelConfig: {
          maxFaces: 1,
          modelUrl: `${window.location.origin}/models/mediapipe/model.json`
        }
      });

      // ৩. Hand Model Safe Config
      const handModel = handPoseDetection.SupportedModels.MediaPipeHands;
      this.handDetector = await handPoseDetection.createDetector(handModel, {
        runtime: 'tfjs',
        modelType: 'lite', 
        maxHands: 2
      });

      this.isInitialized = true;
      console.log("Onyx-Engine: All Neural Cores Online.");
      return true;
    } catch (error) {
      console.error("OnyxEngine Critical Init Error:", error);
      return false;
    }
  }

  // ৪. Frame Processing Engine
  async process(videoElement) {
    if (!this.isInitialized || !videoElement || videoElement.readyState !== 4) return;

    try {
      const faces = await this.detector.estimateFaces(videoElement);
      const hands = await this.handDetector.estimateHands(videoElement);

      // গ্লোবাল ডাটা স্টোর (SecurityShield ও অন্যান্য মডিউলের জন্য)
      window.onyxData = { faces, hands }; 

      if (faces.length > 0 && faces[0].keypoints) {
        this.analyzeEyeGaze(faces[0]);
      }
    } catch (err) {
      // লোডিংয়ের সময় এরর এড়াতে ওয়ার্নিং সাইলেন্ট রাখা হয়েছে
      // console.warn("Frame processing skipped");
    }
  }

  // ৫. Bio-Metric Analysis (Eye Tracking)
  analyzeEyeGaze(face) {
    const leftEyeUpper = face.keypoints[159]; 
    const leftEyeLower = face.keypoints[145]; 
    
    if (leftEyeUpper && leftEyeLower) {
      const eyeOpenDist = Math.abs(leftEyeUpper.y - leftEyeLower.y);
      
      // Bio-Scroll Logic
      if (leftEyeUpper.y < 250 && eyeOpenDist > 0.015) {
        // console.log("Onyx-Core: Gaze Tracking Active");
      }
    }
  }
}

// Singleton Instance তৈরি করে এক্সপোর্ট করা হচ্ছে
const onyxEngineInstance = new OnyxEngine();
export default onyxEngineInstance;

// Named Export (যদি দরকার হয়)
export { onyxEngineInstance as OnyxEngine };