import React, { useRef, useEffect, useCallback } from "react";
import { Hands } from "@mediapipe/hands";
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
    
    // প্রয়োজনীয় পয়েন্টগুলো (Landmarks)
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const palmBase = landmarks[0];

    // ১. 📜 স্মার্ট স্ক্রোলিং (হাত উপরে/নিচে)
    const currentY = indexTip.y;
    if (Math.abs(currentY - lastY.current) > 0.05) {
      const scrollSpeed = 800;
      window.scrollBy({
        top: (currentY - lastY.current) * scrollSpeed,
        behavior: "smooth"
      });
      lastY.current = currentY;
    }

    // ২. ↔️ সোয়াইপ লজিক (হাত ডানে/বামে)
    const currentX = indexTip.x;
    if (Math.abs(currentX - lastX.current) > 0.15) {
      if (currentX > lastX.current) {
        console.log("Swiped Right - Next Item");
        // এখানে নেক্সট ভিডিও বা পেজ চেঞ্জ লজিক দিতে পারেন
      } else {
        console.log("Swiped Left - Previous Item");
      }
      lastX.current = currentX;
    }

    // ৩. 👌 চিমটি (Pinch to Click/Like)
    const distance = Math.sqrt(
      Math.pow(indexTip.x - thumbTip.x, 2) + 
      Math.pow(indexTip.y - thumbTip.y, 2)
    );

    if (distance < 0.04) {
      if (!isPinching.current) {
        isPinching.current = true;
        const x = (1 - indexTip.x) * window.innerWidth;
        const y = indexTip.y * window.innerHeight;
        
        const element = document.elementFromPoint(x, y);
        if (element) {
          element.click();
          // একটি ভার্চুয়াল ফিডব্যাক ইফেক্ট (ঐচ্ছিক)
          console.log("Neural Click at:", x, y);
        }
      }
    } else {
      isPinching.current = false;
    }

    // ৪. ✋ পাম (Palm to Stop/Pause)
    if (indexTip.y < palmBase.y && middleTip.y < palmBase.y && thumbTip.y < palmBase.y) {
       // সব ভিডিও পজ করার লজিক
       const videos = document.querySelectorAll('video');
       videos.forEach(v => v.pause());
    }

  }, []);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0, // মোবাইলের জন্য ০ (Fastest), পিসির জন্য ১
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    hands.onResults(onResults);

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await hands.send({ image: webcamRef.current.video });
        },
        width: 480,
        height: 270, // লো-রেজোলিউশন মোবাইলে ফাস্ট চলবে
      });
      camera.start();
    }
  }, [onResults]);

  return (
    <div className="fixed top-2 right-2 z-[9999] pointer-events-none">
      <div className="relative w-32 h-24 border-2 border-cyan-500/30 rounded-lg overflow-hidden bg-black/50 backdrop-blur-md">
        <Webcam
          ref={webcamRef}
          mirrored={true}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 border-t-2 border-cyan-500 animate-pulse opacity-20" />
      </div>
      <div className="bg-black/80 text-[7px] text-cyan-400 p-1 text-center font-black uppercase tracking-widest border border-cyan-900/50 mt-1 rounded">
        Neural Engine v2.0 // Active
      </div>
    </div>
  );
};

export default NeuralGestureEngine;