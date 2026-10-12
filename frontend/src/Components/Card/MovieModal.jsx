import React, { useState } from "react";
import CineCard from "./CineCard";
import { getSimilarMovies } from "../../Requests/backendApi";
import { getMovieImage, getRecommendationTag } from "../../Requests/imageHelper";

const MovieModal = ({ rec, onClose }) => {
  const [similar, setSimilar] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!rec) return null;

  const movie = rec.movie || rec;
  const why = rec.explanation || {};
  const signals = why.signals || {};
  const score = rec.score !== undefined ? Math.round(rec.score * 100) : null;
  const imageUrl = getMovieImage(movie);
  const redTag = getRecommendationTag(rec);

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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      {/* Big Floating Dialog Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-2xl bg-[#181818] border border-neutral-700/80 text-white shadow-[0_20px_50px_rgba(0,0,0,0.9)] my-8 overflow-hidden max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95"
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 h-10 w-10 rounded-full bg-[#181818]/80 hover:bg-[#181818] border border-white/20 flex items-center justify-center text-gray-200 hover:text-white transition text-lg"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Hero Backdrop Banner Image */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden bg-neutral-900">
          <img
            src={imageUrl}
            alt={movie.title}
            className="h-full w-full object-cover brightness-95"
          />

          {/* Cinematic Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

          {/* Hero Content on Image */}
          <div className="absolute bottom-6 left-6 right-6 space-y-3 z-20">
            {/* Red Badge */}
            <span className="rounded bg-[#e50914] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md inline-block">
              {redTag}
            </span>

            <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wide">
              {movie.title}
            </h1>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 rounded bg-white px-6 py-2 font-bold text-black hover:bg-neutral-200 transition text-sm md:text-base shadow-lg"
              >
                <span>{isPlaying ? "⏸" : "▶"}</span>
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>
              <button
                onClick={handleFetchSimilar}
                disabled={loadingSimilar}
                className="flex items-center gap-2 rounded bg-[#e50914] hover:bg-red-700 disabled:opacity-50 px-5 py-2 font-bold text-white transition text-sm md:text-base shadow-lg"
              >
                <span>✨</span>
                <span>{loadingSimilar ? "Matching..." : "More Like This"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body Info */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Metadata Row */}
          <div className="flex items-center gap-3 flex-wrap text-sm font-semibold">
            {score !== null && (
              <span className="rounded bg-[#e50914] text-white px-2.5 py-1 text-xs font-black shadow-md tracking-wide">
                {score}% Match for You
              </span>
            )}
            {movie.year && <span className="text-neutral-400">{movie.year}</span>}
            <span className="rounded border border-neutral-600 px-1.5 py-0.5 text-xs text-neutral-300">
              HD
            </span>
            {movie.avg_rating && (
              <span className="text-amber-400 flex items-center gap-1">
                ★ {movie.avg_rating} <span className="text-xs text-neutral-400">({movie.n_ratings} ratings)</span>
              </span>
            )}
          </div>

          {/* Genres Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400 font-medium">Genres:</span>
            {movie.genres?.map((g) => (
              <span
                key={g}
                className="rounded-full bg-neutral-800 border border-neutral-700 px-2.5 py-0.5 text-xs font-semibold text-neutral-200"
              >
                {g}
              </span>
            ))}
          </div>

          {/* CineMatch ML Why This section */}
          <div className="rounded-xl bg-neutral-900/90 border border-neutral-800 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg">
                💡
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
                  CineMatch Recommendation Explanation
                </h4>
                <p className="text-sm text-gray-200 mt-1 leading-relaxed">
                  {why.reason || "Matched via multi-modal hybrid score combining viewing history and film traits."}
                </p>
                {why.shared_genres?.length > 0 && (
                  <p className="text-xs text-neutral-400 mt-1">
                    Shared genre affinities: <strong className="text-neutral-200">{why.shared_genres.join(", ")}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Model Signal Weight Bars */}
            {Object.keys(signals).length > 0 && (
              <div className="pt-3 border-t border-neutral-800 space-y-2.5">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Model Confidence Signals:
                </p>
                {Object.entries(signals).map(([name, val]) => (
                  <div key={name} className="flex items-center gap-3 text-xs">
                    <span className="w-28 capitalize font-medium text-neutral-300">
                      {name === "collaborative"
                        ? "👥 Collaborative"
                        : name === "content"
                        ? "🎬 Content / Genre"
                        : "🔥 Popular Acclaim"}
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
                    <span className="w-12 text-right text-gray-300 font-mono font-bold">
                      {Math.round(val * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* More Like This Strip */}
          {similar.length > 0 && (
            <div className="pt-4 border-t border-neutral-800 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🍿</span> More Like "{movie.title}":
              </h3>
              <div className="flex space-x-3 overflow-x-auto pb-4 no-scrollbar">
                {similar.map((sRec) => (
                  <CineCard
                    key={sRec.movie.movie_id}
                    rec={sRec}
                    onCardClick={(clicked) => {
                      setSimilar([]);
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
    </div>
  );
};

export default MovieModal;
