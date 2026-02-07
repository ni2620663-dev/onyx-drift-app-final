// utils/pulseChecker.js
const User = require('../models/User');

const checkAllPulses = async () => {
  const users = await User.find({ 
    "deathSwitch.isActive": true, 
    "deathSwitch.isTriggered": false 
  });
  
  const now = new Date();

  for (const user of users) {
    const timeDiff = now - new Date(user.deathSwitch.lastPulseTimestamp);
    const monthsDiff = timeDiff / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsDiff >= user.deathSwitch.inactivityThresholdMonths) {
      user.deathSwitch.isTriggered = true;
      user.legacy.vaultStatus = 'OPEN';
      await user.save();
      
      console.log(`[SYSTEM ALERT]: Neural Signal lost for ${user.username}. Vault Released.`);
      // এখানে Inheritor-কে ইমেইল পাঠানোর কোড যোগ হবে
    }
  }
};

module.exports = checkAllPulses;