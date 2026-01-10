import User from "../models/User.js";
import Post from "../models/Post.js"; // পোস্ট লোড করার জন্য অবশ্যই প্রয়োজন

/* ==========================================================
    ১. প্রোফাইল আপডেট (Auth0 ID সাপোর্ট সহ)
========================================================== */
export const updateUserProfile = async (req, res) => {
  try {
    const { name, avatar, bio, nickname } = req.body;
    const auth0Id = req.user.sub || req.user.id; // মিডলওয়্যার থেকে প্রাপ্ত আইডি

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: auth0Id }, // ID এর বদলে Auth0 ID দিয়ে খোঁজা নিরাপদ
      { name, avatar, bio, nickname },
      { new: true, upsert: true } // না থাকলে তৈরি করবে
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

/* ==========================================================
    ২. ইউজারের ডাটা এবং পোস্ট পাওয়া (Neural Discovery Fix)
========================================================== */
export const getUserData = async (req, res) => {
  try {
    // ফ্রন্টএন্ড থেকে আসা targetId (google-oauth2|...)
    const targetId = decodeURIComponent(req.params.id);

    // ১. ইউজার প্রোফাইল খোঁজা
    const user = await User.findOne({ auth0Id: targetId }).lean();
    
    // ২. ওই ইউজারের সব পোস্ট খোঁজা (এটি প্রোফাইল পেজের জন্য জরুরি)
    const posts = await Post.find({
      $or: [
        { authorAuth0Id: targetId },
        { authorId: targetId },
        { author: targetId }
      ]
    }).sort({ createdAt: -1 }).lean();

    if (!user && posts.length === 0) {
      return res.status(404).json({ message: "No drifter signal detected in this sector" });
    }

    // প্রোফাইল এবং পোস্ট একসাথে পাঠানো হচ্ছে
    res.status(200).json({
      user: user || { auth0Id: targetId, name: "Unknown Drifter" },
      posts: posts
    });

  } catch (error) {
    console.error("Neural Fetch Error:", error);
    res.status(500).json({ message: "Signal synchronization failed" });
  }
};

/* ==========================================================
    ৩. সোশ্যাল লজিক (Placeholder)
========================================================== */
export const sendRequest = async (req, res) => {
  try {
    res.status(200).json({ message: "Neural handshake initiated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    res.status(200).json({ message: "Neural link established" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};