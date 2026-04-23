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
    if (!a || !b) return;
    setLoading(true);
    setError('');
    try {
      const url = `${API_URL}/api/github/compare/${a}/${b}`;
      console.log('Fetching:', url);
      const res = await axios.get(url);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Comparison failed');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-10">
        <p>Error: {error}</p>
        <button onClick={() => fetchCompare(userA, userB)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center text-white mb-8">👥 Compare Two Developers</h1>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center my-8">
          <input
            type="text"
            placeholder="First GitHub username (e.g., octocat)"
            value={userA}
            onChange={(e) => setUserA(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-white text-2xl self-center">vs</span>
          <input
            type="text"
            placeholder="Second GitHub username"
            value={userB}
            onChange={(e) => setUserB(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
            Compare
          </button>
        </form>
      </div>
    );
  }

  const userAData = data.userA || {};
  const userBData = data.userB || {};

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center text-white mb-8">👥 Compare: {userA} vs {userB}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <input
          type="text"
          placeholder="First GitHub username"
          value={userA}
          onChange={(e) => setUserA(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-white text-2xl self-center">vs</span>
        <input
          type="text"
          placeholder="Second GitHub username"
          value={userB}
          onChange={(e) => setUserB(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
          Compare
        </button>
      </form>

      <div id="compare-content" ref={compareRef}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <ProfileCard user={userAData} />
            {userAData.scores && <SkillScores scores={userAData.scores} />}
            {userAData.recommendations && userAData.recommendations.length > 0 && (
              <div className="bg-gray-800 rounded-2xl p-5 shadow-md mt-4">
                <h3 className="font-bold text-lg text-white mb-2">💡 Recommendations for {userAData.login || userA}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  {userAData.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
                </ul>
              </div>
            )}
          </div>
          <div>
            <ProfileCard user={userBData} />
            {userBData.scores && <SkillScores scores={userBData.scores} />}
            {userBData.recommendations && userBData.recommendations.length > 0 && (
              <div className="bg-gray-800 rounded-2xl p-5 shadow-md mt-4">
                <h3 className="font-bold text-lg text-white mb-2">💡 Recommendations for {userBData.login || userB}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  {userBData.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
        {data.comparisonSummary && (
          <div className="mt-8 bg-gray-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-2xl font-bold mb-3 text-white">🤖 AI Comparison Summary</h2>
            <p className="text-gray-300 text-lg">{data.comparisonSummary}</p>
          </div>
        )}
        <div className="text-center mt-6">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            📄 Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Compare;
