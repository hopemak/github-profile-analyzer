import React, { useEffect, useState } from 'react';
import API_URL from '../../config';

const AuthButton = ({ onLogin }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(setUser)
      .catch(() => {});
  }, []);

  const handleLogin = () => {
    window.location.href = `${API_URL}/api/auth/github`;
  };

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    setUser(null);
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full" />
        <span className="text-sm font-medium">{user.username}</span>
        <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">Logout</button>
      </div>
    );
  }
  return (
    <button onClick={handleLogin} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition">
      🔑 Sign in with GitHub
    </button>
  );
};

export default AuthButton;
