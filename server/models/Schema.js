// Define the Database Schema for OnyxDrift
// We need optimized structures for speed and encryption-readiness.

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  publicKey: { type: String, required: true }, // For E2E Encryption
  neuralPreferences: {
    gestureSensitivity: { type: Number, default: 0.5 },
    voiceProfile: { type: String } // Path to local voice print
  }
});

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  conversationId: { type: String, index: true },
  content: { type: String }, // Encrypted string
  mediaType: { type: String, enum: ['text', 'voice', 'video'], default: 'text' },
  timestamp: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  scheduledTime: Date
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  Message: mongoose.model('Message', MessageSchema),
  Task: mongoose.model('Task', TaskSchema)
};