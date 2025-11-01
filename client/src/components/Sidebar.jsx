// src/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <aside
      style={{
        width: "220px",
        backgroundColor: "#f5f5f5",
        padding: "20px",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        borderRight: "1px solid #ddd",
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ marginBottom: "20px", fontSize: "20px" }}>Menu</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li style={{ margin: "10px 0" }}>
          <Link to="/" style={{ textDecoration: "none", color: "#333" }}>Home</Link>
        </li>
        <li style={{ margin: "10px 0" }}>
          <Link to="/profile" style={{ textDecoration: "none", color: "#333" }}>Profile</Link>
        </li>
        <li style={{ margin: "10px 0" }}>
          <Link to="/friends" style={{ textDecoration: "none", color: "#333" }}>Friends</Link>
        </li>
        <li style={{ margin: "10px 0" }}>
          <Link to="/groups" style={{ textDecoration: "none", color: "#333" }}>Groups</Link>
        </li>
        <li style={{ margin: "10px 0" }}>
          <Link to="/messages" style={{ textDecoration: "none", color: "#333" }}>Messages</Link>
        </li>
        <li style={{ margin: "10px 0" }}>
          <Link to="/settings" style={{ textDecoration: "none", color: "#333" }}>Settings</Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
