import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

// সিনেমাটিক প্রিসেট ডাটা (কালার গ্রেডিং এর জন্য)
const getCinematicPresets = (mood) => {
  const presets = {
    'oppenheimer': {
      brightness: 0.9, contrast: 1.4, saturate: 0.6,
      colorMatrix: "1:0:0:0:0:0:1:0:0:0:0:0:1.2:0:0" 
    },
    'matrix': {
      brightness: 1.0, contrast: 1.2, saturate: 0.8,
      colorMatrix: "0.8:0:0:0:0:0:1.5:0:0:0:0:0:0.8:0:0"
    },
    'cyberpunk': {
      brightness: 1.1, contrast: 1.3, saturate: 1.8,
      colorMatrix: "1.2:0:0:0:0:0:0.8:0:0:0:0:0:1.5:0:0"
    },
    'vintage': {
      brightness: 1.0, contrast: 0.9, saturate: 0.5,
      colorMatrix: "1.1:0:0:0:0:0:1:0:0:0:0:0:0.7:0:0"
    }
  };
  return presets[mood] || null;
};

export const renderVideo = async (videoFile, layers, editData, setProgress) => {
  
  // ১. FFmpeg কোর লোড করা (v0.12+ স্টাইল)
  if (!ffmpeg.loaded) {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  }

  // প্রগ্রেস ট্র্যাকিং
  ffmpeg.on('progress', ({ progress }) => {
    setProgress(Math.round(progress * 100));
  });

  // ২. ইনপুট ফাইল রাইট করা
  await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

  // ৩. ফিল্টার চেইন তৈরি করা
  const { filters, mood, rotation } = editData;
  const preset = getCinematicPresets(mood);

  // বেসিক এডজাস্টমেন্ট
  let videoFilter = `eq=brightness=${(filters.brightness - 100) / 100}:contrast=${filters.contrast / 100}:saturation=${filters.saturate / 100}`;

  // যদি সিনেমাটিক মুড থাকে তবে আরও এডভান্সড ফিল্টার যোগ হবে
  if (preset) {
    videoFilter += `,eq=brightness=${preset.brightness}:contrast=${preset.contrast}:saturation=${preset.saturate}`;
    videoFilter += `,colorchannelmixer=${preset.colorMatrix}`;
  }

  // রোটেশন লজিক
  if (rotation !== 0) {
    videoFilter += `,rotate=${(rotation * Math.PI) / 180}`;
  }

  // ৪. রেন্ডারিং কমান্ড এক্সিকিউট করা (ffmpeg.exec)
  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-vf', videoFilter,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    'output.mp4'
  ]);

  // ৫. আউটপুট ফাইল রিড করা
  const data = await ffmpeg.readFile('output.mp4');

  // ৬. ফাইনাল ব্লব ইউআরএল জেনারেট করা
  return URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
};