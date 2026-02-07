// logic/NeuralDeathSwitch.js

export const checkNeuralPulse = (userLastSeen, gracePeriodMonths = 6) => {
  const lastSeenDate = new Date(userLastSeen);
  const currentDate = new Date();
  
  // মিলিসেকেন্ডে গ্রেস পিরিয়ড হিসাব করা (ধরি ৬ মাস)
  const gracePeriodMS = gracePeriodMonths * 30 * 24 * 60 * 60 * 1000;
  const timeDifference = currentDate - lastSeenDate;

  if (timeDifference > gracePeriodMS) {
    return {
      status: "TRIGGERED",
      message: "Neural signal lost. Initiating Legacy Protocol...",
      shouldUnlock: true
    };
  }

  const daysLeft = Math.floor((gracePeriodMS - timeDifference) / (1000 * 60 * 60 * 24));
  return {
    status: "ACTIVE",
    message: `User pulse detected. Next check in ${daysLeft} days.`,
    shouldUnlock: false
  };
};

export const initiateInheritanceTransfer = (vaultID, inheritorID) => {
  console.log(`[SYSTEM]: Unlocking Vault ${vaultID} for Inheritor ${inheritorID}`);
  // এখানে ইমেইল বা নোটিফিকেশন পাঠানোর লজিক থাকবে
};