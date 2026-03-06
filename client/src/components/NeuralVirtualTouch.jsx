import React, { useRef, useEffect, useCallback, useState } from "react";
import * as HandsModule from "@mediapipe/hands";
import * as FaceMeshModule from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";
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
    }, 4000);
  };

  const onResults = useCallback((handResults, faceResults) => {
    if (faceResults?.multiFaceLandmarks?.[0]) {
      const face = faceResults.multiFaceLandmarks[0];
      setIsUserPresent(true);
      const eyeDist = face[145].y - face[159].y;
      setIsEyesOpen(eyeDist > 0.012);

      if (isLoggedIn && eyeDist > 0.012 && !showMenu) {
        const irisY = face[468].y;
        if (irisY < 0.43) window.scrollBy({ top: -30, behavior: "auto" });
        if (irisY > 0.47) window.scrollBy({ top: 30, behavior: "auto" });
      }
    } else {
      setIsUserPresent(false);
    }

    if (handResults?.multiHandLandmarks?.[0]) {
      const hand = handResults.multiHandLandmarks[0];
      const indexTip = hand[8];
      const indexBase = hand[5];
      const thumbTip = hand[4];

      const screenX = (1 - indexTip.x) * window.innerWidth;
      const screenY = indexTip.y * window.innerHeight;
      setCursorPos({ x: screenX, y: screenY });

      if (indexTip.y > indexBase.y + 0.02) {
        const element = document.elementFromPoint(screenX, screenY);
        element?.click();
        setStatus("ACTION: NEURAL_TAP");
      }

      const palmOpen = Math.abs(thumbTip.x - hand[20].x) > 0.18;
      if (palmOpen && !showMenu) {
        setShowMenu(true);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }
  }, [isLoggedIn, showMenu]);

  useEffect(() => {
    if (!isSystemActive) return;

    const hands = new HandsModule.Hands({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${HandsModule.VERSION}/${f}`,
    });
    const faceMesh = new FaceMeshModule.FaceMesh({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${FaceMeshModule.VERSION}/${f}`,
    });

    hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.5 });
    faceMesh.setOptions({ refineLandmarks: true, minDetectionConfidence: 0.5 });

    let lastH = null;
    let lastF = null;

    hands.onResults(res => { lastH = res; if(lastF) onResults(lastH, lastF); });
    faceMesh.onResults(res => { lastF = res; if(lastH) onResults(lastH, lastF); });

    const runCamera = async () => {
      if (webcamRef.current?.video) {
        cameraRef.current = new cam.Camera(webcamRef.current.video, {
          onFrame: async () => {
            if (isProcessing.current) return;
            isProcessing.current = true;
            try {
              const img = webcamRef.current.video;
              if (frameCount.current % 2 === 0) {
                await hands.send({ image: img });
              } else {
                await faceMesh.send({ image: img });
              }
              frameCount.current++;
            } catch (e) {
              // এরর ইগনোর করা হয়েছে যেন লুপ না ভাঙে
            } finally {
              isProcessing.current = false;
            }
          },
          width: 480, height: 360,
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
    <div className={`min-h-screen transition-all duration-700 bg-[#020202] text-cyan-400 font-mono overflow-hidden ${isBlurry ? 'blur-[50px] scale-110 grayscale' : 'blur-0'}`}>
      {!isSystemActive && (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-[5000]">
          <div className="text-center">
            <div className="w-16 h-16 border-t-2 border-cyan-500 rounded-full animate-spin mx-auto mb-6" />
            <button onClick={() => setIsSystemActive(true)} className="px-12 py-4 border-2 border-cyan-500 text-cyan-500 tracking-[0.5em] hover:bg-cyan-500 hover:text-black transition-all">
              INITIALIZE NEURAL_LINK
            </button>
          </div>
        </div>
      )}

      {isSystemActive && !isLoggedIn && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 z-[4000]">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className={`absolute inset-0 border-2 rounded-full border-dashed animate-spin-slow ${authStage === 'SCANNING' ? 'border-yellow-500' : 'border-cyan-900'}`} />
            <div className={`w-40 h-40 border rounded-full flex flex-col items-center justify-center ${authStage === 'SCANNING' ? 'border-red-500 shadow-[0_0_30px_red]' : 'border-cyan-500/20'}`}>
              <span className="text-4xl mb-2">{authStage === 'SCANNING' ? '👁️' : '🔒'}</span>
              <span className="text-[10px] tracking-widest">{authStage === 'SCANNING' ? 'SCANNING' : 'LOCKED'}</span>
            </div>
            {authStage === 'SCANNING' && <div className="animate-scan" />}
          </div>
          <button onClick={startAuthentication} className="mt-12 tracking-[0.5em] text-[10px] uppercase hover:text-white transition-all">
            {authStage === 'SCANNING' ? 'Syncing...' : '[ START SCAN ]'}
          </button>
        </div>
      )}

      {isLoggedIn && (
        <div className="p-10">
          <header className="flex justify-between items-end border-b border-cyan-900/40 pb-6 mb-12">
            <div>
              <div className="text-[10px] text-cyan-800 tracking-[0.5em]">SYSTEM_OS_v1.0</div>
              <h1 className="text-2xl font-black tracking-tighter uppercase">Operator: {userName}</h1>
            </div>
            <div className="text-right text-[10px] text-cyan-700 tracking-widest leading-loose">
              STATUS: {status}<br/>
              MODE: FRAME_INTERLEAVED
            </div>
          </header>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Files', 'Net', 'Security', 'Neural', 'Cores', 'Logs', 'Maps', 'Dev'].map(item => (
              <div key={item} className="h-32 border border-cyan-900 bg-cyan-950/5 rounded-2xl flex flex-col items-center justify-center hover:bg-cyan-400 hover:text-black transition-all group">
                <div className="w-6 h-6 border border-current mb-3 rotate-45 group-hover:rotate-0 transition-all duration-500" />
                <span className="text-[10px] tracking-[0.3em] uppercase">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div 
        className="fixed top-0 left-0 w-6 h-6 pointer-events-none z-[10000] flex items-center justify-center transition-transform duration-75"
        style={{ transform: `translate(${cursorPos.x - 12}px, ${cursorPos.y - 12}px)` }}
      >
        <div className="w-full h-full border border-cyan-400 rounded-full animate-ping absolute opacity-20" />
        <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]" />
      </div>

      <div className="fixed bottom-6 right-6 w-32 h-32 rounded-full border border-cyan-500/20 overflow-hidden bg-black/50 shadow-2xl">
        <Webcam ref={webcamRef} mirrored={true} className="w-full h-full object-cover opacity-20 grayscale" />
        <div className="animate-scan" />
      </div>

      {isBlurry && (
        <div className="fixed inset-0 flex items-center justify-center z-[20000] bg-black/40 backdrop-blur-md">
            <div className="text-center p-10 border border-red-500/30 rounded-3xl bg-black/60">
              <div className="text-red-500 text-5xl mb-4 animate-pulse">⚠️</div>
              <div className="text-red-500 font-mono text-xs tracking-[0.4em] font-bold uppercase">
                {!isUserPresent ? "USER_ABSENT" : "PRIVACY_LOCK"}
              </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default NeuralVirtualTouch;