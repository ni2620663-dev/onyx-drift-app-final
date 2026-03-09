import CryptoJS from 'crypto-js';

const PrivacyVault = {
  // ১. নিউরাল ডেটা এনক্রিপ্ট করার ফাংশন
  encryptNeuralData: (data, userKey) => {
    try {
      return CryptoJS.AES.encrypt(JSON.stringify(data), userKey).toString();
    } catch (error) {
      console.error("Encryption Error:", error);
      return null;
    }
  },

  // ২. নিউরাল ডেটা ডিক্রিপ্ট করার ফাংশন
  decryptNeuralData: (cipherText, userKey) => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, userKey);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error("Decryption Error:", error);
      return null;
    }
  },

  // ৩. সিস্টেম ইনিশিয়ালাইজেশন (App.jsx এর জন্য)
  initializeVault: async () => {
    console.log("🛡️ Onyx Privacy Vault: Initialized and Secured.");
    return true;
  }
};

// Default Export নিশ্চিত করা হলো
export default PrivacyVault;

// যদি কেউ আলাদা করে ফাংশন ইম্পোর্ট করতে চায় তার জন্য Named Export
export const { encryptNeuralData, decryptNeuralData } = PrivacyVault;