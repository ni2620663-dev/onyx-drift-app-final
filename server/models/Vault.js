const mongoose = require('mongoose');

const VaultSchema = new mongoose.Schema({
  ownerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  memories: [{
    content: String,
    mediaUrl: String, 
    emotionVector: [Number], 
    timestamp: { type: Date, default: Date.now }
  }],
  aiPersonalityModel: {
    tone: String, 
    vocabularyPreference: [String], 
    vocalIdentityUrl: String 
  }
});

module.exports = mongoose.model('Vault', VaultSchema);