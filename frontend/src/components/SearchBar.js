import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [username, setUsername] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(username);
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
      <input
        type="text"
        placeholder="Enter GitHub username (e.g., octocat)"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="px-5 py-3 w-72 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />
      <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
        Analyze
      </button>
    </form>
  );
};

export default SearchBar;
