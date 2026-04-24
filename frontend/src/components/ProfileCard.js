import React from 'react';
import ShareButton from './ShareButton';

const ProfileCard = ({ user }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
          <img 
            src={user.avatar_url} 
            alt={user.login} 
            className="w-20 h-20 rounded-full border-4 border-white shadow-md"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <ShareButton username={user.login} />
            </div>
            <p className="text-gray-500 font-mono text-sm">@{user.login}</p>
            {user.bio && <p className="mt-2 text-gray-600 text-sm line-clamp-2">{user.bio}</p>}
          </div>
        </div>
      </div>
      <div className="px-6 py-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-gray-900">{user.public_repos}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Repositories</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-gray-900">{user.followers}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Followers</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-gray-900">{user.following}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Following</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
