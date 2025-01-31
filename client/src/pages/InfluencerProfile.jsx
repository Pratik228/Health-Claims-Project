import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../services/axios";
import ProfileHeader from "../components/influencer/ProfileHeader";
import StatsGrid from "../components/influencer/StatsGrid";
import ClaimFilters from "../components/influencer/ClaimFilters";
import ClaimCard from "../components/influencer/ClaimCard";

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );
}

function InfluencerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [influencer, setInfluencer] = useState(null);
  const [claims, setClaims] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });
  useEffect(() => {
    fetchInfluencerData();
  }, [id]);
  const fetchInfluencerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch influencer and claims data in parallel for better performance
      const [influencerResponse, claimsResponse] = await Promise.all([
        axios.get(`/influencers/${id}`),
        axios.get(`/claims?influencerId=${id}`),
      ]);

      setInfluencer(influencerResponse.data);
      setClaims(claimsResponse.data);
    } catch (err) {
      console.error("Error fetching influencer data:", err);
      setError(err.response?.data?.message || "Failed to load influencer data");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedClaims = () => {
    const filtered = claims.filter(
      (claim) =>
        verificationStatus === "all" ||
        claim.verificationStatus === verificationStatus
    );

    return filtered.sort((a, b) => {
      const [field, direction] = sortConfig.field.split("-");

      if (field === "date") {
        const dateA = new Date(a.dateIdentified);
        const dateB = new Date(b.dateIdentified);
        return direction === "desc" ? dateB - dateA : dateA - dateB;
      }

      if (field === "score") {
        const scoreA = a.confidenceScore || 0;
        const scoreB = b.confidenceScore || 0;
        return direction === "desc" ? scoreB - scoreA : scoreA - scoreB;
      }

      return 0;
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate("/")}
          className="text-emerald-500 hover:text-emerald-400"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  if (!influencer) return null;
  const filteredClaims = getFilteredAndSortedClaims();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <ProfileHeader influencer={influencer} />
        <StatsGrid influencer={influencer} claims={claims} />
      </div>
      <div className="bg-gray-800 rounded-lg p-6">
        <ClaimFilters
          verificationStatus={verificationStatus}
          setVerificationStatus={setVerificationStatus}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
        />
        <div className="space-y-4">
          {filteredClaims.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No claims found matching the current filters
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <ClaimCard key={claim._id} claim={claim} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default InfluencerProfile;
