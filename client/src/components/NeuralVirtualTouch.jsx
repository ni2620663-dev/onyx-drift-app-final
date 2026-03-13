import React, { useRef, useEffect, useCallback, useState } from "react";
import Webcam from "react-webcam";

const NeuralVirtualTouch = () => {
  const webcamRef = useRef(null);
  const cameraRef = useRef(null);
  const isProcessing = useRef(false);
  const frameCount = useRef(0);
  
  const dwellTimerRef = useRef(null);
  const lastTargetRef = useRef(null);
  const lastHandResults = useRef(null);
  const lastFaceResults = useRef(null);

  const [isSystemActive, setIsSystemActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authStage, setAuthStage] = useState("IDLE");
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [dwellProgress, setDwellProgress] = useState(0); 
  const [status, setStatus] = useState("SYSTEM_LOCKED");
  
  const [isUserPresent, setIsUserPresent] = useState(true);
  const [isEyesOpen, setIsEyesOpen] = useState(true);
  const [userName, setUserName] = useState("UNKNOWN_OPERATOR");

  const executeGlobalClick = useCallback((x, y) => {
    const element = document.elementFromPoint(x, y);
    if (element) {
      const events = ['mousedown', 'mouseup', 'click'];
      events.forEach(type => {
        element.dispatchEvent(new MouseEvent(type, {
          view: window, bubbles: true, cancelable: true, clientX: x, clientY: y
        }));
      });
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') element.focus();
      setStatus("ACTION: NEURAL_TAP");
      setDwellProgress(0); 
    }
  }, []);

  const onResults = useCallback((hRes, fRes) => {
    if (hRes) lastHandResults.current = hRes;
    if (fRes) lastFaceResults.current = fRes;
    const handsData = lastHandResults.current;
    const faceData = lastFaceResults.current;

    if (faceData?.multiFaceLandmarks?.[0]) {
      const face = faceData.multiFaceLandmarks[0];
      setIsUserPresent(true);
      const eyeDist = Math.abs(face[159].y - face[145].y);
      setIsEyesOpen(eyeDist > 0.012);
      if (isLoggedIn && eyeDist > 0.015 && face[468]) {
        const irisY = face[468].y; 
        const neutralY = 0.48; 
        const threshold = 0.06;
        if (irisY < neutralY - threshold) window.scrollBy(0, -30);
        else if (irisY > neutralY + threshold) window.scrollBy(0, 30);
      }
    } else {
      setIsUserPresent(false);
    }

    if (handsData?.multiHandLandmarks?.[0]) {
      const hand = handsData.multiHandLandmarks[0];
      const indexTip = hand[8];
      const indexBase = hand[5];
      const targetX = (1 - indexTip.x) * window.innerWidth;
      const targetY = indexTip.y * window.innerHeight;
      setCursorPos(prev => ({
        x: prev.x + (targetX - prev.x) * 0.4,
        y: prev.y + (targetY - prev.y) * 0.4
      }));
      const currentTarget = document.elementFromPoint(targetX, targetY);
      if (currentTarget && currentTarget === lastTargetRef.current) {
        if (!dwellTimerRef.current) {
          let progress = 0;
          dwellTimerRef.current = setInterval(() => {
            progress += 5;
            setDwellProgress(progress);
            if (progress >= 100) {
              executeGlobalClick(targetX, targetY);
              clearInterval(dwellTimerRef.current);
              dwellTimerRef.current = null;
            }
          }, 60); 
        }
      } else {
        clearInterval(dwellTimerRef.current);
        dwellTimerRef.current = null;
        setDwellProgress(0);
        lastTargetRef.current = currentTarget;
      }
      if (indexTip.y > indexBase.y + 0.06) executeGlobalClick(targetX, targetY);
    }
  }, [isLoggedIn, executeGlobalClick]);

  useEffect(() => {
    if (!isSystemActive || !webcamRef.current || !window.Hands || !window.FaceMesh) return;

    // সরাসরি window থেকে কনস্ট্রাকটর ব্যবহার
    const hands = new window.Hands({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
    const faceMesh = new window.FaceMesh({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });

    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7 });
    faceMesh.setOptions({ refineLandmarks: true, minDetectionConfidence: 0.7 });
    hands.onResults(res => onResults(res, null));
    faceMesh.onResults(res => onResults(null, res));

    const runCamera = async () => {
      try {
        cameraRef.current = new window.Camera(webcamRef.current.video, {
          onFrame: async () => {
            if (isProcessing.current) return;
            isProcessing.current = true;
            try {
              if (frameCount.current % 2 === 0) await hands.send({ image: webcamRef.current.video });
              else await faceMesh.send({ image: webcamRef.current.video });
              frameCount.current++;
            } finally { isProcessing.current = false; }
          },
          width: 640, height: 480,
        });
        await cameraRef.current.start();
      } catch (err) { setStatus("CAMERA_ERROR"); }
    };
    runCamera();
    return () => {
      cameraRef.current?.stop();
      hands.close();
      faceMesh.close();
      if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
    };
  }, [isSystemActive, onResults]);

  const startAuthentication = () => {
    setAuthStage("SCANNING");
    setTimeout(() => {
      setAuthStage("GRANTED");
      setIsLoggedIn(true);
      setUserName("OPERATOR_RAFI");
      setStatus("ACCESS_GRANTED");
    }, 2500);
  };

  const isBlurry = isLoggedIn && (!isUserPresent || !isEyesOpen);

  return (
    <div className={`min-h-screen transition-all duration-700 bg-[#020202] text-cyan-400 font-mono overflow-hidden ${isBlurry ? 'blur-[45px] scale-105 pointer-events-none' : 'blur-0'}`}>
      {!isSystemActive && (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-[5000]">
          <button onClick={() => setIsSystemActive(true)} className="px-12 py-4 border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all font-bold tracking-widest">
            INITIALIZE NEURAL_LINK
          </button>
        </div>
      )}
      {isSystemActive && !isLoggedIn && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 z-[4000]">
          <div className="w-56 h-56 border-2 border-cyan-500/20 rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 border-2 border-cyan-500 rounded-full animate-ping opacity-20" />
            <span className="text-5xl">{authStage === 'SCANNING' ? '🔋' : '🔒'}</span>
          </div>
          <button onClick={startAuthentication} className="mt-12 px-10 py-3 border border-cyan-500/40 text-[10px] uppercase tracking-[0.5em]">
            {authStage === 'SCANNING' ? 'Syncing Biometrics...' : '[ INITIATE SCAN ]'}
          </button>
        </div>
      )}
      {isLoggedIn && (
        <div className="p-10">
          <header className="flex justify-between items-center border-b border-cyan-900/40 pb-6">
            <div>
              <div className="text-[10px] text-cyan-800 tracking-[1em] uppercase">Neural_OS_v2.1</div>
              <h1 className="text-2xl font-black text-white italic">OPERATOR: <span className="text-cyan-400">{userName}</span></h1>
            </div>
            <div className="text-xs text-right">
              <div className="text-cyan-900 mb-1 tracking-widest">CORE_TEMP: 32°C</div>
              <div>STATUS: <span className="text-cyan-400">{status}</span></div>
            </div>
          </header>
          <main className="mt-24 max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {['Messenger', 'YouTube', 'AITwin', 'Feed', 'System', 'Logout'].map(app => (
                 <div key={app} className="p-16 border border-cyan-900/30 bg-cyan-950/5 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all duration-500 cursor-pointer text-center font-bold tracking-widest uppercase">
                    {app}
                 </div>
               ))}
            </div>
          </main>
        </div>
      )}
      <Webcam ref={webcamRef} className="hidden" />
      <div 
        className="fixed top-0 left-0 pointer-events-none z-[10000] flex flex-col items-center" 
        style={{ transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)`, transition: 'transform 0.08s ease-out' }}
      >
        <div className={`w-4 h-4 border-2 border-cyan-400 rounded-full flex items-center justify-center ${dwellProgress > 0 ? 'scale-150' : 'scale-100'} transition-transform`}>
           <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"></div>
        </div>
        {dwellProgress > 0 && (
          <div className="mt-4 w-12 h-1.5 bg-cyan-900/50 rounded-full overflow-hidden border border-cyan-500/20">
            <div className="h-full bg-cyan-400 transition-all duration-75" style={{ width: `${dwellProgress}%` }} />
          </div>
        )}
        {dwellProgress > 0 && (
          <span className="mt-1 text-[8px] font-bold text-cyan-500 animate-pulse uppercase">Linking...</span>
        )}
      </div>
    </div>
  );
};
export default NeuralVirtualTouch;