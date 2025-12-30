import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // আপনার .env ফাইলে নাম MONGODB_URI, তাই এখানেও তাই হবে
    const conn = await mongoose.connect(process.env.MONGODB_URI); 
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;