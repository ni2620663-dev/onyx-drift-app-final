const PublishModal = ({ videoUrl, onPublish }) => {
  return (
    <div className="p-6 bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl">
      <h2 className="text-xl font-black uppercase tracking-tighter mb-6 text-center">Final Transmission</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => onPublish('tiktok')}
          className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-3xl hover:bg-white/10 border border-white/5 transition-all"
        >
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-white/20">
             <span className="font-black text-xs">TK</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">TikTok</span>
        </button>

        <button 
          onClick={() => onPublish('instagram')}
          className="flex flex-col items-center gap-3 p-6 bg-gradient-to-tr from-yellow-500/20 via-red-500/20 to-purple-500/20 rounded-3xl border border-white/5 transition-all"
        >
          <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 to-purple-600 rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-widest">Reels</span>
        </button>
      </div>

      <button className="w-full py-4 bg-cyan-500 text-black font-black uppercase text-xs rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)]">
        Download to Local Device
      </button>
    </div>
  );
};