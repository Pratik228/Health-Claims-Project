const mongoose = require("mongoose");
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
  const { influencerId, name, timeRange = "30d" } = req.body;

  try {
    if (!influencerId || !name) {
      return res.status(400).json({
        message: "Both influencerId and name are required",
      });
    }

    const influencer = await Influencer.findById(influencerId);
    if (!influencer) {
      return res.status(404).json({ message: "Influencer not found" });
    }

    console.log(`Starting content analysis for ${name}...`);
    const content = await fetchInfluencerContent(name, timeRange);
    console.log(`Content fetched, extracting claims...`);

    const extractedClaims = await extractClaims(content);
    console.log(`Found ${extractedClaims.length} claims to process`);

    const processedClaims = await Promise.all(
      extractedClaims.map((claim) =>
        processClaim(claim, influencerId).catch((error) => {
          console.error(`Failed to process claim: ${claim.claim}`, error);
          return null;
        })
      )
    );

    const successfulClaims = processedClaims.filter(Boolean);
    const verifiedClaims = successfulClaims.filter(
      (claim) => claim.verificationStatus === "verified"
    );

    // Calculate detailed trust score
    const calculateDetailedTrustScore = (claims) => {
      if (!claims.length) return 0;

      return (
        claims.reduce((total, claim) => {
          let score = 0;

          // Base verification status (40% weight)
          if (claim.verificationStatus === "verified") {
            score += 0.4;
          }

          // Confidence score (30% weight)
          score += (claim.confidenceScore || 0) * 0.3;

          // Source quality (30% weight)
          if (claim.linkedJournals?.length) {
            const journalScore =
              claim.linkedJournals.reduce((sum, journal) => {
                let sourceScore = 0;
                // Give higher weight to journals with better evidence
                if (journal.url) sourceScore += 0.1;
                if (journal.authors?.length) sourceScore += 0.1;
                if (journal.type === "supporting") sourceScore += 0.1;
                return sum + sourceScore;
              }, 0) / claim.linkedJournals.length;

            score += journalScore;
          }

          return total + score;
        }, 0) / claims.length
      );
    };

    const newTrustScore = calculateDetailedTrustScore(successfulClaims);

    // Update influencer stats
    await Influencer.findByIdAndUpdate(influencerId, {
      trustScore: newTrustScore,
      totalClaimsAnalyzed: successfulClaims.length,
      lastAnalyzed: new Date(),
    });

    res.json({
      trustScore: newTrustScore,
      claims: successfulClaims,
      summary: {
        totalClaims: successfulClaims.length,
        verifiedClaims: verifiedClaims.length,
        failedClaims: extractedClaims.length - successfulClaims.length,
      },
    });
  } catch (error) {
    console.error("Error processing influencer:", error);
    res.status(500).json({
      message: "Failed to process influencer content",
      error: error.message,
    });
  }
};

async function fetchInfluencerContent(name, timeRange) {
  const prompt = `Analyze health-related content by ${name} from the past ${timeRange}.
    Focus on:
    1. Scientific claims and statements
    2. Health recommendations and advice
    3. Medical or nutritional assertions
    4. Research references or study citations
    5. Treatment suggestions or protocols
  
    For each claim found:
    - Include the exact quote or statement
    - Provide full context including date and platform
    - Note any referenced studies, papers, or experts
    - Include URLs or sources when available
  
    Only return verified content that can be fact-checked.`;

  try {
    const response = await perplexityClient.post("/chat/completions", {
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from Perplexity API");
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    throw new Error(`Error fetching content: ${error.message}`);
  }
}

async function extractClaims(content) {
  const systemPrompt = `You are a scientific fact-checker specializing in health claims analysis.
    Extract verifiable health claims from the content and format them as JSON.
    For each claim:
    1. Isolate the specific scientific assertion
    2. Include full context and source
    3. Identify any referenced studies or evidence
    4. Note the claim's specificity and measurability
  
    Return in this exact format:
    {
      "claims": [
        {
          "claim": "The precise health claim statement",
          "context": "Full context including source, date, and platform",
          "evidence": "Any cited studies, papers, or expert references",
          "urls": ["Array of relevant URLs if available"],
          "type": "medical|nutrition|fitness|mental_health|general"
        }
      ]
    }`;

  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      temperature: 0.3,
    });

    const parsedResponse = JSON.parse(response.choices[0].message.content);
    if (!parsedResponse.claims?.length) {
      throw new Error("No valid claims extracted");
    }

    return parsedResponse.claims;
  } catch (error) {
    throw new Error(`Error extracting claims: ${error.message}`);
  }
}

function calculateTrustScore(claims) {
  if (!claims.length) return 0;

  const weights = {
    verified: 1,
    hasEvidence: 0.3,
    hasUrls: 0.2,
  };

  return (
    claims.reduce((score, claim) => {
      let claimScore = 0;
      if (claim.verificationStatus === "verified")
        claimScore += weights.verified;
      if (claim.evidence) claimScore += weights.hasEvidence;
      if (claim.urls?.length > 0) claimScore += weights.hasUrls;
      return score + claimScore;
    }, 0) / claims.length
  );
}

