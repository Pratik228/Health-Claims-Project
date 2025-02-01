/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
function SearchBar({
  searchTerm,
  onSearchChange,
  searchResults,
  showSearchResults,
  error,
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search for health influencers..."
        className="w-full bg-gray-700 border-gray-600 rounded-md text-white px-4 py-2"
      />
      {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
      {showSearchResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-gray-700 rounded-md shadow-lg">
          {searchResults.map((result) => (
            <Link
              key={result._id}
              to={`/influencer/${result._id}`}
              className="block px-4 py-2 hover:bg-gray-600 text-white"
            >
              <div>
                <div className="font-medium">{result.name}</div>
                {result.expertise && (
                  <div className="text-sm text-gray-400">
                    {Array.isArray(result.expertise)
                      ? result.expertise.join(", ")
                      : result.expertise}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
