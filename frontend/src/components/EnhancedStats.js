import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API_URL from '../config';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const EnhancedStats = ({ username }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetch(`${API_URL}/api/github/timeline/${username}`)
        .then(res => res.json())
        .then(data => {
          setData(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [username]);

  if (loading) return <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 animate-pulse">📊 Loading timeline stats...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{data.totalCommits.toLocaleString()}</div>
          <div className="text-xs opacity-90">Total Commits</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{data.totalStars.toLocaleString()}</div>
          <div className="text-xs opacity-90">Total Stars Earned</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{data.activeMonths}</div>
          <div className="text-xs opacity-90">Active Months</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{data.avgCommitsPerMonth}</div>
          <div className="text-xs opacity-90">Avg Commits/Month</div>
        </div>
      </div>
      
      {/* Commit Timeline Chart */}
      {data.commitTimeline.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">📊 Commit Activity Timeline</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.commitTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
              <Bar dataKey="commits" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Top Starred Repositories */}
      {data.topStarredRepos.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">⭐ Top Starred Repositories</h3>
          <div className="space-y-3">
            {data.topStarredRepos.map((repo, idx) => (
              <div key={repo.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div>
                  <div className="font-medium">{repo.name}</div>
                  <div className="text-xs text-gray-500">{repo.language || 'Unknown'}</div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <span>⭐</span>
                  <span className="font-bold">{repo.stars.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Languages Summary */}
      {data.languages && data.languages.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">🔧 Languages Used</h3>
          <div className="flex flex-wrap gap-2">
            {data.languages.slice(0, 12).map((lang, idx) => (
              <span key={lang} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStats;
