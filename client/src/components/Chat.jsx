import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Deployment এ পরিবর্তন

export default function Chat({ userId, chatWith }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.on("receive-message", (msg) => setMessages(prev => [...prev, msg]));
  }, []);

  const sendMessage = () => {
    if (!text) return;
    socket.emit("send-message", { senderId: userId, receiverId: chatWith, text });
    setText("");
  };

  return (
    <div>
      <div style={{ height: "300px", overflowY: "scroll" }}>
        {messages.map((m, i) => <div key={i}>{m.senderId}: {m.text}</div>)}
      </div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
