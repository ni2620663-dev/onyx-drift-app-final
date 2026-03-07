import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';

export const GestureDetector = {
  detector: null,

  // ১. ডিটেক্টর ইনিশিয়ালাইজেশন
  async init() {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detectorConfig = { runtime: 'tfjs' };
    this.detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
  },

  // ২. হেড-নড লজিক (মাথা নিচে নামানো এবং উপরে তোলা ডিটেক্ট করা)
  detectNod(landmarks) {
    // MediaPipe এর নোজ টিপ (Point 1) এবং চিন (Point 152) এর ভার্টিকাল পজিশন চেক করা
    const noseY = landmarks[1][1];
    const chinY = landmarks[152][1];
    
    // সিম্পল পিচ (Pitch) ক্যালকুলেশন
    const pitch = chinY - noseY;
    
    // একটি নির্দিষ্ট থ্রেশহোল্ড সেট করা (এটি টিউনিং করতে হবে)
    if (pitch > 50) return "NOD_DOWN";
    if (pitch < 30) return "NOD_UP";
    return null;
  }
};