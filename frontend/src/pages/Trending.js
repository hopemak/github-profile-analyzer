import React, { useState, useEffect } from 'react';
import API_URL from '../config';

const Trending = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/github/trending/details`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load trending developers');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-12">Loading trending developers...</div>;
  if (error) return <div className="text-center text-red-600 py-12">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2">🔥 Trending Developers</h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Top GitHub users by followers and stars</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.login} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <img src={user.avatar_url} alt={user.login} className="w-16 h-16 rounded-full border-2 border-blue-500" />
                <div>
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white">{user.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{user.login}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{user.followers.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Followers</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{user.public_repos}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Repos</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{user.totalStars.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">⭐ Stars</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{user.following}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Following</div>
                </div>
              </div>
              <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition">
                View Profile →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Trending;
