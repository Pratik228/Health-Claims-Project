const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: String, required: true },
  verificationStatus: {
    type: String,
    enum: ["verified", "debunked", "pending", "processing", "inconclusive"],
    default: "pending",
  },
  confidenceScore: { type: Number, default: 0 },
  linkedJournals: [
    {
      journalId: { type: mongoose.Schema.Types.ObjectId },
      excerpt: String,
      title: String,
      authors: [String],
      year: String,
      url: String,
      type: {
        type: String,
        enum: ["supporting", "contradicting", "neutral", "inconclusive"],
      },
      evidenceStrength: Number,
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

claimSchema.index({ text: "text" });

module.exports = mongoose.model("Claim", claimSchema);
