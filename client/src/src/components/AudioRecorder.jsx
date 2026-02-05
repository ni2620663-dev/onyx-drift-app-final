import React, { useState, useRef } from "react";
import { HiOutlineMicrophone, HiOutlineStop, HiOutlineTrash, HiOutlinePaperAirplane } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";

const AudioRecorder = ({ onSend }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: "audio/ogg; codecs=opus" });
      setAudioURL(URL.createObjectURL(audioBlob));
      audioChunks.current = [];
    };
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-[2rem] border border-white/10">
      <AnimatePresence>
        {!isRecording ? (
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={startRecording}
            className="p-4 bg-cyan-500 rounded-full text-black shadow-[0_0_15px_cyan]"
          >
            <HiOutlineMicrophone size={24} />
          </motion.button>
        ) : (
          <div className="flex items-center gap-4 px-4 w-full">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity }}
              className="w-3 h-3 bg-red-500 rounded-full" 
            />
            <div className="flex-1 h-8 bg-white/10 rounded-full overflow-hidden flex items-center justify-center">
               <span className="text-[10px] font-black text-cyan-400 animate-pulse uppercase tracking-widest">Recording Signal...</span>
            </div>
            <button onClick={stopRecording} className="p-2 text-white hover:text-red-500 transition-colors">
              <HiOutlineStop size={24} />
            </button>
          </div>
        )}
      </AnimatePresence>

      {audioURL && !isRecording && (
        <div className="flex items-center gap-2">
           <audio src={audioURL} controls className="h-8 w-40" />
           <button onClick={() => onSend(audioURL)} className="p-3 bg-white/10 rounded-full text-cyan-400">
             <HiOutlinePaperAirplane size={20} />
           </button>
           <button onClick={() => setAudioURL("")} className="text-gray-500"><HiOutlineTrash /></button>
        </div>
      )}
    </div>
  );
};