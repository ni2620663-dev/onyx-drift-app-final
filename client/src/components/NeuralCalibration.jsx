import React, { useState } from "react";
import OnyxEngine from "../core/OnyxEngine";

const NeuralCalibration = () => {
  const [sensitivity, setSensitivity] = useState(0.8);

  const handleSensitivityChange = (e) => {
    const val = parseFloat(e.target.value);
    setSensitivity(val);
    OnyxEngine.setSensitivity(val); // OnyxEngine-এ এই মেথডটি থাকতে হবে
  };

  return (
    <div className="p-6 bg-black/80 border border-cyan-500/30 rounded-3xl text-white">
      <h2 className="text-xl font-black uppercase text-cyan-400 mb-4">Neural Calibration</h2>
      
      <div className="mb-6">
        <label className="block text-sm mb-2">Eye-Gaze Sensitivity</label>
        <input 
          type="range" min="0.1" max="1" step="0.05" value={sensitivity}
          onChange={handleSensitivityChange}
          className="w-full accent-cyan-500"
        />
        <p className="text-xs text-gray-400 mt-1">Adjust how fast the AI reacts to eye movement.</p>
      </div>

      <div className="flex gap-4">
        <button className="bg-cyan-500 text-black px-4 py-2 rounded-xl font-bold">Recalibrate Eyes</button>
        <button className="bg-zinc-800 px-4 py-2 rounded-xl font-bold">Reset Defaults</button>
      </div>
    </div>
  );
};

export default NeuralCalibration;