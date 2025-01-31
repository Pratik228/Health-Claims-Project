/* eslint-disable react/prop-types */
function StatCard({ label, value, trend, subtext }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-400 text-sm">{label}</h3>
        {trend && (
          <span
            className={`${
              trend === "up" ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {subtext && <div className="text-sm text-gray-500">{subtext}</div>}
    </div>
  );
}

function StatsGrid({ influencer, claims }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      <StatCard
        label="Trust Score"
        value={`${Math.round(influencer.trustScore * 100)}%`}
        trend={influencer.trustScore > 0.5 ? "up" : "down"}
        subtext={`Based on ${influencer.totalClaimsAnalyzed} claims`}
      />
      <StatCard
        label="Followers"
        value={new Intl.NumberFormat().format(influencer.followerCount)}
        subtext="Total following"
      />
      <StatCard
        label="Verified Claims"
        value={claims.filter((c) => c.verificationStatus === "verified").length}
        subtext={`Out of ${claims.length} total claims`}
      />
      <StatCard
        label="Last Analysis"
        value={new Date(influencer.lastAnalyzed).toLocaleDateString()}
        subtext="Analysis date"
      />
    </div>
  );
}

export default StatsGrid;
