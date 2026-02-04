import React, { useState } from 'react';
import { FaLock, FaCreditCard, FaMobileAlt, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentGateway = ({ amount, onSuccess }) => {
  const [method, setMethod] = useState('bkash');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handlePayment = () => {
    setProcessing(true);
    // সার্ভার কল সিমুলেশন (২ সেকেন্ড)
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
      // ৩ সেকেন্ড পর সাকসেস কলব্যাক ফায়ার হবে
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    }, 2000);
  };

  // পেমেন্ট সফল হলে এই ভিউটি দেখাবে
  if (done) return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center p-12 bg-zinc-900/50 backdrop-blur-3xl rounded-[40px] border border-cyan-500/20 shadow-2xl"
    >
      <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <FaCheckCircle className="text-cyan-500 text-5xl animate-pulse" />
      </div>
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Signal Received</h2>
      <p className="text-zinc-500 text-xs font-bold mt-2 uppercase tracking-[2px]">Transaction Secured</p>
    </motion.div>
  );

  return (
    <div className="bg-zinc-900/80 backdrop-blur-2xl p-8 rounded-[40px] border border-white/10 w-full max-w-sm mx-auto shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-white font-black text-lg flex items-center gap-2 italic tracking-tighter uppercase">
          <FaLock className="text-cyan-500 text-xs" /> Secure Grid
        </h3>
        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Encrypted</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3 mb-10">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          onClick={() => setMethod('bkash')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-center justify-between group ${
            method === 'bkash' ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.1)]' : 'border-white/5 bg-black/40 hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${method === 'bkash' ? 'bg-pink-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
              <FaMobileAlt size={18} />
            </div>
            <span className={`text-sm font-black uppercase tracking-tight ${method === 'bkash' ? 'text-white' : 'text-zinc-500'}`}>MFS (bKash/Nagad)</span>
          </div>
          {method === 'bkash' && <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />}
        </motion.div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          onClick={() => setMethod('card')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-center justify-between group ${
            method === 'card' ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-white/5 bg-black/40 hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${method === 'card' ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
              <FaCreditCard size={18} />
            </div>
            <span className={`text-sm font-black uppercase tracking-tight ${method === 'card' ? 'text-white' : 'text-zinc-500'}`}>Global Card</span>
          </div>
          {method === 'card' && <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />}
        </motion.div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-white/5 pt-6 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[2px]">Total Amount</p>
            <p className="text-3xl font-black text-white italic">৳{amount}</p>
          </div>
          <p className="text-[10px] font-bold text-cyan-500/50 mb-1">NO TAX INCLUDED</p>
        </div>
        
        <button 
          onClick={handlePayment}
          disabled={processing}
          className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 ${
            processing 
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
            : 'bg-white text-black hover:bg-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95'
          }`}
        >
          {processing ? (
            <>
              <FaSpinner className="animate-spin" /> Transmitting...
            </>
          ) : (
            "Initiate Payment"
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentGateway;