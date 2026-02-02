import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HiOutlineUserGroup, HiOutlinePlusCircle, HiArrowSmallRight } from "react-icons/hi2";

const GroupMessenger = ({ socket, API_URL, getAuthToken }) => {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");

  const fetchGroups = async () => {
    try {
      const token = await getAuthToken();
      const res = await axios.get(`${API_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(res.data);
    } catch (err) { console.error("Error fetching groups"); }
  };

  useEffect(() => { fetchGroups(); }, []);

  const createGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const token = await getAuthToken();
      await axios.post(`${API_URL}/api/groups/create`, { name: groupName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroupName("");
      setShowCreate(false);
      fetchGroups();
    } catch (err) { console.error("Group creation failed"); }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Create Group Trigger */}
      <button 
        onClick={() => setShowCreate(!showCreate)}
        className="w-full p-4 rounded-2xl border border-dashed border-cyan-500/30 bg-cyan-500/5 flex items-center justify-between text-cyan-400 group hover:bg-cyan-500/10 transition-all"
      >
        <div className="flex items-center gap-3">
          <HiOutlinePlusCircle size={24} />
          <span className="text-xs font-black uppercase tracking-widest">Construct Neural Hive</span>
        </div>
        <HiArrowSmallRight className="group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Create Form */}
      {showCreate && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <input 
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Hive Name..."
            className="w-full bg-black/40 border border-white/5 p-3 rounded-xl outline-none text-sm focus:border-cyan-500/50"
          />
          <button onClick={createGroup} className="w-full py-2 bg-cyan-600 rounded-xl text-[10px] font-black uppercase">Initialize Hive</button>
        </div>
      )}

      {/* Group List */}
      <div className="grid grid-cols-1 gap-2">
        {groups.length > 0 ? groups.map(g => (
          <div key={g._id} className="p-4 flex items-center gap-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-cyan-500/30 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-900 to-blue-900 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <HiOutlineUserGroup size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold">{g.name}</h4>
              <p className="text-[10px] text-zinc-500 font-mono uppercase">{g.members?.length || 0} Drifters Linked</p>
            </div>
          </div>
        )) : (
          <div className="py-10 text-center space-y-2 opacity-30">
            <HiOutlineUserGroup size={40} className="mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest">No Active Hives Found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupMessenger;