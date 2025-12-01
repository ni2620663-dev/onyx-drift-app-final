// 
// 1. IMPORTS & SETUP
// 

// require() এর বদলে import ব্যবহার করা হলো
import express from "express";
import cors from "cors";
// যদি mongoose ব্যবহার করেন, তাহলে এটিও import করতে হবে
// import mongoose from "mongoose"; 

const app = express();

// Middleware
app.use(cors());         // Frontend থেকে রিকোয়েস্ট allow
app.use(express.json()); // JSON body পার্স করা


// 2. DATABASE CONNECTION (Optional for now)

/*
// যদি mongoose ব্যবহার করেন, তাহলে .env থেকে process.env.MONGO_URI ব্যবহার করতে হলে
// আপনাকে dotenv সেট আপ করতে হবে।
// import dotenv from 'dotenv';
// dotenv.config();

// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log("✅ MongoDB Connected"))
// .catch((err) => console.error("❌ MongoDB Error:", err));
*/


// ---------------------------------------------
// 3. BASIC HEALTH CHECK ROUTE
// ---------------------------------------------
app.get("/", (req, res) => {
  res.send("🔥 Server is running successfully!");
});


// ---------------------------------------------
// 4. LOGIN ROUTE (Dummy Authentication Logic)
// ---------------------------------------------
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Dummy user (later database দিয়ে হবে)
  const validEmail = "test@example.com";
  const validPassword = "123456";

  if (email === validEmail && password === validPassword) {
    return res.json({
      success: true,
      user: {
        name: "Test User",
        email: email,
        avatar: "https://i.ibb.co/02YJnZn/avatar.png",
        token: "abc123xyz456",
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid email or password!",
  });
});


// ---------------------------------------------
// 5. USERS ROUTE
// ---------------------------------------------
app.get("/api/users", (req, res) => {
  const users = [
    { id: 1, name: "Shakib", role: "Admin" },
    { id: 2, name: "Naim", role: "User" },
  ];

  res.json(users);
});


// ---------------------------------------------
// 6. SERVER LISTENING (IMPORTANT)
// ---------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});