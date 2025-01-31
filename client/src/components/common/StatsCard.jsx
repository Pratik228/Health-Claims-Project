/* eslint-disable react/prop-types */

function StatsCard({ title, value, icon, trend }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${icon ? "bg-emerald-500/10" : ""}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4">
          <span
            className={`text-sm ${
              trend > 0 ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span className="text-sm text-gray-400 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
}

export default StatsCard;
