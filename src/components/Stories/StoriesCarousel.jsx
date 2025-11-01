import React from "react";

const dummyStories = [
  { user: "Alice", image: "https://picsum.photos/100?1" },
  { user: "Bob", image: "https://picsum.photos/100?2" },
  { user: "Charlie", image: "https://picsum.photos/100?3" },
];

export default function StoriesCarousel() {
  return (
    <div className="flex space-x-4 overflow-x-auto p-2 scrollbar-hide">
      {dummyStories.map((story, idx) => (
        <div
          key={idx}
          className="flex-shrink-0 w-20 h-32 bg-gray-200 dark:bg-gray-700 rounded-xl relative cursor-pointer transform hover:scale-105 transition-transform"
        >
          <img
            src={story.image}
            className="w-full h-full rounded-xl object-cover"
            alt={story.user}
          />
          <p className="absolute bottom-1 left-1 text-xs text-white">{story.user}</p>
        </div>
      ))}
    </div>
  );
}
