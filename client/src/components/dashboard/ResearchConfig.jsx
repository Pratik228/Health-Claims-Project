import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../services/axios";

const apiClient = axios.create({
  timeout: 30000, // 30 seconds
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

function ResearchConfig() {
  const navigate = useNavigate();
  const [influencerName, setInfluencerName] = useState("");
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const performAnalysis = async (name, range, attempt = 0) => {
    try {
      setProcessingStatus(
        attempt > 0
          ? `Retrying analysis (Attempt ${attempt + 1}/${MAX_RETRIES + 1})...`
          : "Analyzing content..."
      );

      return await apiClient.post("/claims/analyze", {
        name,
        timeRange: range,
      });
    } catch (error) {
      if (
        (error.code === "ECONNABORTED" || error.message.includes("timeout")) &&
        attempt < MAX_RETRIES
      ) {
        setProcessingStatus(
          `Request timed out. Retrying in ${RETRY_DELAY / 1000} seconds...`
        );
        await sleep(RETRY_DELAY);
        return performAnalysis(name, range, attempt + 1);
      }
      throw error;
    }
  };

  const handleStartAnalysis = async () => {
    if (!influencerName.trim()) {
      alert("Please enter an influencer name");
      return;
    }

    setLoading(true);
    setProcessingStatus("Creating influencer profile...");

    try {
      // Create influencer first
      const influencerResponse = await apiClient.post("/influencers", {
        name: influencerName,
        trustScore: 0,
        totalClaimsAnalyzed: 0,
      });

      const influencerId = influencerResponse.data._id;

      try {
        await performAnalysis(influencerName, timeRange);
        setProcessingStatus("Analysis complete! Redirecting...");
      } catch (analysisError) {
        console.error("Analysis error:", analysisError);
        setProcessingStatus(
          "Initial setup complete. Some data may still be processing..."
        );
      }

      // Navigate after a brief delay in either case
      setTimeout(() => {
        navigate(`/influencer/${influencerId}`);
      }, 1500);
    } catch (error) {
      console.error("Error:", error);
      alert(
        error.response?.data?.message ||
          "Error during creation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Research New Influencer
      </h2>
      <p className="text-gray-400 mb-6">
        Enter any health influencers name to analyze their content and verify
        their claims. New influencers will be automatically added to the
        database.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Influencer Name
          </label>
          <input
            type="text"
            value={influencerName}
            onChange={(e) => setInfluencerName(e.target.value)}
            className="w-full bg-gray-700 border-gray-600 rounded-md text-white p-2"
            placeholder="e.g., Dr. Andrew Huberman"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Analysis Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full bg-gray-700 border-gray-600 rounded-md text-white p-2"
            disabled={loading}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleStartAnalysis}
        disabled={loading}
        className={`mt-6 ${
          loading ? "bg-gray-600" : "bg-emerald-600 hover:bg-emerald-500"
        } text-white px-6 py-3 rounded-md flex items-center justify-center w-full`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {processingStatus}
          </>
        ) : (
          "Start Research & Analysis"
        )}
      </button>

      {loading && (
        <div className="mt-4 text-sm text-emerald-400 text-center animate-pulse">
          {processingStatus}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-400">
        Note: Analysis may take several moments to complete. Please be patient.
      </div>
    </div>
  );
}

export default ResearchConfig;
