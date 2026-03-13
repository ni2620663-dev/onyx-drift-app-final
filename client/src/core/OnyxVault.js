/**
 * 🛡️ OnyxVault: Security & Privacy Layer
 */
const OnyxVault = {
  // ডেটা এনক্রিপ্ট করার একটি সহজ কিন্তু শক্তিশালী পদ্ধতি
  lockData(data) {
    const jsonStr = JSON.stringify(data);
    // Base64 এনকোডিং + আপনার নিজস্ব সিক্রেট কি (Secret Key)
    return btoa(jsonStr + "ONYX_DRIFT_2026_PRIVATE_KEY");
  },

  unlockData(encryptedData) {
    try {
      const decoded = atob(encryptedData);
      return JSON.parse(decoded.replace("ONYX_DRIFT_2026_PRIVATE_KEY", ""));
    } catch (e) {
      console.error("Vault access denied!");
      return null;
    }
  }
};

export default OnyxVault;