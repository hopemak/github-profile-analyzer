import React, { useState, useEffect } from 'react';
import API_URL from '../config';

const AICoach = ({ username }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (username) {
      setLoading(true);
      fetch(`${API_URL}/api/github/coach/${username}`)
        .then(res => res.json())
        .then(data => {
          setData(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [username]);

  if (loading) return <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 animate-pulse">🎯 Analyzing your skills...</div>;
  if (!data) return null;

  const categoryNames = {
    problemSolving: '🧩 Problem Solving',
    codeQuality: '📝 Code Quality',
    consistency: '⏰ Consistency',
    collaboration: '🤝 Collaboration'
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl shadow-md p-6">
      <h3 className="font-bold text-xl mb-3 flex items-center gap-2">🎯 Personal AI Coach</h3>
      <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
        <p className="font-semibold text-yellow-800 dark:text-yellow-300">
          📊 Your lowest score: {categoryNames[data.lowestCategory]} ({data.lowestScore}/10)
        </p>
        <p className="text-gray-700 dark:text-gray-300 mt-2">💡 {data.advice}</p>
      </div>
      <div>
        <p className="font-semibold mb-2">📚 Recommended Learning Resources:</p>
        <div className="space-y-2">
          {data.resources.map((resource, idx) => (
            <a
              key={idx}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all"
            >
              <div className="font-medium text-blue-600 dark:text-blue-400">{resource.name}</div>
              <div className="text-sm text-gray-500">{resource.description?.substring(0, 100)}</div>
              <div className="text-xs text-gray-400 mt-1">⭐ {resource.stars.toLocaleString()} stars • {resource.language || 'N/A'}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AICoach;
