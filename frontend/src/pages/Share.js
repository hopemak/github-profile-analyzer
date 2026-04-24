import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API_URL from '../config';
import ProfileCard from '../components/ProfileCard';
import SkillScores from '../components/SkillScores';

const Share = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (username) {
      Promise.all([
        fetch(`${API_URL}/api/github/user/${username}`).then(r => r.json()),
        fetch(`${API_URL}/api/github/share/${username}`).then(r => r.json()),
        fetch(`${API_URL}/api/github/analyze/${username}`).then(r => r.json())
      ]).then(([userData, shareData, analyzeData]) => {
        setData({ user: userData, share: shareData, analyze: analyzeData });
        setLoading(false);
      }).catch(() => {
        setError('Failed to load profile data');
        setLoading(false);
      });
    }
  }, [username]);

  if (loading) return <div className="text-center py-12">Loading shared profile...</div>;
  if (error) return <div className="text-center text-red-600 py-12">{error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white text-center">
        <h1 className="text-3xl font-bold mb-2">📊 GitHub Profile Analysis</h1>
        <p className="text-blue-100">Shared by GitHub Profile Analyzer</p>
      </div>
      
      <ProfileCard user={data.user} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-blue-600">{data.share.overallScore}</div>
          <div className="text-sm text-gray-500 mt-1">Overall Score</div>
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">{data.share.summary}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <h3 className="font-semibold mb-2">📊 Stats</h3>
          <div className="space-y-2 text-sm">
            <div>📁 {data.share.public_repos} repositories</div>
            <div>👥 {data.share.followers.toLocaleString()} followers</div>
            <div>💻 {data.share.totalCommits.toLocaleString()} commits</div>
            <div>🏆 Top languages: {data.share.topLanguages.join(', ') || 'N/A'}</div>
          </div>
        </div>
      </div>
      
      {data.analyze.scores && <SkillScores scores={data.analyze.scores} />}
      
      <div className="mt-8 text-center">
        <Link to="/" className="text-blue-600 hover:underline">Analyze your own profile →</Link>
      </div>
    </div>
  );
};

export default Share;
