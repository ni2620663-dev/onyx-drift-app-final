/**
 * 🌉 OnyxBridge: The Neural Decision Center
 * vision + voice ডেটা প্রসেস করে অ্যাকশন ট্রিগার করে।
 */
import OnyxVision from './OnyxVision';
import OnyxVoice from './OnyxVoice';

class OnyxBridge {
  constructor() {
    this.isActive = false;
    this.animationId = null;
    this.isProcessing = false;
  }

  async activate(videoElement, canvasCtx, onAction) {
    if (this.isActive) return;
    this.isActive = true;

    try {
      await OnyxVoice.init();
    } catch (err) {
      console.warn("🎙️ OnyxBridge: Voice init failed");
    }

    const pulse = () => {
      if (!this.isActive) return;

      if (videoElement.readyState >= 2) {
        const movement = OnyxVision.processFrame(videoElement, canvasCtx);
        const audio = OnyxVoice.getFrequencyData();

        // থ্রেশহোল্ড টিউনিং: movement > 5000 অনেক বেশি, এটিকে কমিয়ে ১০০-২০০ করে দেখুন
        const isMoving = movement > 150; 
        const isSpeaking = audio && audio.volume > 10; 

        if ((isMoving || isSpeaking) && !this.isProcessing) {
          this.isProcessing = true;

          onAction({ 
            type: 'USER_INTENT_DETECTED', 
            power: (movement || 0) + (parseFloat(audio?.volume) || 0),
            source: { vision: isMoving, voice: isSpeaking }
          });

          // কুলডাউন টাইম ১.৫ সেকেন্ড করা হয়েছে রেসপন্সিভনেস বাড়াতে
          setTimeout(() => { this.isProcessing = false; }, 1500);
        }
      }

      this.animationId = requestAnimationFrame(pulse);
    };

    pulse();
  }

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

export default new OnyxBridge();