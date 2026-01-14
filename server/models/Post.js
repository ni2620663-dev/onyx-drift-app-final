import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    // Auth0 'sub' আইডি স্টোর করবে (Required for Data Integrity)
    author: { type: String, required: true, index: true }, 
    
    // ডুপ্লিকেট হিসেবে থাকলেও এটি ফ্রন্টএন্ড কুয়েরির জন্য নিরাপদ
    authorAuth0Id: { type: String, required: true, index: true }, 

    authorName: { type: String, default: "Drifter" },
    authorAvatar: { type: String, default: "" },
    text: { type: String, trim: true },
    
    // Cloudinary বা Neural Storage URL
    media: { type: String }, 
    
    mediaType: { 
      type: String, 
      enum: ['image', 'video', 'text', 'none'], // 🔥 'reel' বাদ দেওয়া হয়েছে কারণ এটি 'video' এর অংশ
      default: 'none' 
    },
    
    // সোশ্যাল ইন্টারঅ্যাকশন
    likes: [{ type: String }], // Auth0 IDs
    
    comments: [{
      author: { type: String },
      authorName: { type: String },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }],
    
    // ভাইরাল এনালিটিক্স
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// কম্পাউন্ড ইন্ডেক্সিং: ইউজারের লেটেস্ট পোস্ট দ্রুত লোড করার জন্য
postSchema.index({ authorAuth0Id: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;