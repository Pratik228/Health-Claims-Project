/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
function InfluencerTable({ influencers }) {
  const formatFollowers = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getTrustScoreColor = (score) => {
    if (score >= 0.9) return "text-emerald-400";
    if (score >= 0.7) return "text-emerald-500";
    if (score >= 0.5) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow bg-gray-800">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-900">
            <th className="py-4 px-6 text-left text-sm font-medium text-gray-400">
              #
            </th>
            <th className="py-4 px-6 text-left text-sm font-medium text-gray-400">
              INFLUENCER
            </th>
            <th className="py-4 px-6 text-left text-sm font-medium text-gray-400">
              EXPERTISE
            </th>
            <th className="py-4 px-6 text-right text-sm font-medium text-gray-400">
              TRUST SCORE
            </th>
            <th className="py-4 px-6 text-right text-sm font-medium text-gray-400">
              FOLLOWERS
            </th>
            <th className="py-4 px-6 text-right text-sm font-medium text-gray-400">
              VERIFIED CLAIMS
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {influencers.map((influencer, index) => (
            <tr
              key={influencer._id}
              className="hover:bg-gray-700/50 transition-colors"
            >
              <td className="py-4 px-6 text-sm text-gray-300">#{index + 1}</td>
              <td className="py-4 px-6">
                <Link
                  to={`/influencer/${influencer._id}`}
                  className="flex items-center space-x-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-medium">
                    {influencer.name.charAt(0)}
                  </div>
                  <span className="text-white group-hover:text-emerald-400 transition-colors">
                    {influencer.name}
                  </span>
                </Link>
              </td>
              <td className="py-4 px-6">
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(influencer.expertise) ? (
                    influencer.expertise.map((exp, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300"
                      >
                        {exp}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
                      {influencer.mainFocus || "Health & Wellness"}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-4 px-6 text-right">
                <span
                  className={`font-medium ${getTrustScoreColor(
                    influencer.trustScore
                  )}`}
                >
                  {Math.round(influencer.trustScore * 100)}%
                </span>
              </td>
              <td className="py-4 px-6 text-right font-medium text-gray-300">
                {formatFollowers(influencer.followerCount)}
              </td>
              <td className="py-4 px-6 text-right font-medium text-gray-300">
                {influencer.totalClaimsAnalyzed || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InfluencerTable;
