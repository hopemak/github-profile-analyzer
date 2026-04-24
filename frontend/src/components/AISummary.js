import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SkillScores from './SkillScores';
import LanguageSelector from './LanguageSelector';
import API_URL from '../config';

const AISummary = ({ username }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [translating, setTranslating] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [displaySummary, setDisplaySummary] = useState('');

  useEffect(() => {
    if (username) {
      setLoading(true);
      setError('');
      setCurrentLang('en');
      axios.get(`${API_URL}/api/github/analyze/${username}`)
        .then(res => {
          setData(res.data);
          setDisplaySummary(res.data.summary || 'No summary available.');
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError(err.response?.data?.error || 'Could not load AI summary.');
          setLoading(false);
        });
    }
  }, [username]);

  const handleTranslate = async (langCode) => {
    if (!data?.summary) return;
    setTranslating(true);
    try {
      const response = await axios.post(`${API_URL}/api/github/translate`, {
        text: data.summary,
        targetLang: languages.find(l => l.code === langCode)?.name || langCode
      });
      setDisplaySummary(response.data.translated);
      setCurrentLang(langCode);
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setTranslating(false);
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
  ];

  if (loading) return <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 animate-pulse">🤖 AI is analyzing...</div>;
  if (error) return <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 text-red-500">❌ {error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <h3 className="font-bold text-xl flex items-center gap-2">🤖 AI Developer Summary</h3>
          <LanguageSelector onTranslate={handleTranslate} currentLang={currentLang} />
        </div>
        <p className="text-gray-700 dark:text-gray-300 mt-4 leading-relaxed">
          {translating ? 'Translating...' : displaySummary}
        </p>
        {currentLang !== 'en' && (
          <button
            onClick={() => handleTranslate('en')}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            🔄 Show original (English)
          </button>
        )}
      </div>
      {data.scores && <SkillScores scores={data.scores} />}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-xl mb-3">💡 Recommendations</h3>
          <ul className="list-disc list-inside space-y-2">
            {data.recommendations.map((rec, idx) => <li key={idx} className="text-gray-700 dark:text-gray-300">{rec}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AISummary;
