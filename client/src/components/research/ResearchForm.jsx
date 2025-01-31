/* eslint-disable react/prop-types */
const ResearchForm = ({
  timeRange,
  setTimeRange,
  productsCount,
  setProductsCount,
  claimsCount,
  setClaimsCount,
  influencerName,
  setInfluencerName,
  discoverQuery,
  setDiscoverQuery,
  settings,
  setSettings,
}) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-emerald-500 mb-6">
        Research Configuration
      </h2>

      {/* Search Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Specific Influencer
          </label>
          <input
            type="text"
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500"
            placeholder="Research a known health influencer by name"
            value={influencerName}
            onChange={(e) => setInfluencerName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Discover New
          </label>
          <input
            type="text"
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500"
            placeholder="Find and analyze new health influencers"
            value={discoverQuery}
            onChange={(e) => setDiscoverQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Time Range */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Time Range</label>
        <div className="grid grid-cols-4 gap-4">
          {["Last Week", "Last Month", "Last Year", "All Time"].map((range) => (
            <button
              key={range}
              className={`p-3 rounded-lg border border-gray-700 ${
                timeRange === range.toLowerCase().replace(" ", "-")
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-700"
              }`}
              onClick={() =>
                setTimeRange(range.toLowerCase().replace(" ", "-"))
              }
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Products Count */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">
          Products to Find Per Influencer
        </label>
        <input
          type="number"
          value={productsCount}
          onChange={(e) => setProductsCount(Number(e.target.value))}
          className="w-32 bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white"
        />
        <p className="mt-1 text-sm text-gray-500">
          Set to 0 to skip product research
        </p>
      </div>

      {/* Claims Count */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">
          Claims to Analyze Per Influencer
        </label>
        <input
          type="number"
          value={claimsCount}
          onChange={(e) => setClaimsCount(Number(e.target.value))}
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white"
        />
        <p className="mt-1 text-sm text-gray-500">
          Recommended: 30-100 claims for comprehensive analysis
        </p>
      </div>

      {/* Toggle Settings */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white">Include Revenue Analysis</h3>
            <p className="text-sm text-gray-400">
              Analyze monetization methods and estimate earnings
            </p>
          </div>
          <button
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                includeRevenue: !prev.includeRevenue,
              }))
            }
            className={`w-12 h-6 rounded-full ${
              settings.includeRevenue ? "bg-emerald-600" : "bg-gray-600"
            }`}
          >
            <span
              className={`block w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                settings.includeRevenue ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white">Verify with Scientific Journals</h3>
            <p className="text-sm text-gray-400">
              Cross-reference claims with scientific literature
            </p>
          </div>
          <button
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                verifyScientific: !prev.verifyScientific,
              }))
            }
            className={`w-12 h-6 rounded-full ${
              settings.verifyScientific ? "bg-emerald-600" : "bg-gray-600"
            }`}
          >
            <span
              className={`block w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                settings.verifyScientific ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResearchForm;
