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
        zIndex: 10,
      }}
    >
      <h2 style={{ marginBottom: "20px", fontSize: "20px", color: "#2563eb", fontWeight: "bold" }}>Menu</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {["Home", "Profile", "Friends", "Groups", "Messages", "Settings"].map((item) => (
          <li key={item} style={{ margin: "15px 0" }}>
            <Link 
              to={item === "Home" ? "/" : `/${item.toLowerCase()}`} 
              style={{ textDecoration: "none", color: "#4b5563", fontWeight: "500" }}
              className="hover:text-blue-600 transition"
            >
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;