import React from "react";

const Message = ({ msg, userId }) => {
  const isSender = msg.senderId === userId;
  return (
    <div style={{ textAlign: isSender ? "right" : "left" }}>
      <span>{msg.text}</span>
    </div>
  );
};

export default Message;
