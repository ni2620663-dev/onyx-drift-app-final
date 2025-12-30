import express from "express";
const router = express.Router();

// এটি আপনার /api/friends রাউট হ্যান্ডেল করবে
router.get("/", (req, res) => {
  const dummyFriends = [
    { _id: "1", name: "Sakib Al Hasan", workplace: "Cricketer", picture: "https://i.pravatar.cc/150?u=sakib" },
    { _id: "2", name: "Tamim Iqbal", workplace: "Batsman", picture: "https://i.pravatar.cc/150?u=tamim" },
    { _id: "3", name: "Mushfiqur Rahim", workplace: "Keeper", picture: "https://i.pravatar.cc/150?u=mushi" },
  ];
  res.json(dummyFriends);
});

export default router;