import React, { useState } from 'react';
import { 
  FaLock, FaCreditCard, FaMobileAlt, FaCheckCircle, 
  FaSpinner, FaBolt, FaShieldAlt 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import toast from "react-hot-toast";

const PaymentGateway = ({ amount, product, onSuccess, userImpact, setUserImpact }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [method, setMethod] = useState('bkash');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const API_URL = (import.meta.env.VITE_API_BASE_URL || "https://onyx-drift-app-final.onrender.com").replace(/\/$/, "");

  // ১. পয়েন্ট দিয়ে কেনাকাটার লজিক
  const handlePointPurchase = async () => {
    if (!product || userImpact < product.points) {
      return toast.error("Insufficient Impact Points! Keep drifting.");
    }

    setProcessing(true);
    try {
      const token = await getAccessTokenSilently();
      const response = await axios.post(`${API_URL}/api/user/purchase-item`, {
        itemId: product.id,
        cost: product.points,
        isPointsPayment: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserImpact(response.data.balance); // লোকাল ব্যালেন্স আপডেট
        completeTransaction();
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Neural Link Failed");
      setProcessing(false);
    }
  };

  // ২. ক্যাশ পেমেন্ট লজিক (MFS/Card)
  const handleCashPayment = async () => {
    setProcessing(true);
    // এখানে আপনার SSLCommerz বা Stripe পেমেন্ট গেটওয়ে ইন্টিগ্রেশন হবে
    // আপাতত আমরা সাকসেস সিমুলেশন করছি
    setTimeout(async () => {
        try {
            const token = await getAccessTokenSilently();
            // ব্যাকএন্ডে কেনা আইটেমটি সেভ করা
            await axios.post(`${API_URL}/api/user/purchase-item`, {
                itemId: product.id,
                isPointsPayment: false
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            completeTransaction();
        } catch (err) {
            toast.error("Database Sync Failed");
            setProcessing(false);
        }
    }, 2000);
  };

  const completeTransaction = () => {
    setProcessing(false);
    setDone(true);
    setTimeout(() => {
      if (onSuccess) onSuccess();
    }, 1500);
  };

  // পেমেন্ট সফল ভিউ
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
      <p className="text-zinc-500 text-xs font-bold mt-2 uppercase tracking-[2px]">Neural Asset Unlocked</p>
    </motion.div>
  );

  return (
    <div className="bg-zinc-900/90 backdrop-blur-2xl p-8 rounded-[40px] border border-white/10 w-full max-w-sm mx-auto shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-white font-black text-lg flex items-center gap-2 italic tracking-tighter uppercase">
          <FaShieldAlt className="text-cyan-500 text-xs" /> Secure Grid
        </h3>
        <div className="px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
          <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">Encrypted</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3 mb-10">
        {/* Impact Points Option */}
        <motion.div 
          whileTap={{ scale: 0.98 }}
          onClick={() => setMethod('points')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all flex items-center justify-between group ${
            method === 'points' ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'border-white/5 bg-black/40 hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${method === 'points' ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
              <FaBolt size={18} />
            </div>
            <div>
                <span className={`text-sm font-black uppercase tracking-tight block ${method === 'points' ? 'text-white' : 'text-zinc-500'}`}>Impact Points</span>
                <span className="text-[9px] text-zinc-600 font-bold uppercase">{userImpact} Available</span>
            </div>
          </div>
          {method === 'points' && <div className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />}
        </motion.div>

        {/* bKash Option */}
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

        {/* Card Option */}
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
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[2px]">Payable Balance</p>
            <p className="text-3xl font-black text-white italic">
                {method === 'points' ? `${product?.points} PTS` : `৳${amount}`}
            </p>
          </div>
          <p className="text-[10px] font-bold text-cyan-500/50 mb-1">SECURE SYNC</p>
        </div>
        
        <button 
          onClick={method === 'points' ? handlePointPurchase : handleCashPayment}
          disabled={processing || (method === 'points' && userImpact < product?.points)}
          className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 ${
            processing || (method === 'points' && userImpact < product?.points)
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50' 
            : 'bg-white text-black hover:bg-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95'
          }`}
        >
          {processing ? (
            <>
              <FaSpinner className="animate-spin" /> Transmitting...
            </>
          ) : (
            method === 'points' && userImpact < product?.points ? "Insufficient Points" : "Confirm Sync"
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentGateway;