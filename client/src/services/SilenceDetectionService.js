export const detectSilence = async (videoUrl, threshold = 0.02, minSilenceLen = 0.5) => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const response = await fetch(videoUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  
  const channelData = audioBuffer.getChannelData(0); // Left channel
  const sampleRate = audioBuffer.sampleRate;
  const segments = [];
  let isSilent = false;
  let silenceStart = 0;

  // অডিও বাফার এনালাইজ করা
  for (let i = 0; i < channelData.length; i += 4096) {
    const slice = channelData.slice(i, i + 4096);
    const rms = Math.sqrt(slice.reduce((acc, val) => acc + val * val, 0) / slice.length);
    const currentTime = i / sampleRate;

    if (rms < threshold && !isSilent) {
      isSilent = true;
      silenceStart = currentTime;
    } else if (rms >= threshold && isSilent) {
      isSilent = false;
      if (currentTime - silenceStart >= minSilenceLen) {
        segments.push({ start: silenceStart, end: currentTime });
      }
    }
  }

  return segments; // সাইলেন্ট অংশের লিস্ট (যেমন: [{start: 2.1, end: 3.5}])
};