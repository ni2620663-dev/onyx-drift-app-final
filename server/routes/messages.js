import express from "express";
const router = express.Router();

// আপাতত খালি রাউট যাতে ফ্রন্টএন্ড এরর না দেয়
router.get("/conversation/:id", (req, res) => {
    res.json([]); 
});

export default router;