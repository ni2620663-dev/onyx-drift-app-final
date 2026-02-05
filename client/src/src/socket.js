import { io } from "socket.io-client";

// আপনার Render সার্ভার URL এবং polling কনফিগারেশন
const socket = io("https://onyx-drift-app-final.onrender.com", {
  transports: ["polling", "websocket"], // পোলিং ব্যাকআপ হিসেবে কানেকশন স্ট্যাবল রাখবে
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

export default socket;