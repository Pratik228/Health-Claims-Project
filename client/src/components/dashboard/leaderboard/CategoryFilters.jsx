/* eslint-disable react/prop-types */
function CategoryFilters({
  categories,
  selectedCategories,
  onCategoryChange,
  categoryStats,
}) {
  const calculatePercentage = (part, total) => {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  };
  const getCategoryColorClass = (category) => {
    const stats = categoryStats[category];
    if (!stats || stats.total === 0) return "bg-gray-600";

    const verificationRate = calculatePercentage(stats.verified, stats.total);
    if (verificationRate >= 70) return "bg-emerald-600";
    if (verificationRate >= 40) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Categories</h3>
        {selectedCategories.length > 0 && (
          <button
            onClick={() => selectedCategories.forEach(onCategoryChange)}
            className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            Clear Filters ({selectedCategories.length})
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const stats = categoryStats[category] || {
            total: 0,
            verified: 0,
            debunked: 0,
          };
          const verificationRate = calculatePercentage(
            stats.verified,
            stats.total
          );

          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`
                  p-4 rounded-lg transition-all
                  ${
                    selectedCategories.includes(category)
                      ? `${getCategoryColorClass(category)} ring-2 ring-white`
                      : "bg-gray-700 hover:bg-gray-600"
                  }
                `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">{category}</span>
                <span
                  className={`
                    px-2 py-1 rounded-full text-xs
                    ${
                      verificationRate >= 70
                        ? "bg-emerald-500/20 text-emerald-300"
                        : verificationRate >= 40
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-red-500/20 text-red-300"
                    }
                  `}
                >
                  {verificationRate}% Verified
                </span>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Total Claims:</span>
                  <span>{stats.total}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Verified:</span>
                  <span>{stats.verified}</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>Debunked:</span>
                  <span>{stats.debunked}</span>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${verificationRate}%`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryFilters;
