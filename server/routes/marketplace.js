router.post("/share-template", auth, async (req, res) => {
  const { title, projectData, thumbnail } = req.body;
  try {
    const newTemplate = new Template({
      title,
      projectData,
      thumbnail,
      authorName: req.user.name,
      usageCount: 0
    });
    await newTemplate.save();
    res.json({ success: true, message: "Template shared successfully!" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to share template" });
  }
});

// টেমপ্লেটের লিস্ট পাওয়ার API
router.get("/templates", async (req, res) => {
  const templates = await Template.find().sort({ createdAt: -1 });
  res.json(templates);
});