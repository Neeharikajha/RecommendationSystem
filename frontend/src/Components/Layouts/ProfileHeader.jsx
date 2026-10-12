import React from "react";

const ProfileHeader = ({ profile, activeUserId, users = [], onUserChange, onRandomUser }) => {
  if (!profile) return null;

  const weights = profile.weights || {};
  const topRated = profile.top_rated || [];
  const favouriteGenres = profile.favourite_genres || [];

  return (
    <div className="mx-6 md:mx-12 my-6 rounded-2xl bg-gradient-to-r from-neutral-900/90 via-neutral-900/70 to-neutral-950/90 border border-neutral-800 p-5 md:p-6 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 font-black text-xl">
            {profile.n_ratings ? "👤" : "❄️"}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-bold text-white">
                {activeUserId ? `User #${activeUserId} Profile` : "Custom Taste Profile"}
              </h2>
              <span className="rounded bg-neutral-800 border border-neutral-700 px-2 py-0.5 text-xs text-gray-300 font-medium">
                {profile.n_ratings ? `${profile.n_ratings} ratings` : "New viewer (Cold Start)"}
              </span>
            </div>
            {favouriteGenres.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-500 font-semibold">Favorites:</span>
                {favouriteGenres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-red-950/60 border border-red-800/50 px-2 py-0.5 text-[11px] text-red-300 font-medium"
                  >
                    {g}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        {/* User Switcher Controls */}
        {users.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs text-gray-400 font-medium">Active ML User:</label>
            <select
              value={activeUserId || ""}
              onChange={(e) => onUserChange && onUserChange(Number(e.target.value))}
              className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-red-500"
            >
              {users.slice(0, 50).map((uId) => (
                <option key={uId} value={uId}>
                  User {uId}
                </option>
              ))}
            </select>
            <button
              onClick={onRandomUser}
              className="rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-1.5 text-xs font-medium text-gray-200 transition"
              title="Pick a random benchmark user"
            >
              🎲 Random User
            </button>
          </div>
        )}
      </div>

      {/* Model Blend weights breakdown */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
          <span className="uppercase tracking-wider font-semibold">
            Hybrid Algorithm Blend
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              Collaborative ({Math.round((weights.collaborative || 0) * 100)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Content ({Math.round((weights.content || 0) * 100)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Popularity ({Math.round((weights.popularity || 0) * 100)}%)
            </span>
          </div>
        </div>

        {/* Bar */}
        <div className="h-2.5 w-full rounded-full bg-neutral-800 flex overflow-hidden shadow-inner">
          <div
            className="h-full bg-purple-500 transition-all duration-500"
            style={{ width: `${(weights.collaborative || 0) * 100}%` }}
            title={`Collaborative filtering: ${Math.round((weights.collaborative || 0) * 100)}%`}
          />
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${(weights.content || 0) * 100}%` }}
            title={`Content-based: ${Math.round((weights.content || 0) * 100)}%`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${(weights.popularity || 0) * 100}%` }}
            title={`Popularity prior: ${Math.round((weights.popularity || 0) * 100)}%`}
          />
        </div>
      </div>

      {/* Top Rated by user chips */}
      {topRated.length > 0 && (
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-gray-500 font-semibold whitespace-nowrap">
            Top Rated by User:
          </span>
          {topRated.slice(0, 6).map((item) => (
            <span
              key={item.movie?.movie_id}
              className="rounded-md bg-neutral-800/80 border border-neutral-700/60 px-2 py-1 text-gray-300 whitespace-nowrap flex items-center gap-1.5"
            >
              <span>{item.movie?.title}</span>
              <span className="text-amber-400 font-bold">★{item.rating}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;
