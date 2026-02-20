// src/utils/Crypto.js
import CryptoJS from "crypto-js";

const SECRET_KEY = "onyx_drift_super_secret_key"; // এটা পরে .env ফাইলে রাখবেন

export const secureData = (data) => {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const revealData = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};