const mongoose = require("mongoose");

const influencerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  followerCount: { type: Number, required: true },
  socialHandles: [
    {
      platform: String,
      handle: String,
    },
  ],
  expertise: [String],
  credentials: String,
  mainFocus: String,
  trustScore: { type: Number, default: 0 },
  totalClaimsAnalyzed: { type: Number, default: 0 },
  claimsByCategory: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  lastAnalyzed: { type: Date },
  activeAnalysis: { type: Boolean, default: false },
});

module.exports = mongoose.model("Influencer", influencerSchema);
