/* eslint-disable react/prop-types */
const JournalsSelection = ({
  selectedJournals,
  handleToggleJournal,
  handleSelectAllJournals,
  handleDeselectAllJournals,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-gray-400">Scientific Journals</label>
        <div className="space-x-2">
          <button
            onClick={handleSelectAllJournals}
            className="text-emerald-500 text-sm hover:text-emerald-400"
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAllJournals}
            className="text-emerald-500 text-sm hover:text-emerald-400"
          >
            Deselect All
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {selectedJournals.map((journal) => (
          <div
            key={journal}
            className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg"
          >
            <span className="text-white">{journal}</span>
            <button
              onClick={() => handleToggleJournal(journal)}
              className="text-emerald-500"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JournalsSelection;
