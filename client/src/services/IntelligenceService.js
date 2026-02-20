// src/services/IntelligenceService.js
export const analyzeUserMood = (text) => {
  const keywords = {
    sad: ['bad', 'alone', 'crying', 'depressed', 'sad'],
    creative: ['idea', 'build', 'create', 'design', 'new'],
    excited: ['wow', 'happy', 'great', 'awesome', 'finally']
  };
  
  // খুব সাধারণ একটি মুড ডিটেক্টর
  for (let mood in keywords) {
    if (keywords[mood].some(word => text.toLowerCase().includes(word))) return mood;
  }
  return 'neutral';
};

export const saveToDigitalMemory = (userId, interaction) => {
  const memory = {
    id: Date.now(),
    timestamp: new Date(),
    data: interaction,
    mood: analyzeUserMood(interaction)
  };
  // এখানে আপনার API বা LocalStorage এ সেভ করবেন
  const existingMemory = JSON.parse(localStorage.getItem(`memory_${userId}`)) || [];
  localStorage.setItem(`memory_${userId}`, JSON.stringify([...existingMemory, memory]));
  return memory;
};