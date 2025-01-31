/* eslint-disable react/prop-types */
import { useState } from "react";
import CitationList from "./CitationList";

function ClaimCard({ claim }) {
  const [showCitations, setShowCitations] = useState(false);

  const statusColors = {
    verified: "text-emerald-500",
    questionable: "text-yellow-500",
    debunked: "text-red-500",
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">
          {new Date(claim.dateIdentified).toLocaleDateString()}
        </span>
        <span
          className={`${statusColors[claim.verificationStatus]} font-medium`}
        >
          {claim.verificationStatus.charAt(0).toUpperCase() +
            claim.verificationStatus.slice(1)}
        </span>
      </div>

      <p className="text-white mb-2">{claim.text}</p>

      {claim.linkedJournals?.length > 0 && (
        <>
          <button
            onClick={() => setShowCitations(!showCitations)}
            className="text-emerald-500 hover:text-emerald-400 text-sm flex items-center space-x-1 mt-3"
          >
            <span>View Sources ({claim.linkedJournals.length})</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={showCitations ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"}
              />
            </svg>
          </button>

          {showCitations && <CitationList citations={claim.linkedJournals} />}
        </>
      )}

      <div className="flex justify-between items-center mt-3">
        <div className="text-sm">
          <span className="text-gray-400">Trust Score:</span>
          <span className="ml-1 text-emerald-500 font-medium">
            {Math.round(claim.confidenceScore * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default ClaimCard;
