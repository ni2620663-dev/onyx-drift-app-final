import React from "react";

const shortcuts = ["Home", "Friends", "Groups", "Events", "Marketplace"];

export default function SidebarLeft() {
  return (
    <aside className="w-64 hidden md:block space-y-4">
      {shortcuts.map((s, idx) => (
        <div
          key={idx}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors"
        >
          {s}
        </div>
      ))}
    </aside>
  );
}
