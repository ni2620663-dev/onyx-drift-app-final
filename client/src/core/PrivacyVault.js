// src/core/PrivacyVault.js
import CryptoJS from 'crypto-js';

export const encryptNeuralData = (data, userKey) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), userKey).toString();
};

export const decryptNeuralData = (cipherText, userKey) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, userKey);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};