import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ProfileCard from '../components/ProfileCard';
import SkillScores from '../components/SkillScores';
import API_URL from '../config';
import { exportToPDF } from '../utils/pdfExport';

const Compare = () => {
  const { userA: paramUserA, userB: paramUserB } = useParams();
  const [userA, setUserA] = useState(paramUserA || '');
  const [userB, setUserB] = useState(paramUserB || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const compareRef = useRef(null);

  const fetchCompare = async (a, b) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/api/github/compare/${a}/${b}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramUserA && paramUserB) {
      setUserA(paramUserA);
      setUserB(paramUserB);
      fetchCompare(paramUserA, paramUserB);
    }
  }, [paramUserA, paramUserB]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userA.trim() && userB.trim()) {
      fetchCompare(userA, userB);
    }
  };

  const handleDownloadPDF = () => {
    if (compareRef.current) {
      exportToPDF('compare-content', `compare_${userA}_vs_${userB}.pdf`);
    }
  };

  if (loading) return <div className="text-center py-8">Loading comparison...</div>;
  if (error) return <div className="text-center text-red-600 py-4">{error}</div>;
  if (!data) return null;

  const userAData = data.userA || {};
  const userBData = data.userB || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center text-white mb-8">👥 Compare Two Developers</h1>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <input
            type="text"
            placeholder="First GitHub username"
            value={userA}
            onChange={(e) => setUserA(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-2xl self-center text-white/70">vs</span>
          <input
            type="text"
            placeholder="Second GitHub username"
            value={userB}
            onChange={(e) => setUserB(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition">
            Compare
          </button>
        </form>

        <div id="compare-content" ref={compareRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <ProfileCard user={userAData} />
              {userAData.scores && <SkillScores scores={userAData.scores} />}
              {userAData.recommendations && userAData.recommendations.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mt-4 border border-white/20">
                  <h3 className="font-semibold text-lg text-white mb-2">💡 Recommendations for {userAData.login || userA}</h3>
                  <ul className="list-disc list-inside space-y-1 text-white/80">
                    {userAData.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <ProfileCard user={userBData} />
              {userBData.scores && <SkillScores scores={userBData.scores} />}
              {userBData.recommendations && userBData.recommendations.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mt-4 border border-white/20">
                  <h3 className="font-semibold text-lg text-white mb-2">💡 Recommendations for {userBData.login || userB}</h3>
                  <ul className="list-disc list-inside space-y-1 text-white/80">
                    {userBData.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
          {data.comparisonSummary && (
            <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold mb-3 text-white">🤖 AI Comparison Summary</h2>
              <p className="text-white/80 text-lg">{data.comparisonSummary}</p>
            </div>
          )}
          <div className="text-center mt-6">
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition"
            >
              📄 Download PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compare;
