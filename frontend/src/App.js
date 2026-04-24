import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import SearchBar from './components/SearchBar';
import ProfileCard from './components/ProfileCard';
import TopLanguages from './components/TopLanguages';
import ActivityHeatmap from './components/ActivityHeatmap';
import AISummary from './components/AISummary';
import AICoach from "./components/AICoach";
import CommitChart from './components/CommitChart';
import Compare from './pages/Compare';
import Trending from './pages/Trending';
import Leaderboard from './pages/Leaderboard';
import { exportToPDF } from './utils/pdfExport';
import API_URL from './config';

function Home() {
  const [user, setUser] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const analysisRef = useRef(null);
  const { dark, setDark } = useTheme();

  const fetchUser = async (username) => {
    if (!username.trim()) return;
    setLoading(true); setError('');
    try {
      const userRes = await axios.get(`${API_URL}/api/github/user/${username}`);
      const langRes = await axios.get(`${API_URL}/api/github/languages/${username}`);
      setUser(userRes.data);
      setLanguages(langRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setUser(null); setLanguages([]);
    } finally { setLoading(false); }
  };

  const handleDownloadPDF = () => {
    if (analysisRef.current) exportToPDF('analysis-content', `${user?.login}_analysis.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📊 GitHub Profile Analyzer</h1>
          <button onClick={() => setDark(!dark)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
        <SearchBar onSearch={fetchUser} />
        {loading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-center text-red-600 py-4">{error}</div>}
        {user && (
          <div id="analysis-content" ref={analysisRef} className="space-y-6 mt-6">
            <ProfileCard user={user} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopLanguages languages={languages} />
              <ActivityHeatmap username={user.login} />
            </div>
            <CommitChart username={user.login} />
            <AISummary username={user.login} />
            <AICoach username={user.login} />
            <div className="flex justify-center">
              <button onClick={handleDownloadPDF} className="px-6 py-2 bg-red-600 text-white rounded-xl">📄 Download PDF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AppWrapper() {
  return (
    <ThemeProvider>
      <Router>
        <nav className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-6 justify-center">
            <Link to="/" className="hover:text-blue-600">Analyzer</Link>
            <Link to="/compare" className="hover:text-blue-600">Compare</Link>
            <Link to="/trending" className="hover:text-blue-600">Trending</Link>
            <Link to="/leaderboard" className="hover:text-blue-600">🏆 Leaderboard</Link>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/compare/:userA/:userB" element={<Compare />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default AppWrapper;
