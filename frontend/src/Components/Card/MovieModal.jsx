import React, { useState } from "react";
import CineCard from "../Card/CineCard";
import { getSimilarMovies } from "../../Requests/backendApi";

const MovieModal = ({ rec, onClose }) => {
  const [similar, setSimilar] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  if (!rec) return null;

  const movie = rec.movie || rec;
  const why = rec.explanation || {};
  const signals = why.signals || {};
  const score = rec.score !== undefined ? Math.round(rec.score * 100) : null;

  const handleFetchSimilar = async () => {
    try {
      setLoadingSimilar(true);
      const data = await getSimilarMovies(movie.movie_id, 8);
      setSimilar(data);
    } catch (err) {
      console.error("Failed to fetch similar movies", err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#181818] border border-neutral-700/80 p-6 md:p-8 text-white shadow-2xl my-8 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-gray-300 hover:text-white transition text-lg"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Title Header */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              {movie.title}
            </h2>
            {score !== null && (
              <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-bold">
                {score}% Match
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {movie.year && `${movie.year} · `}
            {movie.genres?.join(" · ")}
            {movie.avg_rating && ` · ★ ${movie.avg_rating} (${movie.n_ratings} ratings)`}
          </p>
        </div>

        {/* Explanation Section: Why this? */}
        <div className="mt-6 rounded-xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-sm font-semibold text-emerald-400">
                Why CineMatch recommended this:
              </p>
              <p className="text-sm text-gray-200 mt-0.5">
                {why.reason || "High ranking across collaborative & content signals."}
                {why.shared_genres?.length > 0 && (
                  <span className="text-gray-400 block text-xs mt-1">
                    Shared genres: {why.shared_genres.join(", ")}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Model Signals Bar Breakdown */}
          {Object.keys(signals).length > 0 && (
            <div className="pt-2 border-t border-neutral-800/80 space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Recommendation Signals:
              </p>
              {Object.entries(signals).map(([name, val]) => (
                <div key={name} className="flex items-center gap-3 text-xs">
                  <span className="w-24 capitalize text-gray-300 font-medium">
                    {name}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        name === "collaborative"
                          ? "bg-purple-500"
                          : name === "content"
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(1, val)) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-gray-400 font-mono">
                    {Math.round(val * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions: More Like This */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleFetchSimilar}
            disabled={loadingSimilar}
            className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition flex items-center gap-2"
          >
            {loadingSimilar ? "Finding Similar Titles..." : "✨ More Like This"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-5 py-2.5 text-sm font-medium text-gray-300 transition"
          >
            Close
          </button>
        </div>

        {/* Similar Movies Carousel */}
        {similar.length > 0 && (
          <div className="mt-6 pt-6 border-t border-neutral-800 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🍿</span> More Like "{movie.title}":
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {similar.map((sRec) => (
                <CineCard
                  key={sRec.movie.movie_id}
                  rec={sRec}
                  onCardClick={(clicked) => {
                    setSimilar([]);
                    // Switch current modal to clicked rec
                    rec.movie = clicked.movie;
                    rec.score = clicked.score;
                    rec.explanation = clicked.explanation;
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieModal;
