import React, { useEffect, useState } from 'react';
import API_URL from '../config';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/github/leaderboard`)
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12">Loading leaderboard...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2">🏆 Developer Leaderboard</h1>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Top developers ranked by GitHub activity and influence</p>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Developer</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">Followers</th>
                <th className="px-4 py-3 text-left">Repos</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.login} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-4 py-3 font-bold text-lg">#{user.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar_url} alt={user.login} className="w-10 h-10 rounded-full" />
                      <a href={`https://github.com/${user.login}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 font-medium">
                        {user.login}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${user.score}%` }}></div>
                      </div>
                      <span className="font-semibold">{user.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{user.followers.toLocaleString()}</td>
                  <td className="px-4 py-3">{user.public_repos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
