const express = require("express");
const router = express.Router();
const Claim = require("../models/Claim");
const {
  processInfluencerContent,
  verifyClaimHandler,
} = require("../controllers/claimController");

router.get("/", async (req, res) => {
  try {
    const { influencerId, category, verificationStatus, minConfidence } =
      req.query;

    let query = {};
    if (influencerId) query.influencerId = influencerId;
    if (category) query.category = category;
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (minConfidence)
      query.confidenceScore = { $gte: parseFloat(minConfidence) };

    const claims = await Claim.find(query)
      .populate("influencerId")
      .populate("linkedJournals.journalId")
      .sort({ dateIdentified: -1 });

    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/analyze", processInfluencerContent);

router.post("/:claimId/verify", verifyClaimHandler);

module.exports = router;
