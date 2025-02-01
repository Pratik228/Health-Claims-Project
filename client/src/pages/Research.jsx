/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/research/Header";
import ResearchForm from "../components/research/ResearchForm";
import JournalsSelection from "../components/research/JournalsSelection";
import Notes from "../components/research/Notes";
import SubmitButton from "../components/research/SubmitButton";

const DiscoveryResults = ({ influencers, onSelect }) => (
  <div className="mt-6 space-y-4">
    <h3 className="text-xl font-semibold text-white mb-4">
      Discovered Health Influencers
    </h3>
    <div className="grid gap-4">
      {influencers.map((influencer) => (
        <div key={influencer._id} className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-lg font-medium text-white">
                {influencer.name}
              </h4>
              <p className="text-gray-400">{influencer.expertise}</p>
              <p className="text-sm text-gray-500 mt-1">
                {influencer.description}
              </p>
            </div>
            <button
              onClick={() => onSelect(influencer._id)}
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-500"
            >
              View Profile
            </button>
          </div>
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-400">
            <span>
              {new Intl.NumberFormat().format(influencer.followerCount)}{" "}
              followers
            </span>
            <span>{influencer.credentials}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

function Research() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("last-month");
  const [productsCount, setProductsCount] = useState(10);
  const [claimsCount, setClaimsCount] = useState(50);
  const [influencerName, setInfluencerName] = useState("");
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoveredInfluencers, setDiscoveredInfluencers] = useState([]);
  const [showDiscoveryResults, setShowDiscoveryResults] = useState(false);
  const [selectedJournals, setSelectedJournals] = useState([
    "PubMed Central",
    "Nature",
    "Science",
    "The Lancet",
    "JAMA Network",
    "Cell",
    "New England Journal of Medicine",
  ]);
  const [settings, setSettings] = useState({
    includeRevenue: true,
    verifyScientific: true,
  });
  const [notes, setNotes] = useState("");

  const handleStartResearch = async () => {
    setShowDiscoveryResults(false);
    setDiscoveredInfluencers([]);
    if (!influencerName && !discoverQuery) {
      alert("Please enter an influencer name or discovery criteria");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (discoverQuery) {
        // Discovery mode
        const discoveryResponse = await api.post(
          "/influencers/discover",
          {
            query: discoverQuery,
          },
          { timeout: 30000 }
        );

        setDiscoveredInfluencers(discoveryResponse.data.results);
        setShowDiscoveryResults(true);
      } else {
        // Specific influencer mode
        let influencerId;
        try {
          const searchResponse = await api.get(`/influencers/search`, {
            params: { name: influencerName },
          });
          influencerId = searchResponse.data._id;
        } catch (searchError) {
          if (searchError.response?.status === 404) {
            const createResponse = await api.influencers.create({
              name: influencerName
            });
            influencerId = createResponse.data._id;
          } else {
            throw searchError;
          }
        }

        // Start analysis for specific influencer
        await api.claims.analyze({
          influencerId,
          name: influencerName,
          timeRange,
          settings: {
            includeRevenue: settings.includeRevenue,
            verifyScientific: settings.verifyScientific,
          },
          selectedJournals,
          notes,
        });

        navigate(`/influencer/${influencerId}`);
      }
    } catch (error) {
      console.error("Research Error:", error);
      setError(
        error.response?.data?.message ||
          "Error during research. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJournal = (journal) => {
    setSelectedJournals((prev) =>
      prev.includes(journal)
        ? prev.filter((j) => j !== journal)
        : [...prev, journal]
    );
  };

  const handleSelectAllJournals = () => {
    setSelectedJournals([
      "PubMed Central",
      "Nature",
      "Science",
      "The Lancet",
      "JAMA Network",
      "Cell",
      "New England Journal of Medicine",
    ]);
  };

  const handleDeselectAllJournals = () => {
    setSelectedJournals([]);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Header />
        <ResearchForm
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          productsCount={productsCount}
          setProductsCount={setProductsCount}
          claimsCount={claimsCount}
          setClaimsCount={setClaimsCount}
          influencerName={influencerName}
          setInfluencerName={setInfluencerName}
          discoverQuery={discoverQuery}
          setDiscoverQuery={setDiscoverQuery}
          settings={settings}
          setSettings={setSettings}
        />
        <JournalsSelection
          selectedJournals={selectedJournals}
          handleToggleJournal={handleToggleJournal}
          handleSelectAllJournals={handleSelectAllJournals}
          handleDeselectAllJournals={handleDeselectAllJournals}
        />
        <Notes notes={notes} setNotes={setNotes} />
        <SubmitButton
          handleStartResearch={handleStartResearch}
          loading={loading}
          error={error}
        />
        {showDiscoveryResults && (
          <div className="mt-6 bg-gray-800 rounded-lg p-6">
            {error ? (
              <div className="text-red-400 text-center">{error}</div>
            ) : discoveredInfluencers.length > 0 ? (
              <DiscoveryResults
                influencers={discoveredInfluencers}
                onSelect={(id) => navigate(`/influencer/${id}`)}
              />
            ) : (
              <div className="text-gray-400 text-center">
                No influencers found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Research;
