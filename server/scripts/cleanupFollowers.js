require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Influencer = require("../models/Influencer");
const axios = require("axios");

function checkEnvironmentVariables() {
  const required = ["MONGODB_URI", "PERPLEXITY_API_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    missing.forEach((key) => console.error(`- ${key}`));
    process.exit(1);
  }
}

// Initialize Perplexity client
const perplexity = axios.create({
  baseURL: "https://api.perplexity.ai",
  headers: {
    Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
  },
});

// Normalize follower count
function normalizeFollowerCount(count) {
  if (!count || isNaN(count)) {
    return 100000; // Default to 100K
  }

  // Convert scientific notation to regular number if needed
  if (count.toString().includes("e")) {
    count = Number(count.toFixed(0));
  }

  // Cap at 500M and ensure minimum of 1K
  count = Math.min(Math.max(count, 1000), 500_000_000);

  return Math.round(count);
}

// Fetch follower count from Perplexity
async function fetchFollowerCount(name) {
  try {
    const prompt = `Find total follower count across all social media platforms for ${name}. Return only the number, no text.`;
    const response = await perplexity.post("/chat/completions", {
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });

    const content = response.data.choices[0].message.content;
    const count = parseInt(content.replace(/[^0-9]/g, ""));
    return normalizeFollowerCount(count);
  } catch (error) {
    console.error(`Error fetching count for ${name}:`, error.message);
    return 100000; // Default to 100K on error
  }
}

async function cleanupAndUpdateFollowers() {
  try {
    checkEnvironmentVariables();

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get all influencers
    const influencers = await Influencer.find({});
    console.log(`Found ${influencers.length} influencers total`);

    let updated = 0;
    let errors = 0;

    for (const influencer of influencers) {
      try {
        console.log(`\nProcessing ${influencer.name}...`);

        // Check if current follower count needs cleanup
        const currentCount = influencer.followerCount;
        let newCount;

        if (!currentCount || currentCount === 0 || currentCount > 500_000_000) {
          console.log(`Fetching new count for ${influencer.name}...`);
          newCount = await fetchFollowerCount(influencer.name);
        } else {
          console.log(`Normalizing existing count ${currentCount}...`);
          newCount = normalizeFollowerCount(currentCount);
        }

        if (newCount !== currentCount) {
          await Influencer.findByIdAndUpdate(influencer._id, {
            followerCount: newCount,
          });
          console.log(
            `Updated ${influencer.name}: ${currentCount} -> ${newCount}`
          );
          updated++;
        }

        // Add delay between API calls
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing ${influencer.name}:`, error.message);
        errors++;
      }
    }

    console.log("\nCleanup Summary:");
    console.log(`Total processed: ${influencers.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Errors encountered: ${errors}`);

    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupAndUpdateFollowers();
