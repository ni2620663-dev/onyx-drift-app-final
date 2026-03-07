import CryptoJS from 'crypto-js';

// এনক্রিপশন কি সাধারণত এনভায়রনমেন্ট থেকে আসে, সিকিউরিটির জন্য এটি গুরুত্বপূর্ণ
const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_KEY || "onyxdrift-neural-secure-key";

export const EncryptionService = {
  // মেসেজ এনক্রিপ্ট করা (পাঠানোর আগে)
  encrypt: (text) => {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  },
  
  // মেসেজ ডিক্রিপ্ট করা (পাওয়ার পরে)
  decrypt: (ciphertext) => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      return "Error: Could not decrypt neural signal";
    }
  }
};