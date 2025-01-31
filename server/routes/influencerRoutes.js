const express = require("express");
const router = express.Router();
const {
  getInfluencers,
  getInfluencer,
  createInfluencer,
  updateInfluencer,
  getInfluencerStats,
  getTrustScoreTrend,
  searchInfluencer,
  discoverInfluencers,
} = require("../controllers/influencerController");

router.get("/search", searchInfluencer);

router.post("/discover", discoverInfluencers);

router.get("/stats", getInfluencerStats);

router.get("/trust-score-trend", getTrustScoreTrend);

router.get("/", getInfluencers);

router.get("/:id", getInfluencer);

router.post("/", createInfluencer);

router.patch("/:id", updateInfluencer);

module.exports = router;
