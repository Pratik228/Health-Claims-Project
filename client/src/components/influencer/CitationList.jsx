/* eslint-disable react/prop-types */
function CitationList({ citations }) {
  if (!citations?.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {citations.map((citation, index) => (
        <div key={index} className="bg-gray-800 p-3 rounded-md">
          <div className="flex justify-between items-start">
            <h4 className="text-emerald-500 font-medium">{citation.name}</h4>
            {citation.type && (
              <span
                className={`text-xs px-2 py-1 rounded ${
                  citation.type === "supporting"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {citation.type}
              </span>
            )}
          </div>
          {citation.excerpt && (
            <p className="text-gray-400 text-sm mt-2">{citation.excerpt}</p>
          )}
          {citation.url && (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 hover:text-emerald-400 text-sm flex items-center mt-2"
            >
              View Source
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

export default CitationList;
