import React, { useEffect, useState } from 'react';
import API_URL from '../config';
import ProfileCard from '../components/ProfileCard';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(setUser)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/favorites`, { credentials: 'include' })
      .then(res => res.json())
      .then(async (favs) => {
        setFavorites(favs);
        const userData = await Promise.all(
          favs.map(username => fetch(`${API_URL}/api/github/user/${username}`).then(r => r.json()))
        );
        setUsers(userData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to see your favorites</p>
        <button
          onClick={() => window.location.href = `${API_URL}/api/auth/github`}
          className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg"
        >
          Sign in with GitHub
        </button>
      </div>
    );
  }

  if (loading) return <div className="text-center py-12">Loading favorites...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">⭐ Your Favorite Developers</h1>
      {users.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No favorites yet. Click the star on any profile to add it here.</p>
      ) : (
        <div className="space-y-6">
          {users.map(user => <ProfileCard key={user.login} user={user} />)}
        </div>
      )}
    </div>
  );
};

export default Favorites;
