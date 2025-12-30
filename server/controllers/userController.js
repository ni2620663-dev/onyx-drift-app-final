import User from "../models/User.js"; // অবশ্যই .js যোগ করবেন

// ১. প্রোফাইল আপডেট কন্ট্রোলার
export const updateUserProfile = async (req, res) => {
  try {
    const { userId, name, avatar } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, avatar },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};

// ২. ফ্রেন্ড রিকোয়েস্ট পাঠানো
export const sendRequest = async (req, res) => {
  try {
    // আপনার রিকোয়েস্ট লজিক এখানে
    res.status(200).json({ message: "Request sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ৩. রিকোয়েস্ট একসেপ্ট করা
export const acceptRequest = async (req, res) => {
  try {
    // আপনার একসেপ্ট লজিক এখানে
    res.status(200).json({ message: "Request accepted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ৪. ইউজারের ডাটা পাওয়া
export const getUserData = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};