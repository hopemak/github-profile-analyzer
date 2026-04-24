import React, { useEffect, useState } from 'react';
import API_URL from '../config';

const Trending = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/github/trending`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Could not load trending developers');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-12">Loading trending developers...</div>;
  if (error) return <div className="text-center text-red-600 py-12">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2">🔥 Trending Developers</h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Most followed developers on GitHub</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.login} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all">
            <div className="p-5">
              <div className="flex items-center gap-4">
                <img src={user.avatar_url} alt={user.login} className="w-16 h-16 rounded-full" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{user.name || user.login}</h3>
                  <p className="text-gray-500 text-sm">@{user.login}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <div className="font-bold text-lg">{user.followers.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <div className="font-bold text-lg">{user.public_repos}</div>
                  <div className="text-xs text-gray-500">Repos</div>
                </div>
              </div>
              <a
                href={`https://github.com/${user.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
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
