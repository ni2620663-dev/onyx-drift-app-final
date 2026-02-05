import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const JoinPage = () => {
  const [searchParams] = useSearchParams();
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  useEffect(() => {
    // ১. URL থেকে 'ref' কোডটি নেওয়া
    const refCode = searchParams.get("ref");
    
    if (refCode) {
      // ২. রেফারেল কোডটি ব্রাউজারে সেভ করা যাতে সাইন-আপের সময় ব্যবহার করা যায়
      localStorage.setItem("referralCode", refCode);
      console.log("Neural Referral Linked:", refCode);
    }
  }, [searchParams]);

  const handleJoin = () => {
    loginWithRedirect({
      appState: { targetUrl: "/onboarding" } // রেজিস্ট্রেশনের পর যেখানে যাবে
    });
  };

  return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-black italic text-white uppercase tracking-tighter mb-4">
          Join the <span className="text-cyan-400">Drift</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base mb-8 tracking-widest uppercase opacity-60">
          {searchParams.get("ref") 
            ? `Transmission Received from Node: ${searchParams.get("ref")}` 
            : "Accessing the neural network..."}
        </p>
        
        <button 
          onClick={handleJoin}
          className="px-12 py-5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full text-white font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105 transition-all active:scale-95"
        >
          Initialize Sync
        </button>
      </div>
    </div>
  );
};

export default JoinPage;