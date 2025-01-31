/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from "react";
import axios from "../../../services/axios";
import CategoryFilters from "./CategoryFilters";
import InfluencerTable from "./InfluencerTable";

function Leaderboard({ onSelectInfluencer }) {
  const [state, setState] = useState({
    influencers: [],
    categories: [],
    selectedCategories: [],
    loading: true,
    error: null,
    categoryStats: {},
  });

  const fetchData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const [claimsResponse, influencersResponse] = await Promise.all([
        axios.get("/claims"),
        axios.get("/influencers"),
      ]);
      const categoryStats = claimsResponse.data.reduce((acc, claim) => {
        if (claim.category) {
          acc[claim.category] = acc[claim.category] || {
            total: 0,
            verified: 0,
            debunked: 0,
          };
          acc[claim.category].total += 1;
          if (claim.verificationStatus === "verified") {
            acc[claim.category].verified += 1;
          } else if (claim.verificationStatus === "debunked") {
            acc[claim.category].debunked += 1;
          }
        }
        return acc;
      }, {});

      const sortedCategories = Object.entries(categoryStats)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([category]) => category);
      const processedInfluencers = influencersResponse.data.map(
        (influencer) => {
          const influencerClaims = claimsResponse.data.filter(
            (claim) =>
              claim.influencerId && claim.influencerId._id === influencer._id
          );

          // Calculate categories
          const categories = influencerClaims.reduce((acc, claim) => {
            if (claim.category) {
              acc[claim.category] = (acc[claim.category] || 0) + 1;
            }
            return acc;
          }, {});

          return {
            ...influencer,
            claimsByCategory: categories,
            claims: influencerClaims,
          };
        }
      );
      setState((prev) => ({
        ...prev,
        categories: sortedCategories,
        categoryStats,
        influencers: processedInfluencers,
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to load data. Please try again.",
        loading: false,
      }));
    }
  }, []);

  const getFilteredInfluencers = useCallback(() => {
    if (state.selectedCategories.length === 0) {
      return state.influencers;
    }

    return state.influencers.filter((influencer) =>
      state.selectedCategories.some(
        (category) => influencer.claimsByCategory[category]
      )
    );
  }, [state.influencers, state.selectedCategories]);

  const handleCategoryChange = useCallback((category) => {
    setState((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter((c) => c !== category)
        : [...prev.selectedCategories, category],
    }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (state.loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-red-500 mb-4">{state.error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  const filteredInfluencers = getFilteredInfluencers();

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="mb-6">
        <CategoryFilters
          categories={state.categories}
          selectedCategories={state.selectedCategories}
          onCategoryChange={handleCategoryChange}
          categoryStats={state.categoryStats}
        />
      </div>
      {filteredInfluencers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No influencers found for the selected categories.
        </div>
      ) : (
        <InfluencerTable
          influencers={filteredInfluencers}
          onSelectInfluencer={onSelectInfluencer}
        />
      )}
    </div>
  );
}

export default Leaderboard;
