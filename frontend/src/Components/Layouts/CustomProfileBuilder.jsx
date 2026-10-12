import React, { useState } from "react";
import { searchMovies } from "../../Requests/backendApi";

const CustomProfileBuilder = ({ onApplyProfile, onReset }) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [picked, setPicked] = useState([]); // Array of { movie, rating }

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const movies = await searchMovies(val, 6);
      setSearchResults(movies);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectMovie = (movie) => {
    if (!picked.some((p) => p.movie.movie_id === movie.movie_id)) {
      setPicked([...picked, { movie, rating: 5 }]);
    }
    setQuery("");
    setSearchResults([]);
  };

  const handleUpdateRating = (movieId, newRating) => {
    setPicked(
      picked.map((item) =>
        item.movie.movie_id === movieId ? { ...item, rating: Number(newRating) } : item
      )
    );
  };

  const handleRemoveMovie = (movieId) => {
    setPicked(picked.filter((item) => item.movie.movie_id !== movieId));
  };

  const handleRecommend = () => {
    if (picked.length === 0) return;
    const ratingsPayload = picked.map(({ movie, rating }) => ({
      movie_id: movie.movie_id,
      rating,
    }));
    onApplyProfile(ratingsPayload);
  };

  return (
    <div className="mx-6 md:mx-12 my-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 p-6 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🛠️</span> Build Your Own Taste Profile
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Pick movies you like, adjust star ratings, and CineMatch's hybrid model will re-score recommendations in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecommend}
            disabled={picked.length === 0}
            className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow transition flex items-center gap-1.5"
          >
            <span>✨</span> Generate My Recommendations ({picked.length})
          </button>
          {picked.length > 0 && (
            <button
              onClick={() => {
                setPicked([]);
                onReset && onReset();
              }}
              className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3 py-2 text-xs font-medium text-gray-300 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative mt-4">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search 9,700+ movies to add (e.g. Inception, Pulp Fiction, Toy Story)..."
          className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
        />
        {isSearching && (
          <span className="absolute right-3.5 top-3 text-xs text-gray-400 animate-spin">
            ⏳
          </span>
        )}

        {/* Live Search dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-xl bg-[#1c1c1c] border border-neutral-700 shadow-2xl">
            {searchResults.map((m) => (
              <div
                key={m.movie_id}
                onClick={() => handleSelectMovie(m)}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-neutral-800 cursor-pointer text-sm text-gray-200 border-b border-neutral-800/50 last:border-b-0 transition"
              >
                <div>
                  <span className="font-semibold text-white">{m.title}</span>
                  {m.year && <span className="ml-1 text-xs text-gray-400">({m.year})</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{m.genres?.slice(0, 2).join(", ")}</span>
                  <span className="rounded bg-red-600/30 text-red-400 border border-red-600/40 text-[10px] px-2 py-0.5 font-bold">
                    + Add
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Picked movies shelf */}
      {picked.length > 0 ? (
        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-wrap gap-2.5">
          {picked.map((item) => (
            <div
              key={item.movie.movie_id}
              className="flex items-center gap-2 rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-1.5 shadow"
            >
              <span className="text-xs font-medium text-white max-w-[180px] truncate">
                {item.movie.title}
              </span>
              <div className="flex items-center gap-1 bg-neutral-900 rounded px-1.5 py-0.5 border border-neutral-800">
                <span className="text-amber-400 text-xs">★</span>
                <input
                  type="number"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={item.rating}
                  onChange={(e) => handleUpdateRating(item.movie.movie_id, e.target.value)}
                  className="w-10 bg-transparent text-xs font-bold text-center text-white focus:outline-none"
                />
              </div>
              <button
                onClick={() => handleRemoveMovie(item.movie.movie_id)}
                className="text-gray-400 hover:text-red-400 text-sm ml-1 transition"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-gray-500 italic">
          Tip: Add 2-3 movies to unlock personalized collaborative and content-based recommendations!
        </p>
      )}
    </div>
  );
};

export default CustomProfileBuilder;
