import React, { useRef, useEffect } from "react";
import { Hands } from "@mediapipe/hands";
import * as cam from "@mediapipe/camera_utils";
import Webcam from "react-webcam";

const GestureController = () => {
  const webcamRef = useRef(null);
  const lastY = useRef(null);

  const onResults = (results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // ৮ নম্বর পয়েন্ট হলো তর্জনী আঙুলের ডগা (Index Finger Tip)
      const indexFingerTip = landmarks[8]; 
      const currentY = indexFingerTip.y;

      // 📜 স্ক্রোল লজিক (হাত উপরে-নিচে করলে স্ক্রোল হবে)
      if (lastY.current) {
        const deltaY = currentY - lastY.current;
        if (Math.abs(deltaY) > 0.02) { // মুভমেন্ট সেন্সিটিভিটি
          window.scrollBy(0, deltaY * 2000); 
        }
      }
      lastY.current = currentY;

      // 👌 ক্লিক লজিক (আঙুল দিয়ে চিমটি কাটলে বা Pinch করলে ক্লিক হবে)
      const thumbTip = landmarks[4];
      const distance = Math.sqrt(
        Math.pow(indexFingerTip.x - thumbTip.x, 2) +
        Math.pow(indexFingerTip.y - thumbTip.y, 2)
      );

      if (distance < 0.05) { // যদি আঙুল দুটি খুব কাছে আসে
         const element = document.elementFromPoint(
           indexFingerTip.x * window.innerWidth,
           indexFingerTip.y * window.innerHeight
         );
         if (element) element.click();
      }
    }
  };

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await hands.send({ image: webcamRef.current.video });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] opacity-30 hover:opacity-100 transition-opacity">
      {/* ক্যামেরা ফিডটি ছোট করে কোণায় দেখা যাবে টেস্ট করার জন্য */}
      <Webcam
        ref={webcamRef}
        style={{ width: 150, height: 100, borderRadius: "10px", border: "2px solid #06b6d4" }}
      />
      <p className="text-[8px] text-cyan-500 font-bold text-center mt-1 uppercase">Neural Tracking Active</p>
    </div>
  );
};

export default GestureController;