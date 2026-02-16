const TemplateSchema = new mongoose.Schema({
  title: String,
  description: String,
  thumbnail: String, // টেমপ্লেট প্রিভিউ ভিডিও
  authorName: String, // ক্রিয়েটরের নাম
  projectData: Object, // ফিল্টার, ট্রানজিশন, লেয়ারের JSON ডাটা
  tags: [String],
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});