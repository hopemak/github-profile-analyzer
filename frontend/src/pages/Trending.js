import React, { useState, useEffect } from 'react';
import API_URL from '../config';
import ProfileCard from '../components/ProfileCard';
const Trending = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API_URL}/api/github/trending`)
      .then(res => res.json())
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <div className="text-center py-12">Loading trending developers...</div>;
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">🔥 Trending Developers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => <ProfileCard key={user.id} user={user} />)}
      </div>
    </div>
  );
};
export default Trending;
