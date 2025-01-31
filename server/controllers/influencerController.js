const axios = require("axios");
const Influencer = require("../models/Influencer");
const Claim = require("../models/Claim");
const perplexity = axios.create({
  baseURL: "https://api.perplexity.ai",
  headers: {
    Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
  },
});

async function fetchInfluencerInfo(name) {
  try {
    const prompt = `Find social media information for health influencer ${name}. 
      Return only a JSON object in this exact format:
      {
        "followerCount": (total followers across platforms as number),
        "socialHandles": [
          {"platform": "twitter/instagram/etc", "handle": "actual handle without @"}
        ],
        "expertise": "their main area of health expertise"
      }`;

    const response = await perplexity.post("/chat/completions", {
      model: "sonar-pro",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
    });

    const content = response.data.choices[0].message.content;
    console.log("Raw influencer info:", content);

    const parsedInfo = JSON.parse(content);

    const normalizeFollowerCount = (count) => {
      if (!count || isNaN(count)) {
        return 100000;
      }

      if (count > 500_000_000) {
        return 500_000_000;
      }

      if (count < 1000) {
        return 1000;
      }

      return Math.round(count);
    };

    parsedInfo.followerCount = normalizeFollowerCount(parsedInfo.followerCount);

    console.log("Normalized influencer info:", parsedInfo);
    return parsedInfo;
  } catch (error) {
    console.error("Error fetching influencer info:", error);

    return {
      followerCount: 100000,
      socialHandles: [
        { platform: "twitter", handle: name.toLowerCase().replace(/\s+/g, "") },
      ],
      expertise: "Health and Wellness",
    };
  }
}

