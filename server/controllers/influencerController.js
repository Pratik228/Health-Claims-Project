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
    console.log(`Fetching info for influencer: ${name}`);
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
          content: `Return ONLY a valid JSON object (no other text) for health influencer "${name}" in this exact format:
              {
                "followerCount": 123456,
                "socialHandles": [
                  {"platform": "twitter", "handle": "handlename"}
                ],
                "expertise": ["List of specific areas of expertise"],
                "credentials": "Medical/health credentials if any",
                "mainFocus": "Primary area of focus"
              }`,
        },
      ],
      max_tokens: 1000,
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      console.error("Invalid API response structure:", response.data);
      throw new Error("Invalid API response structure");
    }

    const content = response.data.choices[0].message.content.trim();
    console.log("Raw API response:", content);

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON Parse error:", parseError);
      throw new Error("Failed to parse influencer information");
    }

    // Set defaults for optional fields
    return {
      followerCount: result.followerCount || 100000,
      socialHandles: result.socialHandles || [],
      expertise: Array.isArray(result.expertise)
        ? result.expertise
        : [result.expertise || "Health & Wellness"],
      credentials: result.credentials || "",
      mainFocus: result.mainFocus || "Health & Wellness",
    };
  } catch (error) {
    console.error("Error in fetchInfluencerInfo:", error);
    // Return default values instead of throwing
    return {
      followerCount: 100000,
      socialHandles: [],
      expertise: ["Health & Wellness"],
      credentials: "",
      mainFocus: "Health & Wellness",
    };
  }
}

exports.createInfluencer = async (req, res) => {
  try {
    console.log("Create influencer request:", req.body);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Check for existing influencer
    const existingInfluencer = await Influencer.findOne({
      name: { $regex: new RegExp(name, "i") },
    });

    if (existingInfluencer) {
      return res.json(existingInfluencer); // Return existing instead of error
    }

    // Fetch info with fallback to defaults
    const info = await fetchInfluencerInfo(name);
    console.log("Fetched influencer info:", info);

    const influencer = new Influencer({
      name,
      followerCount: info.followerCount,
      socialHandles: info.socialHandles,
      expertise: info.expertise,
      credentials: info.credentials,
      mainFocus: info.mainFocus,
      trustScore: 0,
      totalClaimsAnalyzed: 0,
    });

    const savedInfluencer = await influencer.save();
    console.log("Successfully created influencer:", savedInfluencer);
    res.status(201).json(savedInfluencer);
  } catch (error) {
    console.error("Error in createInfluencer:", error);
    res.status(500).json({
      message: "Error creating influencer",
      error: error.message,
    });
  }
};

