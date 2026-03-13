/**
 * 👁️ OnyxVision Core: Optimized Pixel Analysis Engine
 * গেম বা সোশ্যাল ওএস-এর জন্য হাই-পারফরম্যান্স পিক্সেল ট্র্যাকিং
 */
class OnyxVisionClass {
  constructor() {
    this.lastFrame = null;
    this.threshold = 45; // ডিফল্ট সংবেদনশীলতা
  }

  /**
   * ভিডিও ফ্রেম থেকে মুভমেন্ট স্কোর নির্ণয় করে
   * @param {HTMLVideoElement} video 
   * @param {CanvasRenderingContext2D} ctx 
   * @returns {number} movementScore
   */
  processFrame(video, ctx) {
    // ১. সেফগার্ড: ভিডিও এলিমেন্ট চেক এবং মেটাডেটা লোড হওয়া নিশ্চিত করা
    if (!video || !ctx || video.readyState !== 4 || video.videoWidth === 0) {
      return 0;
    }

    const { videoWidth: width, videoHeight: height } = video;

    // ২. ক্যানভাস সাইজ সিঙ্ক
    if (ctx.canvas.width !== width || ctx.canvas.height !== height) {
      ctx.canvas.width = width;
      ctx.canvas.height = height;
    }

    try {
      ctx.drawImage(video, 0, 0, width, height);
      const frameData = ctx.getImageData(0, 0, width, height);
      const pixels = frameData.data;

      let movementScore = 0;
      
      // ৩. পিক্সেল ডেটা এনালাইসিস
      if (this.lastFrame) {
        // লুপ অপ্টিমাইজেশন: প্রতি ১৬ পিক্সেল অন্তর চেক (পারফরম্যান্সের জন্য)
        for (let i = 0; i < pixels.length; i += 16) { 
          // পিক্সেলের RGB গড়ের পার্থক্য বের করা
          const currentAvg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          const lastAvg = (this.lastFrame[i] + this.lastFrame[i + 1] + this.lastFrame[i + 2]) / 3;
          
          if (Math.abs(currentAvg - lastAvg) > this.threshold) {
            movementScore++;
          }
        }
      }

      // ৪. মেমোরি ম্যানেজমেন্ট: Uint8ClampedArray ব্যবহার করা মেমোরির জন্য সেরা
      this.lastFrame = new Uint8ClampedArray(pixels);
      return movementScore;
      
    } catch (error) {
      console.warn("OnyxVision: Frame analysis interrupted", error);
      return 0;
    }
  }

  /**
   * সেনসিটিভিটি পরিবর্তনের জন্য (০.১ থেকে ১.০ স্কেল)
   */
  setSensitivity(val) {
    // ভ্যালুটিকে ১০ থেকে ২৫৫ এর মধ্যে সীমাবদ্ধ রাখা
    this.threshold = Math.max(10, Math.min(255, Math.floor(val * 255)));
  }
}

// Singleton প্যাটার্ন অনুযায়ী এক্সপোর্ট
const OnyxVision = new OnyxVisionClass();
export default OnyxVision;