async function processClaim(claimData, influencerId) {
  try {
    // Use regex instead of $text search
    const existingClaim = await Claim.findOne({
      influencerId,
      text: {
        $regex: `^${claimData.claim.replace(
          /[-\/\\^$*+?.()|[\]{}]/g,
          "\\$&"
        )}$`,
        $options: "i",
      },
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
      verificationStatus: verification.status || "pending",
      confidenceScore: verification.confidenceScore || 0,
      linkedJournals: verification.sources || [],
      dateIdentified: new Date(),
    });

    const savedClaim = await claim.save();
    console.log(`Successfully processed claim: ${savedClaim._id}`);
    return savedClaim;
  } catch (error) {
    console.error("Error processing claim:", error);
    throw error; // Let the caller handle the error
  }
}

async function verifyClaimInternal(claim) {
  try {
    const prompt = `Analyze this health claim: "${claim}"
    Find specific, real research papers and scientific sources.
    Return a JSON response with:
        {
        "category": "Nutrition|Medicine|Mental Health|Fitness|General Wellness",
        "status": "verified|debunked",  // Changed from verified|debunked|inconclusive
        "confidenceScore": number (0-1),
        "sources": [
            {
            "name": "Specific journal name",
            "title": "Exact paper title",
            "authors": ["Full author names"],
            "year": "Publication year",
            "doi": "DOI if available",
            "pubmedId": "PubMed ID if available",
            "url": "Direct link to paper",
            "excerpt": "Direct quote from paper supporting analysis",
            "type": "supporting|contradicting"
            }
        ],
        "summary": "Detailed explanation with scientific evidence"
        }
        Only use verified, peer-reviewed sources. If insufficient evidence exists, mark as 'debunked'.`;

    const response = await perplexityClient.post("/chat/completions", {
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content:
            "You are a JSON-only response bot. Only return valid JSON objects, no other text.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = response.data.choices[0].message.content.trim();
    console.log("Raw verification response:", content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (
      !result.category ||
      !result.status ||
      !result.confidenceScore ||
      !Array.isArray(result.sources)
    ) {
      throw new Error("Invalid response format - missing required fields");
    }

    // Process and validate sources with additional fields
    const processedSources = result.sources
      .map((source) => {
        if (!source.name || !source.excerpt || !source.type) {
          return null;
        }

        // Construct URL from available identifiers
        let url = source.url;
        if (!url && source.doi) {
          url = `https://doi.org/${source.doi}`;
        } else if (!url && source.pubmedId) {
          url = `https://pubmed.ncbi.nlm.nih.gov/${source.pubmedId}`;
        }

        return {
          journalId: new mongoose.Types.ObjectId(),
          name: source.name,
          title: source.title || "",
          authors: source.authors || [],
          year: source.year || "",
          url: url || "",
          excerpt: source.excerpt,
          type: source.type,
          evidenceStrength: calculateEvidenceStrength(source),
        };
      })
      .filter(Boolean);

    return {
      category: result.category,
      status: result.status,
      confidenceScore: result.confidenceScore,
      sources: processedSources,
      summary: result.summary,
    };
  } catch (error) {
    console.error("Raw verification error:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse verification response");
    }
    throw new Error(`Verification failed: ${error.message}`);
  }
}

// Helper function to calculate evidence strength
function calculateEvidenceStrength(source) {
  let score = 0;
  if (source.doi) score += 0.4;
  if (source.pubmedId) score += 0.3;
  if (source.url) score += 0.2;
  if (source.authors?.length > 0) score += 0.1;
  return Math.min(score, 1);
}

async function findOrCreateJournal(source) {
  const existingJournal = await Journal.findOne({
    $or: [{ name: source.name }, { aliases: source.name }],
  });

  if (existingJournal) {
    return existingJournal;
  }

  const journal = new Journal({
    name: source.name,
    trustedSource: await validateJournalSource(source),
    domain: source.url ? new URL(source.url).hostname : undefined,
    categories: [],
    impactFactor: await fetchJournalImpactFactor(source),
    lastVerificationDate: new Date(),
  });

  await journal.save();
  return journal;
}

const verifyClaimHandler = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId).populate(
      "linkedJournals.journalId"
    );

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const verificationResult = await verifyClaimInternal({
      claim: claim.text,
      context: claim.sourceContent,
      evidence: claim.evidence,
    });

    const updatedClaim = await Claim.findByIdAndUpdate(
      claim._id,
      {
        verificationStatus: verificationResult.status,
        confidenceScore: verificationResult.confidenceScore,
        linkedJournals: verificationResult.sources,
        "aiProcessingMetadata.lastProcessed": new Date(),
      },
      { new: true }
    ).populate("linkedJournals.journalId");

    res.json(updatedClaim);
  } catch (error) {
    res.status(500).json({
      message: "Verification failed",
      error: error.message,
    });
  }
};

module.exports = {
  processInfluencerContent,
  verifyClaimHandler,
  initializeAPIClients,
};
