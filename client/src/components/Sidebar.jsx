import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaHome, FaEnvelope, FaCompass, FaCog, FaSignOutAlt, 
  FaUserPlus, FaFire, FaEye, FaEyeSlash
} from 'react-icons/fa'; 
import { HiOutlineChartBar } from 'react-icons/hi'; // এটি যোগ করা হয়েছে
import { useAuth0 } from '@auth0/auth0-react';
import Webcam from "react-webcam";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const Sidebar = () => {
  const { logout } = useAuth0();
  const navigate = useNavigate();
  
  const [isNeuralActive, setIsNeuralActive] = useState(false);
  const [isEyesOpen, setIsEyesOpen] = useState(true);
  const webcamRef = useRef(null);

  const menuItems = [
    { name: 'Feed', icon: <FaHome />, path: '/feed' },
    { name: 'For You', icon: <FaFire />, path: '/reels' },
    { name: 'Following', icon: <FaUserPlus />, path: '/following' }, 
    { name: 'Analytics', icon: <HiOutlineChartBar />, path: '/analytics' },
    { name: 'Messages', icon: <FaEnvelope />, path: '/messages' },
    { name: 'Explore', icon: <FaCompass />, path: '/explorer' },
    { name: 'Settings', icon: <FaCog />, path: '/settings' },
  ];

  /* =================👁️ EYE SENSOR LOGIC ================= */
  const onResults = useCallback((res) => {
    if (res?.multiFaceLandmarks?.[0]) {
      const face = res.multiFaceLandmarks[0];
      const eyeDist = Math.abs(face[159].y - face[145].y);
      setIsEyesOpen(eyeDist > 0.012);
    }
  }, []);

  useEffect(() => {
    if (!isNeuralActive) return;
    const faceMesh = new FaceMesh({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
    faceMesh.setOptions({ refineLandmarks: true, minDetectionConfidence: 0.5 });
    faceMesh.onResults(onResults);
    
    if (webcamRef.current?.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => { await faceMesh.send({ image: webcamRef.current.video }); },
        width: 160, height: 120
      });
      camera.start();
      return () => { camera.stop(); faceMesh.close(); };
    }
  }, [isNeuralActive, onResults]);

  /* =================🎙️ PERMANENT VOICE ENGINE ================= */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
      menuItems.forEach(item => {
        if (command.includes(item.name.toLowerCase())) navigate(item.path);
      });
      if (command.includes("logout") || command.includes("disconnect")) {
        logout({ logoutParams: { returnTo: window.location.origin } });
      }
    };

    recognition.onend = () => {
      try { recognition.start(); } catch (e) { console.log("Voice Engine Restarting..."); }
    };

    try { recognition.start(); } catch (e) { console.log("Voice Engine Initialized"); }

    return () => recognition.stop();
  }, [navigate, logout]);

  return (
    <div className="flex flex-col h-full py-6 justify-between bg-black/50 backdrop-blur-xl border-r border-white/5 relative">
      
      <div className="absolute top-4 right-4">
        <button onClick={() => setIsNeuralActive(!isNeuralActive)} className={isNeuralActive ? "text-cyan-400" : "text-gray-700"}>
           {isEyesOpen ? <FaEye size={16}/> : <FaEyeSlash size={16} className="text-red-500"/>}
        </button>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-6 mb-6 italic opacity-50">
          Neural Menu {isNeuralActive && <span className="text-cyan-500 animate-pulse">●</span>}
        </p>
        
        {menuItems.map((item) => (
          <NavLink key={item.name} to={item.path} className={({ isActive }) => `
              flex items-center gap-4 px-6 py-4 transition-all ${isActive ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border-l-[3px] border-cyan-500' : 'text-gray-500 hover:text-white'}
            `}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-[13px] font-bold uppercase italic">{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="px-4 mt-auto">
        <div className="opacity-0 h-0 overflow-hidden">
            <Webcam ref={webcamRef} />
        </div>
        <button 
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="w-full flex items-center gap-4 px-6 py-4 text-gray-600 hover:text-rose-500 uppercase italic text-[11px]"
        >
          <FaSignOutAlt size={18} />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;