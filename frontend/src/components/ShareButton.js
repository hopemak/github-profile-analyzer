import React, { useState } from 'react';

const ShareButton = ({ username }) => {
  const [copied, setCopied] = useState(false);

  const generateShareUrl = () => {
    if (!username) return;
    
    // Get the current frontend URL (localhost or production)
    const baseUrl = window.location.origin;
    const shareableUrl = `${baseUrl}/share/${username}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={generateShareUrl}
      className="inline-flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all"
    >
      <span>🔗</span>
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
};

export default ShareButton;
