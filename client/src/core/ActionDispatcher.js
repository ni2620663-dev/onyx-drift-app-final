import toast from 'react-hot-toast';

/**
 * ActionDispatcher: OnyxDrift-এর নিউরাল কোর থেকে আসা 
 * সিদ্ধান্তগুলোকে বাস্তবে কার্যকর করার কেন্দ্রীয় হাব।
 */
export const ActionDispatcher = {
  /**
   * @param {Object} decision - NeuralCore থেকে প্রাপ্ত সিদ্ধান্ত { action, path, command, roomId }
   * @param {Function} navigate - react-router-dom এর useNavigate হুক
   */
  execute(decision, navigate) {
    if (!decision || !decision.action) {
      console.warn("Onyx-OS: Empty or invalid decision received.");
      return;
    }

    console.log("Onyx-OS: Dispatching action ->", decision.action);

    switch (decision.action) {
      // ১. অটো রিপ্লাই লজিক
      case 'AUTO_REPLY':
        toast.success("AI: Auto-reply sent to keep your focus.", {
          icon: '🤖',
          style: { background: '#0f172a', color: '#22d3ee', border: '1px solid #0891b2' }
        });
        // TODO: আপনার মেসেজিং API কল করুন এখানে
        break;

      // ২. ডু নট ডিস্টার্ব (DND) মোড
      case 'ACTIVATE_DND':
        toast.info("AI: DND Mode activated. Neural focus secured.", {
          icon: '🛡️'
        });
        // TODO: সিস্টেম সাইলেন্ট বা নোটিফিকেশন মিউট লজিক
        break;

      // ৩. অ্যাপের ভেতরে নেভিগেশন
      case 'NAVIGATE':
        if (decision.path && navigate) {
          navigate(decision.path);
          toast.success(`Switching to ${decision.path.replace('/', '')}`);
        }
        break;

      // ৪. ভিডিও বা ভয়েস কল শুরু করা
      case 'EXECUTE_CALL':
        if (decision.roomId && navigate) {
          navigate(`/call/${decision.roomId}`);
          toast.success("Establishing secure neural link...");
        }
        break;

      // ৫. কাস্টম কমান্ড এক্সিকিউশন
      case 'EXECUTE':
        console.log("Onyx-OS: Executing system command ->", decision.command);
        // এখানে ভলিউম কন্ট্রোল বা মিউজিক প্লে এর মতো কমান্ড রাখা যায়
        break;

      default:
        console.warn("Onyx-OS: Unknown action ->", decision.action);
    }
  }
};