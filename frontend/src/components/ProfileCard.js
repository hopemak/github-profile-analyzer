import React from 'react';

const ProfileCard = ({ user }) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden border border-white/20 transition-all duration-300 hover:shadow-xl">
      <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
          <img 
            src={user.avatar_url} 
            alt={user.login} 
            className="w-20 h-20 rounded-full border-2 border-white/30 shadow-md"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
            <p className="text-white/60 font-mono text-sm">@{user.login}</p>
            {user.bio && <p className="mt-2 text-white/70 text-sm line-clamp-2">{user.bio}</p>}
          </div>
        </div>
      </div>
      <div className="px-6 py-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-2xl font-bold text-white">{user.public_repos}</div>
          <div className="text-xs text-white/50 uppercase tracking-wide">Repositories</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-2xl font-bold text-white">{user.followers}</div>
          <div className="text-xs text-white/50 uppercase tracking-wide">Followers</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-2xl font-bold text-white">{user.following}</div>
          <div className="text-xs text-white/50 uppercase tracking-wide">Following</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
