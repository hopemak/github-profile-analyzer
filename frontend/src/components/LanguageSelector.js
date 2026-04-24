import React, { useState } from 'react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

const LanguageSelector = ({ onTranslate, currentLang }) => {
  const [selectedLang, setSelectedLang] = useState(currentLang || 'en');
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async (langCode) => {
    setSelectedLang(langCode);
    setTranslating(true);
    await onTranslate(langCode);
    setTranslating(false);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => handleTranslate(lang.code)}
          disabled={translating}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
            selectedLang === lang.code
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
