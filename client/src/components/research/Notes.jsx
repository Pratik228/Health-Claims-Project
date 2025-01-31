/* eslint-disable react/prop-types */
const Notes = ({ notes, setNotes }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm text-gray-400 mb-2">
        Notes for Research Assistant
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full h-32 bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-white"
        placeholder="Add any specific instructions or focus areas..."
      />
    </div>
  );
};

export default Notes;
