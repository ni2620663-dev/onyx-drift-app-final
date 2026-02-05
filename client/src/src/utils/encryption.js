import crypto from "crypto";

const algorithm = "aes-256-cbc";
const secretKey = process.env.ENCRYPTION_KEY; // ৩০২ ক্যারেক্টারের সিক্রেট কী (.env তে রাখো)
const iv = crypto.randomBytes(16);

// এনক্রিপশন (মেসেজ সেভ করার আগে)
export const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

// ডিক্রিপশন (মেসেজ দেখানোর আগে)
export const decrypt = (hash) => {
  const [ivPart, encryptedPart] = hash.split(":");
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(ivPart, "hex"));
  let decrypted = decipher.update(Buffer.from(encryptedPart, "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};