exports.getInfluencers = async (req, res) => {
  try {
    const {
      minTrustScore,
      sortBy = "trustScore",
      sortOrder = "desc",
    } = req.query;

    let query = {};
    if (minTrustScore) {
      query.trustScore = { $gte: parseFloat(minTrustScore) };
    }

    const influencers = await Influencer.find(query).sort({
      [sortBy]: sortOrder === "desc" ? -1 : 1,
    });

    const enhancedInfluencers = await Promise.all(
      influencers.map(async (influencer) => {
        const claimStats = await Claim.aggregate([
          { $match: { influencerId: influencer._id } },
          {
            $group: {
              _id: null,
              totalClaims: { $sum: 1 },
              verifiedClaims: {
                $sum: {
                  $cond: [{ $eq: ["$verificationStatus", "verified"] }, 1, 0],
                },
              },
            },
          },
        ]);

        return {
          ...influencer.toObject(),
          claimStats: claimStats[0] || { totalClaims: 0, verifiedClaims: 0 },
        };
      })
    );

    res.json(enhancedInfluencers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInfluencer = async (req, res) => {
  try {
    const influencer = await Influencer.findById(req.params.id);
    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }

    const claims = await Claim.find({ influencerId: influencer._id }).sort({
      dateIdentified: -1,
    });

    res.json({
      ...influencer.toObject(),
      claims,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createInfluencer = async (req, res) => {
  try {
    const { name } = req.body;

    let existingInfluencer = await Influencer.findOne({
      name: { $regex: new RegExp(name, "i") },
    });

    if (existingInfluencer) {
      return res.status(400).json({
        message: "Influencer already exists",
        influencer: existingInfluencer,
      });
    }

    const info = await fetchInfluencerInfo(name);

    const influencer = new Influencer({
      name,
      followerCount: info.followerCount,
      socialHandles: info.socialHandles,
      expertise: info.expertise,
      trustScore: 0,
      totalClaimsAnalyzed: 0,
    });

    const savedInfluencer = await influencer.save();
    res.status(201).json(savedInfluencer);
  } catch (error) {
    console.error("Error creating influencer:", error);
    res.status(500).json({
      message: error.message,
      details: "Error auto-fetching influencer information",
    });
  }
};

exports.updateInfluencer = async (req, res) => {
  try {
    const influencer = await Influencer.findById(req.params.id);
    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }

    if (req.query.refresh === "true") {
      const info = await fetchInfluencerInfo(influencer.name);
      influencer.followerCount = info.followerCount;
      influencer.socialHandles = info.socialHandles;
      influencer.expertise = info.expertise;
    } else {
      const allowedUpdates = ["name", "followerCount", "socialHandles"];
      Object.keys(req.body).forEach((update) => {
        if (allowedUpdates.includes(update)) {
          influencer[update] = req.body[update];
        }
      });
    }

    const updatedInfluencer = await influencer.save();
    res.json(updatedInfluencer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getInfluencerStats = async (req, res) => {
  try {
    const [influencers, claims] = await Promise.all([
      Influencer.find(),
      Claim.find(),
    ]);

    const claimStats = await Claim.aggregate([
      {
        $group: {
          _id: null,
          totalClaims: { $sum: 1 },
          verifiedClaims: {
            $sum: {
              $cond: [{ $eq: ["$verificationStatus", "verified"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const stats = {
      totalInfluencers: influencers.length,
      totalClaims: claims.length,
      verifiedClaims: claimStats[0]?.verifiedClaims || 0,
      averageTrustScore:
        (influencers.reduce((sum, inf) => sum + (inf.trustScore || 0), 0) /
          (influencers.length || 1)) *
        100,
      trustScoreTrend: 0,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTrustScoreTrend = async (req, res) => {
  try {
    const claims = await Claim.find()
      .sort({ dateIdentified: 1 })
      .populate("influencerId");

    const dailyScores = {};
    claims.forEach((claim) => {
      const date = new Date(claim.dateIdentified).toISOString().split("T")[0];
      if (!dailyScores[date]) {
        dailyScores[date] = { total: 0, count: 0 };
      }
      dailyScores[date].total += claim.confidenceScore;
      dailyScores[date].count += 1;
    });

    // Convert to arrays for chart
    const sortedDates = Object.keys(dailyScores).sort();
    const data = {
      labels: sortedDates.map((date) => new Date(date).toLocaleDateString()),
      scores: sortedDates.map(
        (date) => (dailyScores[date].total / dailyScores[date].count) * 100
      ),
    };

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchInfluencer = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: "Name parameter is required" });
    }

    const influencer = await Influencer.findOne({
      name: { $regex: new RegExp(name, "i") },
    });

    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }

    res.json(influencer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.discoverInfluencers = async (req, res) => {
  const { query } = req.body;

  try {
    const prompt = `You MUST respond with ONLY a valid JSON object and NO other text.
      Find top health influencers matching these criteria: "${query}".
      The response must be in this EXACT format:
      {
        "influencers": [
          {
            "name": "full name of the influencer",
            "expertise": "their main area of health expertise",
            "followerCount": 100000,
            "credentials": "their medical/health credentials",
            "description": "brief description of their work and impact"
          }
        ]
      }`;

    const response = await perplexity.post("/chat/completions", {
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content:
            "You are a JSON-only response bot. Only return valid JSON objects, no other text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2000,
    });

    const content = response.data.choices[0].message.content.trim();
    console.log("Raw response:", content);

    // Try to find JSON in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const jsonStr = jsonMatch[0];
    const discoveredInfluencers = JSON.parse(jsonStr);

    if (
      !discoveredInfluencers.influencers ||
      !Array.isArray(discoveredInfluencers.influencers)
    ) {
      throw new Error("Invalid response format");
    }

    // Process discovered influencers
    const processedInfluencers = await Promise.all(
      discoveredInfluencers.influencers.map(async (influencer) => {
        try {
          // Validate required fields
          if (!influencer.name || !influencer.expertise) {
            console.error("Invalid influencer data:", influencer);
            return null;
          }

          let existingInfluencer = await Influencer.findOne({
            name: { $regex: new RegExp(influencer.name, "i") },
          });

          if (!existingInfluencer) {
            existingInfluencer = await new Influencer({
              name: influencer.name,
              followerCount: influencer.followerCount || 100000,
              expertise: influencer.expertise,
              trustScore: 0,
              totalClaimsAnalyzed: 0,
            }).save();
          }

          return {
            ...influencer,
            _id: existingInfluencer._id,
            trustScore: existingInfluencer.trustScore,
            totalClaimsAnalyzed: existingInfluencer.totalClaimsAnalyzed,
          };
        } catch (error) {
          console.error(
            `Error processing influencer ${influencer.name}:`,
            error
          );
          return null;
        }
      })
    );

    const validInfluencers = processedInfluencers.filter(Boolean);

    if (validInfluencers.length === 0) {
      return res.status(404).json({
        message: "No valid influencers found matching your criteria",
      });
    }

    res.json({
      results: validInfluencers,
    });
  } catch (error) {
    console.error("Discovery Error:", error);
    res.status(500).json({
      error: "Error discovering influencers",
      details: error.message,
    });
  }
};
