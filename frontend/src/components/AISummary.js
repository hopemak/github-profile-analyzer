import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SkillScores from './SkillScores';
import API_URL from '../config';

const AISummary = ({ username }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (username) {
      setLoading(true);
      setError('');
      axios.get(`${API_URL}/api/github/analyze/${username}`)
        .then(res => {
          setData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError(err.response?.data?.error || 'Could not load AI summary.');
          setLoading(false);
        });
    }
  }, [username]);

  if (loading) return <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 animate-pulse">🤖 AI is analyzing...</div>;
  if (error) return <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-5 text-red-200">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <h3 className="font-bold text-xl text-white mb-3">🤖 AI Developer Summary</h3>
        <p className="text-white/80 leading-relaxed">{data.summary || 'No summary available.'}</p>
      </div>
      {data.scores && <SkillScores scores={data.scores} />}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="font-bold text-xl text-white mb-3">💡 Recommendations</h3>
          <ul className="list-disc list-inside space-y-2">
            {data.recommendations.map((rec, idx) => <li key={idx} className="text-white/80">{rec}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AISummary;
