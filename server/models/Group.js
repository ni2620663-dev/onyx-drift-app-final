import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creator: { type: String, required: true }, // Auth0 ID
  members: [{ type: String }],
  avatar: { type: String, default: "" },
  lastMessage: { type: Object, default: null }
}, { timestamps: true });

export default mongoose.model('Group', GroupSchema);