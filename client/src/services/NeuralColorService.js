export const getCinematicPresets = (mood) => {
  const presets = {
    'oppenheimer': {
      brightness: 0.9,
      contrast: 1.4,
      saturate: 0.6,
      gamma: "0.8:0.8:0.9", // Cold and high contrast
      colorMatrix: "1:0:0:0:0  0:1:0:0:0  0:0:1.2:0:0" // Teal-ish blue push
    },
    'matrix': {
      brightness: 1.0,
      contrast: 1.2,
      saturate: 0.8,
      gamma: "1.0:1.2:1.0", // Greenish tint
      colorMatrix: "0.8:0:0:0:0  0:1.5:0:0:0  0:0:0.8:0:0"
    },
    'cyberpunk': {
      brightness: 1.1,
      contrast: 1.3,
      saturate: 1.8,
      gamma: "1.2:0.9:1.3", // Neon pink and blue push
      colorMatrix: "1.2:0:0:0:0  0:0.8:0:0:0  0:0:1.5:0:0"
    },
    'vintage': {
      brightness: 1.0,
      contrast: 0.9,
      saturate: 0.5,
      gamma: "1.1:1.0:0.8", // Warm yellowish tone
      colorMatrix: "1.1:0:0:0:0  0:1:0:0:0  0:0:0.7:0:0"
    }
  };
  return presets[mood] || presets['vintage'];
};