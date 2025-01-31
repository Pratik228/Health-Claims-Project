const OpenAI = require("openai");
const axios = require("axios");
const Claim = require("../models/Claim");
const Influencer = require("../models/Influencer");

let openaiClient = null;
let perplexityClient = null;

function initializeAPIClients(openaiKey, perplexityKey) {
  const openaiApiKey = openaiKey || process.env.OPENAI_API_KEY;
  const perplexityApiKey = perplexityKey || process.env.PERPLEXITY_API_KEY;

  if (!openaiApiKey) {
    throw new Error("OpenAI API key is missing");
  }

  if (!perplexityApiKey) {
    throw new Error("Perplexity API key is missing");
  }

  openaiClient = new OpenAI({
    apiKey: openaiApiKey,
  });

  perplexityClient = axios.create({
    baseURL: "https://api.perplexity.ai",
    headers: {
      Authorization: `Bearer ${perplexityApiKey}`,
    },
  });

  return { openaiClient, perplexityClient };
}

initializeAPIClients();

const processInfluencerContent = async (req, res) => {
  const {
    influencerId,
    name,
    timeRange = "30d",
    settings = {},
    selectedJournals = [],
    notes = "",
  } = req.body;

  try {
    if (!influencerId) {
      return res.status(400).json({
        message: "influencerId is required",
      });
    }

    const influencer = await Influencer.findById(influencerId);
    if (!influencer) {
      return res.status(404).json({
        message: "Influencer not found",
      });
    }
    influencer.activeAnalysis = true;
    await influencer.save();

    try {
      const content = await fetchInfluencerContent(name, timeRange);
      const extractedClaims = await extractClaims(content);
      const processedClaims = await Promise.allSettled(
        extractedClaims.map((claim) => processClaim(claim, influencerId))
      );

      const successfulClaims = processedClaims
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      const verifiedClaims = successfulClaims.filter(
        (claim) => claim.verificationStatus === "verified"
      );

      influencer.trustScore =
        verifiedClaims.length / Math.max(successfulClaims.length, 1);
      influencer.totalClaimsAnalyzed = successfulClaims.length;
      influencer.activeAnalysis = false;
      influencer.lastAnalyzed = new Date();

      await influencer.save();

      res.json({
        influencer,
        claims: successfulClaims,
        summary: {
          totalClaims: successfulClaims.length,
          verifiedClaims: verifiedClaims.length,
          failedClaims: processedClaims.filter(
            (result) => result.status === "rejected"
          ).length,
        },
      });
    } catch (error) {
      influencer.activeAnalysis = false;
      await influencer.save();
      throw error;
    }
  } catch (error) {
    console.error("Error processing influencer:", error);
    res.status(500).json({
      error: error.message,
      details: "Error processing influencer content. Please try again.",
    });
  }
};

async function fetchInfluencerContent(name, timeRange) {
  const prompt = `Find recent health-related content by ${name} from the past ${timeRange}. Focus on specific health claims, findings, and recommendations they've made. Include direct quotes when available.`;

  try {
    const response = await perplexityClient.post("/chat/completions", {
      model: "sonar-pro",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2000,
    });

    console.log("Perplexity Response:", JSON.stringify(response.data, null, 2));

    if (!response.data.choices?.[0]?.message?.content) {
      throw new Error("Unexpected response structure from Perplexity");
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Perplexity API Error:", error.response?.data || error);
    throw new Error(`Error fetching content: ${error.message}`);
  }
}

async function extractClaims(content) {
  try {
    console.log("Content to analyze:", content);

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert at identifying health claims. Extract specific health claims from the given content. 
          Return a JSON string containing an array of objects with this exact format:
          {
            "claims": [
              {
                "claim": "The specific health claim statement",
                "context": "The surrounding context or source"
              }
            ]
          }`,
        },
        {
          role: "user",
          content: content,
        },
      ],
      temperature: 0.7,
    });

    console.log(
      "OpenAI Response:",
      JSON.stringify(response.choices[0].message.content, null, 2)
    );

    const parsedResponse = JSON.parse(response.choices[0].message.content);

    if (!parsedResponse.claims || !Array.isArray(parsedResponse.claims)) {
      console.error("Unexpected response structure:", parsedResponse);
      throw new Error("Invalid response structure from OpenAI");
    }

    return parsedResponse.claims;
  } catch (error) {
    console.error("Error in extractClaims:", error);
    if (error.response) {
      console.error("OpenAI API Error:", error.response.data);
    }
    throw new Error(`Error extracting claims: ${error.message}`);
  }
}

async function processClaim(claimData, influencerId) {
  try {
    const existingClaim = await Claim.findOne({
      influencerId,
      text: { $regex: new RegExp(claimData.claim, "i") },
    });

    if (existingClaim) {
      return existingClaim;
    }

    const verification = await verifyClaimInternal(claimData.claim);

    const claim = new Claim({
      text: claimData.claim,
      category: verification.category,
      influencerId,
      sourceContent: claimData.context,
      verificationStatus: verification.isVerified ? "verified" : "debunked",
      confidenceScore: verification.confidenceScore,
      linkedJournals: verification.sources,
      dateIdentified: new Date(),
    });

    await claim.save();
    return claim;
  } catch (error) {
    console.error("Error processing claim:", error);
    return {
      text: claimData.claim,
      error: error.message,
      verificationStatus: "error",
      confidenceScore: 0,
    };
  }
}

async function verifyClaimInternal(claim) {
  try {
    const prompt = `Analyze this health claim: "${claim}"
    
    Provide a JSON response with:
    {
      "category": "Nutrition|Medicine|Mental Health|Fitness|General Wellness",
      "isVerified": boolean,
      "confidenceScore": number (0-1),
      "sources": [
        {
          "name": "Journal/Source name",
          "excerpt": "Relevant excerpt supporting/contradicting claim",
          "type": "supporting|contradicting"
        }
      ],
      "summary": "Brief explanation of verification result"
    }`;

    const response = await perplexityClient.post("/chat/completions", {
      model: "sonar-pro",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
    });

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error("Verification Error:", error.response?.data || error);
    throw new Error(`Error verifying claim: ${error.message}`);
  }
}

const verifyClaimHandler = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    const verificationResult = await verifyClaimInternal(claim.text);

    claim.verificationStatus = verificationResult.isVerified
      ? "verified"
      : "debunked";
    claim.confidenceScore = verificationResult.confidenceScore;
    claim.linkedJournals = verificationResult.sources;

    await claim.save();
    res.json(claim);
  } catch (err) {
    console.error("Verification Handler Error:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  processInfluencerContent,
  verifyClaimHandler,
  initializeAPIClients,
};
