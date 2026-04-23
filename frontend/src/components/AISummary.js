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
          if (res.data && typeof res.data === 'object') {
            setData(res.data);
          } else {
            setError('Invalid response from server');
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError(err.response?.data?.error || 'Could not load AI summary.');
          setLoading(false);
        });
    }
  }, [username]);

  if (loading) return <div className="bg-white rounded-xl p-4 shadow-md mt-6">🤖 AI is analyzing...</div>;
  if (error) return <div className="bg-white rounded-xl p-4 shadow-md mt-6 text-red-500">❌ {error}</div>;
  if (!data) return null;

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white rounded-xl p-4 shadow-md">
        <h3 className="font-bold text-lg mb-2">🤖 AI Developer Summary</h3>
        <p className="text-gray-700">{data.summary || 'No summary available.'}</p>
      </div>
      {data.scores && <SkillScores scores={data.scores} />}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-md">
          <h3 className="font-bold text-lg mb-2">💡 Recommendations</h3>
          <ul className="list-disc list-inside space-y-1">
            {data.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AISummary;
