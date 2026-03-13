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
// লজিক: অডিওর ভলিউম স্পাইক বা বিট ডিটেক্ট করা
export const getBeatTimestamps = async (audioUrl) => {
  const audioContext = new AudioContext();
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const rawData = audioBuffer.getChannelData(0);
  const samples = 44100; // 1 second
  const beats = [];
  
  // প্রতি ১ সেকেন্ডে মিউজিকের তীব্রতা অ্যানালাইসিস
  for (let i = 0; i < rawData.length; i += samples) {
    let sum = 0;
    for (let j = 0; j < samples; j++) {
      sum += Math.abs(rawData[i + j]);
    }
    if (sum / samples > 0.15) { // Threshold
      beats.push(i / samples);
    }
  }
  return beats;
};

  return peaks; // বিটের সময়ের লিস্ট: [0.5, 1.2, 1.8, ...]
};