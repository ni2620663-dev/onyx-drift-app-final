import React, { useState, useContext } from "react";
import { createPost } from "../api";
import { AuthContext } from "../context/AuthContext";

const MediaUploader = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const { token } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("content", content);
    if (file) formData.append("media", file);

    try {
      const res = await createPost(formData, token);
      onPostCreated(res.data);
      setContent("");
      setFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
      <textarea
        className="w-full p-2 border rounded mb-2"
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mb-2" />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Post
      </button>
    </form>
  );
};

export default MediaUploader;
