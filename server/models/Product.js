const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String }, // ইমেজ ইউআরএল
  category: { type: String },
  isAffiliate: { type: Boolean, default: false },
  affiliateLink: { type: String },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isApproved: { type: Boolean, default: false }, // অ্যাডমিন অ্যাপ্রুভালের জন্য
  createdAt: { type: Date, default: Date.now }
});
const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  amount: Number,
  commission: Number, // আপনার ইনকাম
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  paymentMethod: String, // bKash, Nagad, etc.
  transactionId: String // গেটওয়ে থেকে পাওয়া আইডি
});

module.exports = mongoose.model('Product', ProductSchema);