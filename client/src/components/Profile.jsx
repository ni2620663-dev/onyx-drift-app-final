import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000";

const Profile = ({ userId }) => {
  const [user, setUser] = useState({ name: "", email: "", avatar: "" });
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/profile/${userId}`)
      .then(res => setUser(res.data))
      .catch(err => console.log(err));
  }, [userId]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setUser({ ...user, avatar: URL.createObjectURL(file) });
    }
  };

  const handleSave = async () => {
    let avatarUrl = user.avatar;
    // Future: Upload avatarFile to server/cloud and get URL
const API_URL = import.meta.env.VITE_API_URL;

    try {
      const res = await axios.put(`${API_URL}/api/profile/${userId}`, {
        name: user.name,
        avatar: avatarUrl,
      });
      setUser(res.data);
      alert("Profile saved!");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>

      <div className="flex flex-col items-center mb-4">
        <img
          src={user.avatar || "https://via.placeholder.com/100"}
          alt="Avatar"
          className="w-24 h-24 rounded-full mb-2 object-cover"
        />
        <input type="file" accept="image/*" onChange={handleAvatarChange} />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={user.name}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={user.email}
          readOnly
          className="w-full p-2 border rounded bg-gray-100"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Save Profile
      </button>
    </div>
  );
};

export default Profile;
