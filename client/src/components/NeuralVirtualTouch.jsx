import React, { useRef, useEffect, useCallback, useState } from "react";
// সঠিক ইম্পোর্ট মেথড
import { Hands } from "@mediapipe/hands";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import Webcam from "react-webcam";

const NeuralVirtualTouch = () => {
  const webcamRef = useRef(null);
  const cameraRef = useRef(null);
  const isProcessing = useRef(false);
  const frameCount = useRef(0);

  const [isSystemActive, setIsSystemActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authStage, setAuthStage] = useState("IDLE");
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [status, setStatus] = useState("SYSTEM_LOCKED");
  const [showMenu, setShowMenu] = useState(false);

  const [isUserPresent, setIsUserPresent] = useState(true);
  const [isEyesOpen, setIsEyesOpen] = useState(true);
  const [userName, setUserName] = useState("UNKNOWN_OPERATOR");

  const startAuthentication = () => {
    setAuthStage("SCANNING");
    setStatus("SYNCING BIOMETRICS...");
    setTimeout(() => {
      setAuthStage("GRANTED");
      setIsLoggedIn(true);
      setUserName("OPERATOR_RAFI");
      setStatus("ACCESS GRANTED: ADMIN_MODE");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }, 3000);
  };

  const onResults = useCallback((handResults, faceResults) => {
    // --- ১. ফেস এবং আইরিস (চোখ) সেন্সর লজিক ---
    if (faceResults?.multiFaceLandmarks?.[0]) {
      const face = faceResults.multiFaceLandmarks[0];
      setIsUserPresent(true);

      // চোখের পলক ডিটেকশন (Landmarks: 159 & 145)
      const eyeDist = Math.abs(face[159].y - face[145].y);
      setIsEyesOpen(eyeDist > 0.015); // Sensitivity Threshold

      // আইরিস ট্র্যাকিং (চোখ দিয়ে স্ক্রলিং) - Landmark 468 (বাম আইরিস সেন্টার)
      if (isLoggedIn && eyeDist > 0.015) {
        const iris = face[468]; 
        // আপনি যখন স্ক্রিনের একদম উপরে বা নিচে তাকাবেন
        if (iris.y < 0.40) window.scrollBy({ top: -45, behavior: "smooth" }); // উপরে তাকালে স্ক্রল আপ
        if (iris.y > 0.50) window.scrollBy({ top: 45, behavior: "smooth" });  // নিচে তাকালে স্ক্রল ডাউন
      }
    } else {
      setIsUserPresent(false);
    }

    // --- ২. হ্যান্ড ট্র্যাকিং এবং ক্লিক লজিক ---
    if (handResults?.multiHandLandmarks?.[0]) {
      const hand = handResults.multiHandLandmarks[0];
      const indexTip = hand[8];
      const indexBase = hand[5];
      const thumbTip = hand[4];

      const screenX = (1 - indexTip.x) * window.innerWidth;
      const screenY = indexTip.y * window.innerHeight;
      setCursorPos({ x: screenX, y: screenY });

      // হাতের ইশারায় ক্লিক (ইন্ডেক্স ফিঙ্গার নিচে নামালে)
      if (indexTip.y > indexBase.y + 0.03) {
        const element = document.elementFromPoint(screenX, screenY);
        if (element) {
          element.click();
          setStatus("ACTION: NEURAL_TAP");
        }
      }

      // তালু দেখালে মেনু ওপেন (Palm Gesture)
      const palmOpen = Math.abs(thumbTip.x - hand[20].x) > 0.20;
      if (palmOpen && !showMenu) {
        setShowMenu(true);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }
  }, [isLoggedIn, showMenu]);

  useEffect(() => {
    if (!isSystemActive) return;

    // মডিউল কনফিগারেশন
    const hands = new Hands({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });
    const faceMesh = new FaceMesh({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
    });

    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6 });
    
    // আইরিস ট্র্যাকিংয়ের জন্য refineLandmarks: true থাকা বাধ্যতামূলক
    faceMesh.setOptions({ 
        refineLandmarks: true, 
        minDetectionConfidence: 0.6, 
        minTrackingConfidence: 0.6 
    });

    let lastHand = null;
    let lastFace = null;

    hands.onResults(res => { lastHand = res; if(lastFace) onResults(lastHand, lastFace); });
    faceMesh.onResults(res => { lastFace = res; if(lastHand) onResults(lastHand, lastFace); });

    const runCamera = async () => {
      if (webcamRef.current?.video) {
        cameraRef.current = new Camera(webcamRef.current.video, {
          onFrame: async () => {
            if (isProcessing.current) return;
            isProcessing.current = true;
            try {
              const img = webcamRef.current.video;
              // পারফরম্যান্সের জন্য ইন্টারলিভড ফ্রেম প্রসেসিং
              if (frameCount.current % 2 === 0) {
                await hands.send({ image: img });
              } else {
                await faceMesh.send({ image: img });
              }
              frameCount.current++;
            } catch (e) {
                console.warn("Processing frame skipped");
            } finally {
              isProcessing.current = false;
            }
          },
          width: 640, height: 480,
        });
        await cameraRef.current.start();
      }
    };

    runCamera();

    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      hands.close();
      faceMesh.close();
    };
  }, [isSystemActive, onResults]);

  const isBlurry = isLoggedIn && (!isUserPresent || !isEyesOpen);

  return (
    <div className={`min-h-screen transition-all duration-700 bg-[#020202] text-cyan-400 font-mono overflow-hidden ${isBlurry ? 'blur-[60px] scale-110 grayscale' : 'blur-0'}`}>
      
      {/* ১. ইনিশিয়ালাইজেশন স্ক্রিন */}
      {!isSystemActive && (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-[5000]">
          <div className="text-center">
            <div className="w-16 h-16 border-t-2 border-cyan-500 rounded-full animate-spin mx-auto mb-6" />
            <button onClick={() => setIsSystemActive(true)} className="px-12 py-4 border-2 border-cyan-500 text-cyan-500 tracking-[0.5em] hover:bg-cyan-500 hover:text-black transition-all font-black">
              INITIALIZE NEURAL_LINK
            </button>
          </div>
        </div>
      )}

      {/* ২. বায়োমেট্রিক স্ক্যানিং (Authentication) */}
      {isSystemActive && !isLoggedIn && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 z-[4000]">
          <div className="relative w-72 h-72 flex items-center justify-center">
            <div className={`absolute inset-0 border-2 rounded-full border-dashed animate-spin-slow ${authStage === 'SCANNING' ? 'border-yellow-500' : 'border-cyan-900/50'}`} />
            <div className={`w-48 h-48 border rounded-full flex flex-col items-center justify-center transition-all duration-500 ${authStage === 'SCANNING' ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]' : 'border-cyan-500/20'}`}>
              <span className="text-5xl mb-3 animate-pulse">{authStage === 'SCANNING' ? '👁️' : '🔒'}</span>
              <span className="text-[10px] tracking-[0.5em]">{authStage === 'SCANNING' ? 'SCANNING' : 'LOCKED'}</span>
            </div>
            {authStage === 'SCANNING' && <div className="absolute w-full h-1 bg-cyan-500/50 top-0 animate-scan-line" />}
          </div>
          <button onClick={startAuthentication} className="mt-16 px-8 py-2 border border-cyan-500/30 tracking-[0.8em] text-[10px] uppercase hover:bg-cyan-500 hover:text-black transition-all">
            {authStage === 'SCANNING' ? 'Authorizing...' : '[ INITIATE SCAN ]'}
          </button>
        </div>
      )}

      {/* ৩. মেইন ইউজার ইন্টারফেস (Dashboard) */}
      {isLoggedIn && (
        <div className="p-10 max-w-6xl mx-auto">
          <header className="flex justify-between items-end border-b border-cyan-900/40 pb-8 mb-12">
            <div>
              <div className="text-[10px] text-cyan-800 tracking-[1em] mb-2 uppercase">Neural_OS_v1.0.4</div>
              <h1 className="text-3xl font-black tracking-tighter uppercase text-white">Operator: <span className="text-cyan-400">{userName}</span></h1>
            </div>
            <div className="text-right text-[10px] text-cyan-600 tracking-widest font-bold">
              STATUS: <span className="text-cyan-400">{status}</span><br/>
              UI_MODE: FULL_EYE_TRACKING
            </div>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Files', 'Network', 'Security', 'Neural_Link', 'Cores', 'System_Logs', 'Satellite', 'Terminal'].map(item => (
              <div key={item} className="h-40 border border-cyan-900/50 bg-cyan-950/5 rounded-3xl flex flex-col items-center justify-center hover:bg-cyan-500 hover:text-black hover:scale-105 transition-all cursor-none group">
                <div className="w-8 h-8 border border-current mb-4 rotate-45 group-hover:rotate-0 transition-all duration-700" />
                <span className="text-[10px] tracking-[0.4em] uppercase font-bold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ৪. নিয়ন আইরিস কার্সার (Neon Cursor) */}
      <div 
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[10000] flex items-center justify-center transition-transform duration-75 ease-out"
        style={{ transform: `translate(${cursorPos.x - 16}px, ${cursorPos.y - 16}px)` }}
      >
        <div className="w-full h-full border border-cyan-400 rounded-full animate-ping absolute opacity-30" />
        <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_#fff,0_0_30px_#22d3ee]" />
      </div>

      {/* ৫. ফেস ক্যামেরা প্রিভিউ (Mini Cam) */}
      <div className="fixed bottom-8 left-8 w-32 h-32 rounded-3xl border border-cyan-500/30 overflow-hidden bg-black/80 shadow-2xl z-[5001]">
        <Webcam ref={webcamRef} mirrored={true} className="w-full h-full object-cover opacity-40 grayscale contrast-125" />
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent pointer-events-none" />
      </div>

      {/* ৬. আই-লিঙ্ক লস্ট অ্যালার্ট (Privacy Blur Overlay) */}
      {isBlurry && (
        <div className="fixed inset-0 flex items-center justify-center z-[20000] bg-black/20 backdrop-blur-xl transition-all duration-1000">
            <div className="text-center p-12 border border-red-500/20 rounded-[3rem] bg-black/80 shadow-[0_0_100px_rgba(239,68,68,0.15)]">
              <div className="text-red-600 text-6xl mb-6 animate-pulse font-light">!</div>
              <div className="text-red-500 font-mono text-xs tracking-[0.6em] font-black uppercase">
                {!isUserPresent ? "BIO_SIGNAL_LOST" : "NEURAL_LINK_DISCONNECTED"}
              </div>
              <div className="text-red-900 text-[8px] mt-4 tracking-widest uppercase">Looking for operator's gaze...</div>
            </div>
        </div>
      )}
    </div>
  );
};

export default NeuralVirtualTouch;