exports.getInfluencers = async (req, res) => {
  try {
    const influencers = await Influencer.find();

    const enhancedInfluencers = await Promise.all(
      influencers.map(async (influencer) => {
        const claims = await Claim.find({ influencerId: influencer._id });

        // Calculate claims by category
        const categoryCount = claims.reduce((acc, claim) => {
          if (claim.category) {
            acc[claim.category] = (acc[claim.category] || 0) + 1;
          }
          return acc;
        }, {});

        const claimStats = {
          totalClaims: claims.length,
          verifiedClaims: claims.filter(
            (c) => c.verificationStatus === "verified"
          ).length,
        };

        // Update influencer
        influencer.claimsByCategory = categoryCount;
        await influencer.save();

        return {
          ...influencer.toObject(),
          claimStats,
          claimsByCategory: categoryCount,
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

    // Calculate claims by category
    const categoryCount = claims.reduce((acc, claim) => {
      if (claim.category) {
        acc[claim.category] = (acc[claim.category] || 0) + 1;
      }
      return acc;
    }, {});

    // Update influencer with latest category stats
    influencer.claimsByCategory = categoryCount;
    await influencer.save();

    res.json({
      ...influencer.toObject(),
      claims,
      claimsByCategory: categoryCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateInfluencer = async (req, res) => {
  try {
    const influencer = await Influencer.findById(req.params.id);
    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }

    if (req.query.refresh === "true") {
      try {
        const info = await fetchInfluencerInfo(influencer.name);
        influencer.followerCount = info.followerCount;
        influencer.socialHandles = info.socialHandles;
        influencer.expertise = info.expertise;
      } catch (error) {
        return res.status(400).json({
          message: "Could not refresh influencer data",
          error: error.message,
        });
      }
    } else {
      // Only allow specific field updates
      const allowedUpdates = ["name", "socialHandles"];
      const updates = Object.keys(req.body).filter((key) =>
        allowedUpdates.includes(key)
      );

      if (updates.length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      updates.forEach((update) => {
        influencer[update] = req.body[update];
      });
    }

    const updatedInfluencer = await influencer.save();
    res.json(updatedInfluencer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInfluencerStats = async (req, res) => {
  try {
    const stats = await Claim.aggregate([
      {
        $group: {
          _id: null,
          totalClaims: { $sum: 1 },
          verifiedClaims: {
            $sum: {
              $cond: [{ $eq: ["$verificationStatus", "verified"] }, 1, 0],
            },
          },
          averageConfidence: { $avg: "$confidenceScore" },
        },
      },
    ]);

    const influencerStats = await Influencer.aggregate([
      {
        $group: {
          _id: null,
          totalInfluencers: { $sum: 1 },
          averageTrustScore: { $avg: "$trustScore" },
        },
      },
    ]);

    if (!stats.length || !influencerStats.length) {
      return res.status(404).json({ message: "No statistics available yet" });
    }

    res.json({
      totalInfluencers: influencerStats[0].totalInfluencers,
      totalClaims: stats[0].totalClaims,
      verifiedClaims: stats[0].verifiedClaims,
      averageTrustScore: influencerStats[0].averageTrustScore * 100,
      averageConfidence: stats[0].averageConfidence * 100,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTrustScoreTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await Claim.aggregate([
      {
        $match: {
          dateIdentified: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$dateIdentified" },
          },
          averageScore: { $avg: "$confidenceScore" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    if (!trends.length) {
      return res.status(404).json({ message: "No trend data available" });
    }

    res.json({
      labels: trends.map((t) => t._id),
      scores: trends.map((t) => t.averageScore * 100),
      counts: trends.map((t) => t.count),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchInfluencer = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        message: "Please provide a valid search term (minimum 2 characters)",
      });
    }

    const influencer = await Influencer.findOne({
      name: { $regex: new RegExp(name.trim(), "i") },
    });

    if (!influencer) {
      return res
        .status(404)
        .json({ message: "No influencer found matching this search term" });
    }

    res.json(influencer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.discoverInfluencers = async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string" || query.trim().length < 3) {
    return res.status(400).json({
      message: "Please provide a valid search query (minimum 3 characters)",
    });
  }

  try {
    const prompt = `Find verified health influencers matching: "${query}".
    Return a JSON array of ONLY real, currently active health influencers with their accurate details.
    Format:
    {
    "influencers": [
        {
        "name": "verified full name (must be real, active health professional)",
        "expertise": ["specific areas of medical/health expertise"],
        "credentials": "verified medical/health credentials (degrees, certifications)",
        "description": "brief verified work description and contributions",
        "platforms": [
            {
            "name": "platform name",
            "handle": "verified handle",
            "followerCount": approximate follower count
            }
        ],
        "specialties": ["specific health topics they're known for"]
        }
    ]
    }
    Only include verified, established health professionals with clear credentials.`;

    const response = await perplexity.post("/chat/completions", {
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });

    const discoveredInfluencers = JSON.parse(
      response.data.choices[0].message.content
    );

    if (!discoveredInfluencers.influencers?.length) {
      return res.status(404).json({
        message: "No verified influencers found matching your criteria",
      });
    }

    // Process each discovered influencer
    const processedInfluencers = await Promise.all(
      discoveredInfluencers.influencers.map(async (influencer) => {
        try {
          if (!influencer.name || !influencer.expertise) return null;

          // Get verified info for each discovered influencer
          const verifiedInfo = await fetchInfluencerInfo(influencer.name);

          let existingInfluencer = await Influencer.findOne({
            name: { $regex: new RegExp(influencer.name, "i") },
          });

          if (!existingInfluencer) {
            existingInfluencer = await new Influencer({
              name: influencer.name,
              followerCount: verifiedInfo.followerCount,
              socialHandles: verifiedInfo.socialHandles,
              expertise: verifiedInfo.expertise,
              trustScore: 0,
              totalClaimsAnalyzed: 0,
            }).save();
          }

          return {
            ...influencer,
            ...verifiedInfo,
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
    if (!validInfluencers.length) {
      return res.status(404).json({
        message: "Could not verify any influencers matching your criteria",
      });
    }

    res.json({ results: validInfluencers });
  } catch (error) {
    res.status(500).json({
      message: "Error discovering influencers",
      error: error.message,
    });
  }
};
