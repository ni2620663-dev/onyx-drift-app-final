/**
 * ⚡ ActionDispatcher: The Execution Layer
 * অকার্যকর অ্যাকশন ফিল্টার করে এবং নিউরাল কমান্ড এক্সিকিউট করে।
 */
import { toast } from 'react-hot-toast';

export const ActionDispatcher = {
  execute(decision, navigate) {
    // ১. সেফগার্ড: সিদ্ধান্ত বা সিদ্ধান্তহীন অবস্থায় রিটার্ন করবে
    if (!decision || typeof decision !== 'object') return;

    // ২. অ্যাকশন টাইপ বের করা
    const actionType = decision.action || decision.type;

    // ৩. যদি কোনো টাইপ না থাকে, তাহলে সাইলেন্টলি রিটার্ন (এরর স্প্যামিং বন্ধ)
    if (!actionType) return;

    switch (actionType) {
      case "USER_INTENT_DETECTED":
        this.handleWakeUp(decision.power || "normal");
        break;

      case "NAVIGATE":
        if (decision.target) {
          toast.success(`Navigating to ${decision.target}...`, {
            style: { background: '#0f172a', color: '#06b6d4', border: '1px solid #06b6d4' }
          });
          if (navigate) navigate(decision.target);
        }
        break;

      case "TOGGLE_THEME":
        document.documentElement.classList.toggle('dark');
        toast("Theme Toggled", { icon: '🌓' });
        break;

      case "NOTIFY":
        toast(decision.message || "System Alert", { icon: '🤖' });
        break;

      default:
        // শুধুমাত্র তখনই ওয়ার্নিং দেখাবো যদি টাইপটি সত্যিই গুরুত্বপূর্ণ হয়
        if (actionType !== "UNKNOWN") {
          console.warn(`⚠️ ActionDispatcher: Received unhandled action type: ${actionType}`);
        }
    }
  },

  handleWakeUp(power) {
    toast.success("Onyx System Awakened", {
      icon: '🧠',
      style: { background: '#1e293b', color: '#8b5cf6', border: '1px solid #8b5cf6' }
    });
    console.log(`🧠 NeuralCore: Wake-up sequence triggered with power level: ${power}`);
  }
};