import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-100 p-4">
      <h2 className="font-bold mb-2">Menu</h2>
      <ul className="space-y-2">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/friends">Friends</Link></li>
        <li><Link to="/groups">Groups</Link></li>
        <li><Link to="/events">Events</Link></li>
        <li><Link to="/marketplace">Marketplace</Link></li>
      </ul>
    </aside>
  );
};

