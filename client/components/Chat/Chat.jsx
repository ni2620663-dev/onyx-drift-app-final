import React, { useEffect, useState } from "react";
import socket from "../../socket";
import Message from "./Message";

const Chat = ({ userId, receiverId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    socket.on("receive-message", (msg) => {
      if (msg.senderId === receiverId || msg.receiverId === receiverId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("receive-message");
  }, [receiverId]);

  const sendMessage = () => {
    if (text.trim() === "") return;
    socket.emit("send-message", { senderId: userId, receiverId, text, type: "text" });
    setText("");
  };

  return (
    <div>
      <div>
        {messages.map((msg, idx) => (
          <Message key={idx} msg={msg} userId={userId} />
        ))}
      </div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
