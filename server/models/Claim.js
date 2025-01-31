const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: String, required: true },
  verificationStatus: {
    type: String,
    enum: ["verified", "debunked", "pending", "processing"],
    default: "pending",
  },
  confidenceScore: { type: Number, default: 0 },
  linkedJournals: [
    {
      journalId: { type: mongoose.Schema.Types.ObjectId, ref: "Journal" },
      relevanceScore: Number,
      excerpt: String,
    },
  ],
  influencerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Influencer",
    required: true,
  },
  sourceContent: { type: String }, // Original content where claim was found
  aiProcessingMetadata: {
    extractionConfidence: Number,
    semanticDuplicateScore: Number,
    lastProcessed: Date,
  },
  dateIdentified: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Claim", claimSchema);
