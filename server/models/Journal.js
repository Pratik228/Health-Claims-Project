const mongoose = require("mongoose");

const journalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  trustedSource: { type: Boolean, default: true },
  domain: String,
  categories: [String],
  impactFactor: Number,
  lastVerificationDate: Date,
});

module.exports = mongoose.model("Journal", journalSchema);
