require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const { initializeAPIClients } = require("../controllers/claimController");
const Influencer = require("../models/Influencer");

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

const updateFollowerCounts = async () => {
  try {
    // Check environment variables first
    checkEnvironmentVariables();

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Initialize API clients with environment variables
    const { perplexityClient } = initializeAPIClients(
      process.env.OPENAI_API_KEY,
      process.env.PERPLEXITY_API_KEY
    );

    const influencers = await Influencer.find({ followerCount: 0 });
    console.log(`Found ${influencers.length} influencers to update`);

    for (const influencer of influencers) {
      try {
        const followerCountPrompt = `Find the total follower count across all social media platforms for ${influencer.name}. Return just the number.`;
        const followerResponse = await perplexityClient.post(
          "/chat/completions",
          {
            model: "sonar-pro",
            messages: [
              {
                role: "user",
                content: followerCountPrompt,
              },
            ],
            max_tokens: 100,
          }
        );

        const followerCount =
          parseInt(
            followerResponse.data.choices[0].message.content.replace(
              /[^0-9]/g,
              ""
            )
          ) || 0;

        await Influencer.findByIdAndUpdate(influencer._id, {
          followerCount,
        });

        console.log(
          `Updated ${influencer.name} with ${followerCount} followers`
        );

        // Add a small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error updating ${influencer.name}:`, error);
      }
    }

    console.log("Finished updating follower counts");
    process.exit(0);
  } catch (error) {
    console.error("Error in update process:", error);
    process.exit(1);
  }
};

// Run the update function
updateFollowerCounts();
