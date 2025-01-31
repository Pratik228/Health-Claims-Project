const express = require("express");
const router = express.Router();
let currentConfig = {
  dateRange: "30d",
  apiKeys: {},
  journalPreferences: [],
  maxClaimsPerAnalysis: 100,
};

router.get("/", (req, res) => {
  const safeConfig = { ...currentConfig };
  delete safeConfig.apiKeys;
  res.json(safeConfig);
});

router.post("/", (req, res) => {
  const { dateRange, apiKeys, journalPreferences, maxClaimsPerAnalysis } =
    req.body;

  if (dateRange && !/^\d+[dhm]$/.test(dateRange)) {
    return res.status(400).json({ message: "Invalid date range format" });
  }

  if (
    maxClaimsPerAnalysis &&
    (typeof maxClaimsPerAnalysis !== "number" ||
      maxClaimsPerAnalysis < 1 ||
      maxClaimsPerAnalysis > 1000)
  ) {
    return res.status(400).json({
      message: "maxClaimsPerAnalysis must be between 1 and 1000",
    });
  }

  currentConfig = {
    ...currentConfig,
    ...req.body,
  };

  res.json({
    message: "Configuration updated",
    config: { ...currentConfig, apiKeys: undefined },
  });
});

router.post("/validate-keys", async (req, res) => {
  const { openaiKey, perplexityKey } = req.body;

  try {
    const openaiValid = await testOpenAIKey(openaiKey);

    const perplexityValid = await testPerplexityKey(perplexityKey);

    res.json({
      openai: openaiValid,
      perplexity: perplexityValid,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
