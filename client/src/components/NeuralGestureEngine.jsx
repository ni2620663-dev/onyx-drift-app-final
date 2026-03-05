import React, { useRef, useEffect, useCallback } from "react";
// ✅ Vite/Production এ এরর এড়াতে এভাবে ইম্পোর্ট করা হয়েছে
import * as HandsModule from "@mediapipe/hands";
import * as cam from "@mediapipe/camera_utils";
import Webcam from "react-webcam";

const NeuralGestureEngine = () => {
  const webcamRef = useRef(null);
  const lastY = useRef(0);
  const lastX = useRef(0);
  const isPinching = useRef(false);

  const onResults = useCallback((results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

    const landmarks = results.multiHandLandmarks[0];
    
    // প্রয়োজনীয় ল্যান্ডমার্ক পয়েন্টস (Index Finger, Thumb, Middle Finger, Palm)
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const palmBase = landmarks[0];

    // --- ১. 📜 স্মার্ট স্ক্রোলিং (Vertical Movement) ---
    const currentY = indexTip.y;
    if (Math.abs(currentY - lastY.current) > 0.05) {
      const scrollSpeed = 1000; // স্পিড আপনার প্রয়োজন মতো বাড়াতে পারেন
      window.scrollBy({
        top: (currentY - lastY.current) * scrollSpeed,
        behavior: "smooth"
      });
      lastY.current = currentY;
    }

    // --- ২. ↔️ সোয়াইপ লজিক (Horizontal Movement) ---
    const currentX = indexTip.x;
    if (Math.abs(currentX - lastX.current) > 0.15) {
      if (currentX > lastX.current) {
        // Right Swipe -> Previous / Back
        window.history.back();
      } else {
        // Left Swipe -> Forward
        console.log("Neural Swipe Left");
      }
      lastX.current = currentX;
    }

    // --- ৩. 👌 চিমটি (Pinch to Click/Like) ---
    const distance = Math.sqrt(
      Math.pow(indexTip.x - thumbTip.x, 2) + 
      Math.pow(indexTip.y - thumbTip.y, 2)
    );

    if (distance < 0.04) {
      if (!isPinching.current) {
        isPinching.current = true;
        // ক্যালকুলেট পজিশন (Mirrored ক্যামেরা অনুযায়ী X ইনভার্ট করা হয়েছে)
        const x = (1 - indexTip.x) * window.innerWidth;
        const y = indexTip.y * window.innerHeight;
        
        const element = document.elementFromPoint(x, y);
        if (element) {
          element.click();
          console.log("Neural Action: Clicked at", Math.round(x), Math.round(y));
        }
      }
    } else {
      isPinching.current = false;
    }

    // --- ৪. ✋ পাম (Palm to Stop/Pause) ---
    // যদি ৩টি আঙুলই তালুর উপরে থাকে
    if (indexTip.y < palmBase.y && middleTip.y < palmBase.y && thumbTip.y < palmBase.y) {
       const videos = document.querySelectorAll('video');
       videos.forEach(v => {
         if (!v.paused) v.pause();
       });
    }

  }, []);

  useEffect(() => {
    // ✅ Constructor Fix: Hands ক্লাসটি মডিউল থেকে নিশ্চিত করা
    const HandsClass = HandsModule.Hands || window.Hands;
    
    if (!HandsClass) {
      console.error("Neural Engine: Hands constructor not found.");
      return;
    }

    const hands = new HandsClass({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0, // দ্রুত প্রসেসিং এর জন্য (Mobile Friendly)
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    hands.onResults(onResults);

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current) {
            await hands.send({ image: webcamRef.current.video });
          }
        },
        width: 480,
        height: 270,
      });
      camera.start();
    }

    return () => {
      // Cleanup logic if needed
    };
  }, [onResults]);

  return (
    <div className="fixed top-2 right-2 z-[9999] pointer-events-none">
      <div className="relative w-32 h-24 border-2 border-cyan-500/30 rounded-lg overflow-hidden bg-black/40 backdrop-blur-md">
        <Webcam
          ref={webcamRef}
          mirrored={true}
          screenshotFormat="image/jpeg"
          className="w-full h-full object-cover opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          videoConstraints={{
            width: 480,
            height: 270,
            facingMode: "user",
          }}
        />
        {/* স্ক্যানিং অ্যানিমেশন ইফেক্ট */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/50 shadow-[0_0_10px_cyan] animate-[scan_2s_linear_infinite]" />
      </div>
      <div className="bg-black/80 text-[7px] text-cyan-400 p-1 text-center font-black uppercase tracking-[0.2em] border border-cyan-900/50 mt-1 rounded backdrop-blur-sm">
        Neural Engine v2.0 // Active
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}} />
    </div>
  );
};

export default NeuralGestureEngine;