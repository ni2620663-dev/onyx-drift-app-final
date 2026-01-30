import React from "react";

const moods = [
  { em: "🚀", name: "Neural-Flow", color: "shadow-cyan-500/50 border-cyan-500", glow: "text-cyan-400" },
  { em: "🔥", name: "Enraged", color: "shadow-red-500/50 border-red-500", glow: "text-red-500" },
  { em: "💜", name: "Ecstatic", color: "shadow-purple-500/50 border-purple-500", glow: "text-purple-400" },
  { em: "💧", name: "Sad", color: "shadow-blue-500/50 border-blue-500", glow: "text-blue-400" },
  { em: "⚡", name: "Excited", color: "shadow-yellow-500/50 border-yellow-500", glow: "text-yellow-400" },
];

const MoodSelector = ({ currentMood, onSelectMood }) => {
  return (
    <div className="flex gap-2 p-2 bg-zinc-900/50 backdrop-blur-md rounded-full border border-zinc-800 mb-2 w-max mx-auto">
      {moods.map((m) => (
        <button
          key={m.name}
          onClick={() => onSelectMood(m.name)}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
            currentMood === m.name ? `bg-zinc-800 border ${m.color} shadow-lg scale-125` : "opacity-50 hover:opacity-100"
          }`}
          title={m.name}
        >
          {m.em}
        </button>
      ))}
    </div>
  );
};

export default MoodSelector;