export const detectBeats = async (audioUrl) => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // বিট ডিটেকশন অ্যালগরিদম (Peak Detection)
  const peaks = [];
  const threshold = 0.8; // বিট সেন্সিটিভিটি
  const interval = sampleRate * 0.25; // দুটি বিটের মধ্যে ন্যূনতম দূরত্ব (০.২৫ সেকেন্ড)

  for (let i = 0; i < channelData.length; i += 1024) {
    const volume = Math.abs(channelData[i]);
    if (volume > threshold) {
      const time = i / sampleRate;
      if (peaks.length === 0 || time - peaks[peaks.length - 1] > 0.25) {
        peaks.push(time);
      }
    }
  }

  return peaks; // বিটের সময়ের লিস্ট: [0.5, 1.2, 1.8, ...]
};