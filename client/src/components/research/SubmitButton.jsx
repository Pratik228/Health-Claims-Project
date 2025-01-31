/* eslint-disable react/prop-types */
function SubmitButton({ handleStartResearch, loading, error }) {
  return (
    <div className="flex flex-col items-end">
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <button
        onClick={handleStartResearch}
        disabled={loading}
        className={`bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-500 flex items-center ${
          loading ? "opacity-75 cursor-not-allowed" : ""
        }`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing Research...
          </>
        ) : (
          "Start Research"
        )}
      </button>
    </div>
  );
}

export default SubmitButton;
