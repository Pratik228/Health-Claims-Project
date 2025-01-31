require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const { processInfluencerContent } = require("../controllers/claimController");

// Validate environment variables first
function checkEnvironmentVariables() {
  const required = ["MONGODB_URI", "OPENAI_API_KEY", "PERPLEXITY_API_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    missing.forEach((key) => console.error(`- ${key}`));
    process.exit(1);
  }

  console.log("Environment variables loaded successfully");
}

const influencers = [
  "Andrew Huberman",
  "Dr. Peter Attia",
  "Dr. Rhonda Patrick",
  "Dr. Mark Hyman",
  "Dr. David Sinclair",
];

async function seedDatabase() {
  try {
    // Check environment variables first
    checkEnvironmentVariables();

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    for (const name of influencers) {
      console.log(`Processing ${name}...`);

      // Create mock request and response objects
      const req = {
        body: {
          name,
          timeRange: "30d",
          openaiKey: process.env.OPENAI_API_KEY,
          perplexityKey: process.env.PERPLEXITY_API_KEY,
        },
      };

      const res = {
        json: (data) => console.log(`Success: ${name}`, data),
        status: (code) => ({
          json: (error) => console.error(`Error (${code}):`, error),
        }),
      };

      try {
        await processInfluencerContent(req, res);
        // Wait a bit between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to process ${name}:`, error.message);
      }
    }

    console.log("Database seeding completed");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
