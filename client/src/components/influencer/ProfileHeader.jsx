/* eslint-disable react/prop-types */
function ProfileHeader({ influencer }) {
  return (
    <div className="flex items-start">
      {influencer.imageUrl ? (
        <img
          src={influencer.imageUrl}
          alt={influencer.name}
          className="w-24 h-24 rounded-full object-cover"
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-3xl text-white">
          {influencer.name.charAt(0)}
        </div>
      )}
      <div className="ml-6 flex-grow">
        <h1 className="text-2xl font-bold text-white">{influencer.name}</h1>
        {influencer.socialHandles && (
          <div className="flex flex-wrap gap-2 mt-2">
            {influencer.socialHandles.map((handle, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
              >
                {handle.platform}: @{handle.handle}
              </span>
            ))}
          </div>
        )}
        <p className="mt-3 text-gray-400 max-w-3xl">{influencer.bio}</p>
      </div>
    </div>
  );
}

export default ProfileHeader;
