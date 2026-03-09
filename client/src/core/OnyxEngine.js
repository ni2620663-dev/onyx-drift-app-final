// src/core/OnyxEngine.js
import { FaceMesh } from "@mediapipe/face_mesh";
import { Hands } from "@mediapipe/hands";

const OnyxEngine = {
  faceMesh: null,
  hands: null,
  
  async init(onResults) {
    const basePath = `/models/mediapipe/`;

    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        // ফাইলটি লোড হওয়ার সময় পূর্ণ পাথ রিটার্ন করবে
        return `${basePath}${file}`;
      },
    });

    this.hands = new Hands({
      locateFile: (file) => {
        return `${basePath}${file}`;
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