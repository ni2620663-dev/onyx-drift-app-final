/**
 * 🎙️ OnyxVoice Core: Pure Web Audio API Frequency Analysis
 * এটি রিয়েল-টাইম ফ্রিকোয়েন্সি এবং ইনটেনসিটি ট্র্যাক করে।
 */
class OnyxVoiceEngine {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.stream = null;
  }

  // ইঞ্জিন চালু করা
  async init() {
    try {
      if (this.audioCtx && this.audioCtx.state === 'running') return;

      // ইউজার ইন্টারঅ্যাকশনের পর কনটেক্সট চালু করা
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stream = stream; // স্ট্রিমটি সেভ রাখলাম যাতে পরে বন্ধ করা যায়

      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      
      // FFT Size: ২৫৬ হলো লো-ল্যাটেন্সি প্রসেসিংয়ের জন্য সেরা
      this.analyser.fftSize = 256; 
      
      source.connect(this.analyser);
      
      // অডিও কনটেক্সট সাসপেন্ড থাকলে তা চালু করা
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }
      
      console.log("🎙️ OnyxVoice: Neural Audio Pipeline Active");
    } catch (err) {
      console.error("🎙️ OnyxVoice: Mic Access Denied or Hardware Busy", err);
    }
  }

  // রিয়েল-টাইম ফ্রিকোয়েন্সি এবং ভলিউম ডেটা নেওয়া
  getFrequencyData() {
    if (!this.analyser) return { dataArray: new Uint8Array(0), volume: 0 };

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    // ভলিউম ক্যালকুলেশন (এভারেজ ইনটেনসিটি)
    const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    
    return { 
      dataArray,
      volume: volume.toFixed(2)
    };
  }

  // রিসোর্স রিলিজ করার জন্য মেথড
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioCtx) {
      this.audioCtx.close();
    }
  }
}

const OnyxVoice = new OnyxVoiceEngine();
export default OnyxVoice;