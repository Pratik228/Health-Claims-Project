/* eslint-disable react/prop-types */
function ClaimFilters({
  verificationStatus,
  setVerificationStatus,
  sortConfig,
  setSortConfig,
}) {
  const sortOptions = [
    { value: "date-desc", label: "Newest First" },
    { value: "date-asc", label: "Oldest First" },
    { value: "score-desc", label: "Highest Trust Score" },
    { value: "score-asc", label: "Lowest Trust Score" },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex gap-2">
        {["All", "Verified", "Questionable", "Debunked"].map((status) => (
          <button
            key={status}
            className={`px-4 py-2 rounded-full ${
              verificationStatus === status.toLowerCase()
                ? "bg-emerald-600 text-white"
                : "text-gray-400 hover:bg-gray-700"
            }`}
            onClick={() => setVerificationStatus(status.toLowerCase())}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-400">Sort By:</span>
        <select
          value={`${sortConfig.field}-${sortConfig.direction}`}
          onChange={(e) => {
            const [field, direction] = e.target.value.split("-");
            setSortConfig({ field, direction });
          }}
          className="bg-gray-700 border-gray-600 rounded-md text-white px-3 py-1"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default ClaimFilters;
