/* eslint-disable react/prop-types */
function InfluencerDetail({ influencer }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gray-600" />
        <div>
          <h2 className="text-xl font-semibold text-white">
            {influencer.name}
          </h2>
          <p className="text-gray-400">{influencer.category}</p>
        </div>
        <div className="ml-auto">
          <div className="text-2xl font-bold text-emerald-500">
            {influencer.trustScore}%
          </div>
          <div className="text-sm text-gray-400">Trust Score</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-400">Verified Claims</div>
          <div className="text-xl font-semibold text-white">
            {influencer.verifiedClaims}
          </div>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-400">Followers</div>
          <div className="text-xl font-semibold text-white">
            {new Intl.NumberFormat().format(influencer.followerCount || 0)}
          </div>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-400">Last Analysis</div>
          <div className="text-xl font-semibold text-white">
            {new Date(influencer.lastAnalysis).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfluencerDetail;
