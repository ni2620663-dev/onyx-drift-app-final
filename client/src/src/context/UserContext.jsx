import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth0();
  const [userData, setUserData] = useState({
    name: user?.name || "",
    picture: user?.picture || "",
    username: user?.nickname || "",
    phone: "",
    bio: ""
  });
  const [loading, setLoading] = useState(true);

  // ডাটাবেস থেকে ইউজারের লেটেস্ট তথ্য আনা
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && user?.sub) {
        try {
          const res = await axios.get(`http://localhost:10000/api/user/${user.sub}`);
          if (res.data) {
            setUserData(res.data);
          }
        } catch (err) {
          console.log("New user or fetch error", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, [isAuthenticated, user]);

  // প্রোফাইল আপডেট করার গ্লোবাল ফাংশন
  const updateGlobalProfile = (newData) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };

  return (
    <UserContext.Provider value={{ userData, updateGlobalProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);