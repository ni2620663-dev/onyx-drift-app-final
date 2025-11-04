import express from "express";
import cors from "cors";

const app = express();

// CORS middleware
app.use(cors());

// JSON middleware (important for POST requests)
app.use(express.json());

// Example login route
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Dummy check
  if (email === "test@example.com" && password === "123456") {
    res.json({ success: true, message: "Login successful" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// Render-এর পরিবেশ থেকে PORT ব্যবহার করুন, না পেলে 5000 ব্যবহার করুন।
const PORT = process.env.PORT || 5000; 

// Server listen
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));