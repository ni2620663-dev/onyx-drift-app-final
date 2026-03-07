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
      await tf.setBackend('webgl');
      await tf.ready();
      
      // Face Landmarks Detector: লোকাল পাথ নিশ্চিত করা হয়েছে
      const faceModel = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      
      this.detector = await faceLandmarksDetection.createDetector(faceModel, {
        runtime: 'tfjs',
        refineLandmarks: true,
        modelConfig: {
          maxFaces: 1,
          // আপনার ফোল্ডার স্ট্রাকচার অনুযায়ী পাথ
          modelUrl: `${window.location.origin}/models/mediapipe/model.json`
        }
      });

      // Hand Pose Detector
      const handModel = handPoseDetection.SupportedModels.MediaPipeHands;
      this.handDetector = await handPoseDetection.createDetector(handModel, {
        runtime: 'tfjs',
        modelConfig: {
          maxHands: 2
        }
      });
      
      this.isInitialized = true;
      console.log("OnyxEngine: Neural Core successfully initialized locally.");
    } catch (error) {
      console.error("OnyxEngine Init Error:", error);
    }
  }

  async process(videoElement) {
    if (!this.isInitialized || !videoElement || videoElement.readyState !== 4) return;

    try {
      const faces = await this.detector.estimateFaces(videoElement);
      const hands = await this.handDetector.estimateHands(videoElement);

      window.onyxData = { faces, hands }; 

      if (faces.length > 0) {
        this.analyzeEyeGaze(faces[0]);
      }
    } catch (err) {
      console.error("Processing Error:", err);
    }
  }

  analyzeEyeGaze(face) {
    if (!face.keypoints) return;
    const leftEye = face.keypoints[159];
    if (leftEye && leftEye.y < 200) {
      console.log("Onyx-Core: Scroll Up Detected");
    }
  }
}

export default new OnyxEngine();