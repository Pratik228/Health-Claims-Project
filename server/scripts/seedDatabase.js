require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Influencer = require("../models/Influencer");
const Claim = require("../models/Claim");
const Journal = require("../models/Journal");
const { processInfluencerContent } = require("../controllers/claimController");
const { createInfluencer } = require("../controllers/influencerController");

function checkEnvironmentVariables() {
  const required = ["MONGODB_URI", "OPENAI_API_KEY", "PERPLEXITY_API_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error(
      "Missing required environment variables:",
      missing.join(", ")
    );
    process.exit(1);
  }
  console.log("✓ Environment variables validated");
}

const influencers = [
  "Andrew Huberman",
  "Dr. Peter Attia",
  "Dr. Rhonda Patrick",
  "Dr. Mark Hyman",
  "Dr. David Sinclair",
];

async function clearDatabase() {
  try {
    await Promise.all([
      Influencer.deleteMany({}),
      Claim.deleteMany({}),
      Journal.deleteMany({}),
    ]);
    console.log("✓ Database cleared");
  } catch (error) {
    throw new Error(`Failed to clear database: ${error.message}`);
  }
}

async function createInfluencerWithRetry(name, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const req = { body: { name } };
      const res = {
        status: () => ({
          json: () => {},
        }),
        json: (data) => data,
      };

      const result = await createInfluencer(req, res);
      console.log(`✓ Created influencer: ${name}`);
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(
          `Failed to create influencer ${name}: ${error.message}`
        );
      }
      console.log(`Retry attempt ${attempt} for ${name}`);
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
}

async function processInfluencerWithRetry(influencerId, name, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const req = {
        body: {
          influencerId,
          name,
          timeRange: "30d",
        },
      };
      const res = {
        json: (data) => data,
        status: () => ({
          json: () => {},
        }),
      };

      const result = await processInfluencerContent(req, res);
      console.log(`✓ Processed claims for: ${name}`);
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw new Error(
          `Failed to process claims for ${name}: ${error.message}`
        );
      }
      console.log(`Retry attempt ${attempt} for processing ${name}`);
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }
  }
}

async function seedDatabase() {
  try {
    checkEnvironmentVariables();

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    await clearDatabase();

    console.log("\nStarting database seeding...");

    for (const name of influencers) {
      try {
        console.log(`\nProcessing ${name}...`);

        const createdInfluencer = await createInfluencerWithRetry(name);

        if (createdInfluencer) {
          await processInfluencerWithRetry(createdInfluencer._id, name);
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`⨯ Error processing ${name}:`, error.message);
      }
    }

    const stats = {
      influencers: await Influencer.countDocuments(),
      claims: await Claim.countDocuments(),
      journals: await Journal.countDocuments(),
    };

    console.log("\nSeeding completed. Statistics:");
    console.table(stats);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("⨯ Seeding failed:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\nGracefully shutting down...");
  await mongoose.connection.close();
  process.exit(0);
});

seedDatabase();
