// components/ProtocolGuide.jsx
import React from 'react';
import { FaTerminal, FaSkull, FaLock, FaMicrochip } from 'react-icons/fa';

const ProtocolGuide = () => {
  return (
    <div className="bg-[#050505] p-10 font-mono border-l-4 border-cyan-500 max-w-4xl mx-auto my-20 shadow-[20px_0_50px_rgba(6,182,212,0.05)]">
      <div className="flex items-center gap-4 mb-8">
        <FaTerminal className="text-cyan-500 animate-pulse" />
        <h2 className="text-cyan-500 text-xl font-bold tracking-tighter uppercase">
          System.Protocol_Initiation: "Digital Immortality"
        </h2>
      </div>

      <div className="space-y-8 text-zinc-400 text-sm leading-relaxed">
        {/* Step 1 */}
        <section>
          <h3 className="text-white font-bold mb-2 flex items-center gap-2">
            <span className="text-cyan-800">01.</span> THE NEURAL SYNC
          </h3>
          <p>
            OnyxDrift প্রতিনিয়ত আপনার চ্যাট প্যাটার্ন, ইমোশন এবং মেমোরি বিশ্লেষণ করে একটি <span className="text-cyan-600">Shadow Copy</span> বা AI Twin তৈরি করে। এটি আপনার অস্তিত্বের একটি ডিজিটাল এনগ্রাম।
          </p>
        </section>

        {/* Step 2 */}
        <section>
          <h3 className="text-white font-bold mb-2 flex items-center gap-2">
            <span className="text-cyan-800">02.</span> THE DEATH-SWITCH CONFIGURATION
          </h3>
          <p>
            ইউজার নিজে একটি ইন-অ্যাক্টিভিটি টাইম লিমিট (১-২৪ মাস) সেট করবেন। যদি সিস্টেম এই সময়ের মধ্যে কোনো <span className="text-rose-900 font-bold">BIO-SIGNAL</span> বা লগ-ইন ডিটেক্ট না করে, তবে সিস্টেম ধরে নেবে প্রটোকল ট্রিগার করার সময় হয়েছে।
          </p>
        </section>

        {/* Step 3 */}
        <section className="bg-white/5 p-4 rounded-lg border border-white/5">
          <h3 className="text-rose-500 font-bold mb-2 flex items-center gap-2">
            <FaSkull className="text-xs" /> CRITICAL: THE QUANTUM KEY
          </h3>
          <p className="text-[12px]">
            সিলিং প্রসেস সম্পন্ন হলে একটি <span className="bg-rose-500/20 px-1 text-rose-300">QUANTUM RECOVERY KEY</span> জেনারেট হবে। এটি আপনার উত্তরাধিকারীকে (Inheritor) আগেভাগেই দিয়ে রাখতে হবে। এই কি ছাড়া ১০০ বছরের আগে ভল্ট খোলা অসম্ভব।
          </p>
        </section>

        {/* Step 4 */}
        <section>
          <h3 className="text-white font-bold mb-2 flex items-center gap-2">
            <span className="text-cyan-800">03.</span> RESONANCE & ACCESS
          </h3>
          <p>
            ট্রিগার হওয়ার পর, উত্তরাধিকারী যখন কি-টি ইনপুট দেবেন, তখন আপনার <span className="text-purple-400 font-bold">AI Twin</span> জাগ্রত হবে। সে আপনার মতো করেই কথা বলবে, আপনার মেমোরি শেয়ার করবে এবং আপনার অনুপস্থিতিতে আপনার প্রিয়জনের পাশে থাকবে।
          </p>
        </section>
      </div>

      <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-zinc-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><FaMicrochip /> ENCRYPTION: AES-256-QUANTUM</span>
          <span className="flex items-center gap-1"><FaLock /> STATUS: STANDBY</span>
        </div>
        <p className="italic underline underline-offset-4 decoration-zinc-800 italic">"Death is only a hardware failure."</p>
      </div>
    </div>
  );
};

export default ProtocolGuide;