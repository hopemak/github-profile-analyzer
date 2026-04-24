import React, { useState, useEffect } from 'react';
import API_URL from '../config';

const ProjectQuality = ({ username }) => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRepo, setExpandedRepo] = useState(null);

  useEffect(() => {
    if (username) {
      setLoading(true);
      fetch(`${API_URL}/api/github/repo-quality/${username}`)
        .then(res => res.json())
        .then(data => {
          setRepos(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [username]);

  if (loading) return <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 animate-pulse">📊 Analyzing repositories...</div>;
  if (repos.length === 0) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getQualityBadge = (quality) => {
    const badges = {
      'Professional': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Good': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Basic': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Needs Work': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return badges[quality] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
      <h3 className="font-bold text-xl mb-4 flex items-center gap-2">📁 Project Quality Analyzer</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Top repositories ranked by quality score (README, license, activity, popularity)
      </p>
      <div className="space-y-3">
        {repos.map((repo, idx) => (
          <div key={repo.name} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer" onClick={() => setExpandedRepo(expandedRepo === repo.name ? null : repo.name)}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{repo.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getQualityBadge(repo.quality)}`}>
                      {repo.quality}
                    </span>
                    <span className="text-xs text-gray-500">{repo.language}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{repo.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>⭐ {repo.stars.toLocaleString()}</span>
                    <span>🔀 {repo.forks}</span>
                    <span>📅 {new Date(repo.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className={`${getScoreColor(repo.score)} h-2 rounded-full`} style={{ width: `${repo.score}%` }}></div>
                    </div>
                    <span className="font-bold text-lg">{repo.score}</span>
                  </div>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View on GitHub →
                  </a>
                </div>
              </div>
            </div>
            {expandedRepo === repo.name && (
              <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {repo.details.map((detail, i) => (
                    <div key={i} className="text-sm text-gray-600 dark:text-gray-400">
                      {detail}
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    🔗 Full repository details →
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectQuality;
