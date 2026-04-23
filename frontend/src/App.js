import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import ProfileCard from './components/ProfileCard';
import TopLanguages from './components/TopLanguages';
import ActivityHeatmap from './components/ActivityHeatmap';
import AISummary from './components/AISummary';
import Compare from './pages/Compare';
import { exportToPDF } from './utils/pdfExport';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

function Home() {
  const [user, setUser] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const analysisRef = useRef(null);

  const fetchUser = async (username) => {
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    try {
      const userRes = await axios.get(`${API_URL}/api/github/user/${username}`);
      const langRes = await axios.get(`${API_URL}/api/github/languages/${username}`);
      setUser(userRes.data);
      setLanguages(langRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Something went wrong');
      setUser(null);
      setLanguages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (analysisRef.current) {
      exportToPDF('analysis-content', `${user?.login}_github_analysis.pdf`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm mb-6">
            <span className="text-2xl">📊</span>
            <span className="text-sm font-medium text-gray-600">Hope Mak AI Tool</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            GitHub Profile Analyzer
          </h1>
          <p className="mt-3 text-gray-500 max-w-md mx-auto">
            Unlock insights, skill scores, and AI-powered recommendations
          </p>
        </div>

        <SearchBar onSearch={fetchUser} />

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        {user && (
          <div id="analysis-content" ref={analysisRef} className="space-y-6 mt-8">
            <ProfileCard user={user} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopLanguages languages={languages} />
              <ActivityHeatmap username={user.login} />
            </div>
            <AISummary username={user.login} />
            <div className="flex justify-center pt-4">
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
              >
                📄 Download PDF Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center gap-8 py-4">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Analyzer</Link>
            <Link to="/compare" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Compare Developers</Link>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/compare/:userA/:userB" element={<Compare />} />
      </Routes>
    </Router>
  );
}

export default App;
