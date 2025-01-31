const express = require("express");
const Journal = require("../models/Journal");
const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const { trustedOnly, category } = req.query;

    let query = {};
    if (trustedOnly === "true") {
      query.trustedSource = true;
    }
    if (category) {
      query.categories = category;
    }

    const journals = await Journal.find(query).sort({ impactFactor: -1 });
    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) {
      return res.status(404).json({ message: "Journal not found" });
    }
    res.json(journal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new journal
router.post("/", async (req, res) => {
  try {
    const { name, domain, categories, impactFactor } = req.body;

    const journal = new Journal({
      name,
      domain,
      categories: categories || [],
      impactFactor: impactFactor || 0,
      trustedSource: true,
      lastVerificationDate: new Date(),
    });

    const savedJournal = await journal.save();
    res.status(201).json(savedJournal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) {
      return res.status(404).json({ message: "Journal not found" });
    }

    const allowedUpdates = [
      "name",
      "trustedSource",
      "domain",
      "categories",
      "impactFactor",
    ];

    Object.keys(req.body).forEach((update) => {
      if (allowedUpdates.includes(update)) {
        journal[update] = req.body[update];
      }
    });

    journal.lastVerificationDate = new Date();
    const updatedJournal = await journal.save();
    res.json(updatedJournal);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
