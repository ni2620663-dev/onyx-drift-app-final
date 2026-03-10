const OnyxEngine = {
  faceMesh: null,
  hands: null,
  isInitialized: false,

  async init(onResults) {
    const { FaceMesh, Hands } = window;

    if (!FaceMesh || !Hands) {
      console.warn("OnyxEngine: Libraries missing. Retrying...");
      return;
    }

    // ফেস মেশ কনফিগারেশন
    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        // ফিক্স: সরাসরি face_mesh CDN পাথ নিশ্চিত করা
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    // হ্যান্ডস কনফিগারেশন
    this.hands = new Hands({
      locateFile: (file) => {
        // ফিক্স: সরাসরি hands CDN পাথ নিশ্চিত করা
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
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

    try {
      await Promise.all([this.faceMesh.initialize(), this.hands.initialize()]);
      this.isInitialized = true;
      console.log("🚀 OnyxEngine: Neural Core Synchronized.");
    } catch (err) {
      console.error("Neural OS Warm-up Failed:", err);
    }
  },

  async process(videoElement) {
    if (!this.isInitialized || !videoElement || videoElement.readyState !== 4) return;
    try {
      await this.faceMesh.send({ image: videoElement });
      await this.hands.send({ image: videoElement });
    } catch (err) {}
  }
};

export default OnyxEngine;