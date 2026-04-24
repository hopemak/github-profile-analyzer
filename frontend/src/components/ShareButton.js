import React, { useState } from 'react';
import API_URL from '../config';

const ShareButton = ({ username }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const generateShareUrl = async () => {
    if (!username) return;
    
    // Get the current frontend URL
    const baseUrl = window.location.origin;
    const shareableUrl = `${baseUrl}/share/${username}`;
    setShareUrl(shareableUrl);
    
    // Fetch analysis data to pre-fill social meta tags (handled by backend)
    try {
      await fetch(`${API_URL}/api/github/share/${username}`);
    } catch (err) {
      console.error('Error prefetching share data:', err);
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={generateShareUrl}
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all ml-2"
    >
      <span>🔗</span>
      {copied ? 'Copied!' : 'Share Analysis'}
    </button>
  );
};

export default ShareButton;
