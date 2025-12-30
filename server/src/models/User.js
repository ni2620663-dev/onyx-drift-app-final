const userSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true },
  name: String,
  username: String,
  picture: String,
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
friendRequests: [{ type: String }], // Auth0 IDs
friends: [{ type: String }],        // Auth0 IDs
  notifications: [{
    from: String,
    type: String, // 'like', 'comment', 'friend_request'
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
});