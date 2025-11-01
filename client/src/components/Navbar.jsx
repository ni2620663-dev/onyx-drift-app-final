import React from "react";
import logo from "../assets/images/logo.png";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <img src={logo} alt="Logo" className="h-8" />
      <div className="space-x-4">
        <Link to="/">Home</Link>
        <Link to="/friends">Friends</Link>
        <Link to="/groups">Groups</Link>
        <Link to="/events">Events</Link>
        <Link to="/marketplace">Marketplace</Link>
      </div>
    </nav>
  );
};

export default Navbar;
