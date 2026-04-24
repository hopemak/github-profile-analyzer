import React, { useState, useEffect } from 'react';
import API_URL from '../config';

const FavoriteButton = ({ username }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user && username) {
      fetch(`${API_URL}/api/favorites`, { credentials: 'include' })
        .then(res => res.json())
        .then(favs => setIsFavorite(favs.includes(username)))
        .catch(() => {});
    }
  }, [user, username]);

  const toggleFavorite = async () => {
    if (!user) {
      window.location.href = `${API_URL}/api/auth/github`;
      return;
    }
    setLoading(true);
    const method = isFavorite ? 'DELETE' : 'POST';
    await fetch(`${API_URL}/api/favorites/${username}`, { method, credentials: 'include' });
    setIsFavorite(!isFavorite);
    setLoading(false);
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`text-xl transition-all ${isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
    >
      {isFavorite ? '⭐' : '☆'}
    </button>
  );
};

export default FavoriteButton;
