import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from "@auth0/auth0-react";
import { 
  StreamVideoClient, 
  StreamVideo, 
  StreamCall, 
  SpeakerLayout, 
  CallControls,
  StreamTheme
} from '@stream-io/video-react-sdk';
import { HiOutlineXMark } from "react-icons/hi2";
import { FaClock, FaMicrophone } from "react-icons/fa";
import { motion } from "framer-motion";

// Stream SDK styles
import '@stream-io/video-react-sdk';

const apiKey = 'aw5bpt4vfj56'; 

const CallPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth0();

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isCallStarted, setIsCallStarted] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const callMode = queryParams.get('mode') || 'video';

  /* =================⏳ TIMER LOGIC ================= */
  useEffect(() => {
    let interval = null;
    if (isCallStarted) {
      interval = setInterval(() => setDuration((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallStarted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /* =================🛰️ STREAM ENGINE ================= */
  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !user || !roomId) return;

    let videoClient;
    let videoCall;

    const initStream = async () => {
      const cleanUserId = user.sub.replace(/[^a-zA-Z0-9]/g, "_");

      try {
        // Fix: Call devToken as a static method correctly
        const token = StreamVideoClient.devToken(cleanUserId);

        videoClient = new StreamVideoClient({
          apiKey,
          user: {
            id: cleanUserId,
            name: user.name || 'Drifter',
            image: user.picture,
          },
          token,
        });

        videoCall = videoClient.call('default', roomId);
        
        await videoCall.join({ create: true });
        
        // Handle Audio Only mode camera state
        if (callMode === 'audio') {
          await videoCall.camera.disable();
        }

        setClient(videoClient);
        setCall(videoCall);
        setIsCallStarted(true);

      } catch (err) {
        console.error("❌ Neural Link Connection Failed:", err);
        navigate('/messages');
      }
    };

    initStream();

    // Cleanup: Leave call and disconnect user when component unmounts
    return () => {
      if (videoCall) {
        videoCall.leave().catch(e => console.error("Call leave error:", e));
      }
      if (videoClient) {
        videoClient.disconnectUser().catch(e => console.error("Client disconnect error:", e));
      }
    };
  }, [user, isAuthenticated, isAuthLoading, roomId, callMode, navigate]);

  /* =================🖼️ UI HANDLER ================= */
  if (isAuthLoading || !client || !call) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-cyan-500 font-mono overflow-hidden">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-full" />
        <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin" />
      </div>
      <p className="animate-pulse uppercase tracking-[0.5em] text-xs">Establishing Neural Link...</p>
    </div>
  );

  return (
    <StreamVideo client={client}>
      <StreamTheme>
        <div className="fixed inset-0 z-[99999] w-full h-screen bg-[#020617] flex flex-col overflow-hidden">
          
          {/* --- 🛰️ NEURAL HUD OVERLAY --- */}
          <div className="absolute top-0 left-0 w-full p-6 z-[100] flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-3 pointer-events-auto">
              <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-cyan-500/20">
                <div className="relative w-2.5 h-2.5">
                  <div className="w-full h-full bg-cyan-500 rounded-full animate-ping absolute inset-0" />
                  <div className="w-full h-full bg-cyan-400 rounded-full relative" />
                </div>
                <h2 className="text-cyan-400 font-black uppercase tracking-[0.2em] text-[10px]">
                  {isCallStarted ? `Neural ${callMode} Active` : `Initializing...`}
                </h2>
              </div>

              {isCallStarted && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  className="flex items-center gap-2 bg-white/5 backdrop-blur-lg px-4 py-1.5 rounded-xl border border-white/10 w-fit"
                >
                  <FaClock className="text-cyan-500 text-[10px]" />
                  <span className="text-white font-mono text-sm font-bold tracking-widest">
                    {formatTime(duration)}
                  </span>
                </motion.div>
              )}
            </div>
            
            <button 
              onClick={() => navigate('/messages')}
              className="w-14 h-14 bg-red-500/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-red-500/30 text-red-500 pointer-events-auto hover:bg-red-500 hover:text-white transition-all active:scale-90"
            >
              <HiOutlineXMark size={28} />
            </button>
          </div>

          {/* --- 🎥 STREAM CALL UI --- */}
          <StreamCall call={call}>
            <div className="relative h-full w-full">
              {callMode === 'video' ? (
                <SpeakerLayout />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <div className="relative">
                      <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse" />
                      <img 
                        src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Onyx"} 
                        className="w-32 h-32 rounded-full border-2 border-cyan-500/50 p-1 grayscale object-cover" 
                        alt="Caller" 
                      />
                      <div className="mt-8 flex flex-col items-center gap-2">
                         <FaMicrophone className="text-cyan-500 animate-bounce" />
                         <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em]">Audio Only Mode</p>
                      </div>
                   </div>
                </div>
              )}
              
              {/* কন্ট্রোল বার */}
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
                <CallControls onLeave={() => navigate('/messages')} />
              </div>
            </div>
          </StreamCall>

          {/* --- 💅 CUSTOM CSS OVERRIDES --- */}
          <style>{`
            .str-video__call-controls {
              background: rgba(2, 6, 23, 0.8) !important;
              backdrop-filter: blur(20px) !important;
              border-radius: 30px !important;
              border: 1px solid rgba(34, 211, 238, 0.1) !important;
              padding: 10px !important;
            }
            .str-video__speaker-layout {
              background-color: #020617 !important;
            }
            .str-video__notification { display: none !important; }
            .str-video__participant-details { color: #06b6d4 !important; font-family: monospace !important; }
            .str-video__video-placeholder { background: #020617 !important; }
          `}</style>
        </div>
      </StreamTheme>
    </StreamVideo>
  );
};

export default CallPage;