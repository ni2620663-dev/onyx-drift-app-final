import React from "react";

const friends = [
  { name: "Alice", avatar: "https://i.pravatar.cc/40?img=1" },
  { name: "Bob", avatar: "https://i.pravatar.cc/40?img=2" },
  { name: "Charlie", avatar: "https://i.pravatar.cc/40?img=3" },
  { name: "David", avatar: "https://i.pravatar.cc/40?img=4" },
  { name: "Eve", avatar: "https://i.pravatar.cc/40?img=5" },
];

export default function SidebarRight() {
  return (
    <aside className="w-64 hidden lg:block space-y-4">
      <h2 className="font-bold text-lg dark:text-white">Friends</h2>
      {friends.map((f, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors"
        >
          <img
            src={f.avatar}
            alt={f.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="text-gray-800 dark:text-gray-200">{f.name}</span>
        </div>
      ))}
    </aside>
  );
}
