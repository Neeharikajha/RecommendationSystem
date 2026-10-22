import React, { useState, useRef } from "react";
import { searchMovies } from "../../Requests/backendApi";

const CustomProfileBuilder = ({ onApplyProfile, onReset }) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [picked, setPicked] = useState([]); // Array of { movie, rating }
  const searchRef = useRef(null);

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
      const nextPicked = [...picked, { movie, rating: 5 }];
      setPicked(nextPicked);
      // Trigger real-time recommendations update immediately
      const ratingsPayload = nextPicked.map(({ movie, rating }) => ({
        movie_id: movie.movie_id,
        rating,
      }));
      onApplyProfile(ratingsPayload);
    }
    setQuery("");
    setSearchResults([]);
  };

  const handleUpdateRating = (movieId, newRating) => {
    const updated = picked.map((item) =>
      item.movie.movie_id === movieId ? { ...item, rating: Number(newRating) } : item
    );
    setPicked(updated);
    const ratingsPayload = updated.map(({ movie, rating }) => ({
      movie_id: movie.movie_id,
      rating,
    }));
    onApplyProfile(ratingsPayload);
  };

  const handleRemoveMovie = (movieId) => {
    const remaining = picked.filter((item) => item.movie.movie_id !== movieId);
    setPicked(remaining);
    const ratingsPayload = remaining.map(({ movie, rating }) => ({
      movie_id: movie.movie_id,
      rating,
    }));
    onApplyProfile(ratingsPayload);
  };

  const handleRecommend = () => {
    const ratingsPayload = picked.map(({ movie, rating }) => ({
      movie_id: movie.movie_id,
      rating,
    }));
    onApplyProfile(ratingsPayload);
  };

  // Truncate title to max 10 characters
  const truncateTitle = (title) => {
    if (!title) return "";
    return title.length > 10 ? title.substring(0, 10) + "…" : title;
  };

  return (
    <div className="relative z-30 mx-6 md:mx-12 my-6 rounded-2xl bg-[#141414] border border-neutral-800 p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Build Your Own Taste Profile
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Pick movies you like, adjust ratings, and the hybrid model will re-score recommendations in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecommend}
            disabled={picked.length === 0}
            className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 px-5 py-2.5 text-sm md:text-base font-semibold text-white shadow transition flex items-center gap-1.5"
          >
            Generate My Recommendations ({picked.length})
          </button>
          {picked.length > 0 && (
            <button
              onClick={() => {
                setPicked([]);
                onReset && onReset();
              }}
              className="rounded-lg bg-neutral-700 hover:bg-neutral-600 px-5 py-2.5 text-sm font-semibold text-gray-200 border border-neutral-600 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Search Input Bar — relative container with high z-index for dropdown */}
      <div className="relative mt-4 z-50" ref={searchRef}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search 9,700+ movies to add (e.g. Inception, Pulp Fiction, Toy Story)..."
          className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
        />
        {isSearching && (
          <span className="absolute right-3.5 top-3.5 text-xs text-gray-400">
            Searching...
          </span>
        )}

        {/* Live Search dropdown — z-[9999] so it floats above cards with solid 100% opaque bg */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[9999] mt-2 max-h-72 overflow-y-auto rounded-xl bg-[#141414] border-2 border-neutral-700 shadow-[0_25px_60px_rgba(0,0,0,0.98)]">
            {searchResults.map((m) => (
              <div
                key={m.movie_id}
                onClick={() => handleSelectMovie(m)}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-800 cursor-pointer text-sm text-gray-200 border-b border-neutral-800 last:border-b-0 transition"
              >
                <div>
                  <span className="font-semibold text-white">{m.title}</span>
                  {m.year && <span className="ml-1 text-xs text-gray-400">({m.year})</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{m.genres?.slice(0, 2).join(", ")}</span>
                  <span className="rounded bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1 font-bold shadow transition">
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
              className="flex items-center gap-2 rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 shadow"
            >
              <span className="text-sm font-semibold text-white" title={item.movie.title}>
                {truncateTitle(item.movie.title)}
              </span>
              <div className="flex items-center gap-1 bg-neutral-900 rounded px-2 py-1 border border-neutral-700">
                <span className="text-amber-400 text-xs font-bold">Rating:</span>
                <input
                  type="number"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={item.rating}
                  onChange={(e) => handleUpdateRating(item.movie.movie_id, e.target.value)}
                  className="w-10 bg-transparent text-sm font-bold text-center text-white focus:outline-none"
                />
              </div>
              <button
                onClick={() => handleRemoveMovie(item.movie.movie_id)}
                className="text-gray-400 hover:text-red-400 text-base ml-1 transition font-bold"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-2 border-t border-neutral-800 pt-3">
          <p className="text-xs text-neutral-400">
            Quick start — click any title you like to instantly generate personalized recommendations:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { movie_id: 296, title: "Pulp Fiction", genres: ["Crime", "Drama"] },
              { movie_id: 2571, title: "The Matrix", genres: ["Action", "Sci-Fi"] },
              { movie_id: 318, title: "The Shawshank Redemption", genres: ["Drama"] },
              { movie_id: 1, title: "Toy Story", genres: ["Animation", "Children"] },
              { movie_id: 58559, title: "The Dark Knight", genres: ["Action", "Crime"] },
              { movie_id: 79132, title: "Inception", genres: ["Action", "Sci-Fi"] },
            ].map((starter) => (
              <button
                key={starter.movie_id}
                onClick={() => handleSelectMovie(starter)}
                className="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 text-xs font-medium text-gray-300 hover:border-red-500 hover:bg-neutral-800 hover:text-white transition shadow-sm"
              >
                + {starter.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomProfileBuilder;
