import React, { useState } from "react";
import CineCard from "./CineCard";
import { getSimilarMovies } from "../../Requests/backendApi";
import {
  getMovieImage,
  getRecommendationTag,
  handleImageError,
} from "../../Requests/imageHelper";

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
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
    >
      {/* Big Floating Dialog Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar animate-in zoom-in-95 relative my-8 max-h-[92vh] w-full max-w-3xl overflow-hidden overflow-y-auto rounded-2xl border border-neutral-700/80 bg-[#181818] text-white shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#181818]/80 text-lg text-gray-200 transition hover:bg-[#181818] hover:text-white"
          aria-label="Close"
        >
          x
        </button>

        {/* Hero Backdrop Banner Image */}
        <div className="relative h-64 w-full overflow-hidden bg-neutral-900 md:h-80">
          <img
            src={imageUrl}
            alt={movie.title}
            className="h-full w-full object-cover brightness-95"
            onError={handleImageError}
          />

          {/* Cinematic Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

          {/* Hero Content on Image */}
          <div className="absolute bottom-6 left-6 right-6 z-20 space-y-3">
            {/* Red Badge */}
            <span className="inline-block rounded bg-[#e50914] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
              {redTag}
            </span>

            <h1 className="text-2xl font-black tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] md:text-4xl">
              {movie.title}
            </h1>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 rounded bg-white px-6 py-2 text-sm font-bold text-black shadow-lg transition hover:bg-neutral-200 md:text-base"
              >
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>
              <button
                onClick={handleFetchSimilar}
                disabled={loadingSimilar}
                className="flex items-center gap-2 rounded bg-[#e50914] px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 disabled:opacity-50 md:text-base"
              >
                <span>{loadingSimilar ? "Matching..." : "More Like This"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body Info */}
        <div className="space-y-6 p-6 md:p-8">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            {score !== null && (
              <span className="rounded bg-[#e50914] px-2.5 py-1 text-xs font-black tracking-wide text-white shadow-md">
                {score}% Match for You
              </span>
            )}
            {movie.year && (
              <span className="text-neutral-400">{movie.year}</span>
            )}
            <span className="rounded border border-neutral-600 px-1.5 py-0.5 text-xs text-neutral-300">
              HD
            </span>
            {movie.avg_rating && (
              <span className="flex items-center gap-1 text-amber-400">
                Rating {movie.avg_rating}{" "}
                <span className="text-xs text-neutral-400">
                  ({movie.n_ratings} ratings)
                </span>
              </span>
            )}
          </div>

          {/* Genres Chips */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-semibold text-neutral-300 md:text-base">
              Genres:
            </span>
            {movie.genres?.map((g) => (
              <span
                key={g}
                className="rounded-full border border-neutral-700 bg-neutral-800 px-3.5 py-1 text-sm font-semibold text-neutral-100 shadow-sm"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Recommendation Explanation section */}
          <div className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/90 p-5">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-bold uppercase tracking-wide text-emerald-400 md:text-base">
                  Recommendation Details
                </h4>
                <p className="mt-1.5 text-base font-medium leading-relaxed text-gray-100 md:text-lg">
                  {why.reason ||
                    "Matched via multi-modal hybrid score combining viewing history and film traits."}
                </p>
                {why.shared_genres?.length > 0 && (
                  <p className="mt-2 text-base font-medium text-neutral-300">
                    Shared genre affinities:{" "}
                    <strong className="font-bold text-white">
                      {why.shared_genres.join(", ")}
                    </strong>
                  </p>
                )}
              </div>
            </div>

            {/* Model Signal Weight Bars */}
            {Object.keys(signals).length > 0 && (
              <div className="space-y-3.5 border-t border-neutral-800 pt-4">
                <p className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                  Model Confidence Signals:
                </p>
                {Object.entries(signals).map(([name, val]) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 text-sm md:text-base"
                  >
                    <span className="w-36 font-medium capitalize text-neutral-200 md:w-40">
                      {name === "collaborative"
                        ? "Collaborative"
                        : name === "content"
                        ? "Content / Genre"
                        : "Popular Acclaim"}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          name === "collaborative"
                            ? "bg-purple-500"
                            : name === "content"
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        }`}
                        style={{
                          width: `${Math.max(0, Math.min(1, val)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-14 text-right font-mono text-sm font-bold text-white md:text-base">
                      {Math.round(val * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* More Like This Strip */}
          {similar.length > 0 && (
            <div className="space-y-3 border-t border-neutral-800 pt-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-white">
                More Like "{movie.title}":
              </h3>
              <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 md:grid-cols-4">
                {similar.map((sRec, idx) => (
                  <div key={sRec.movie.movie_id} className="w-full">
                    <CineCard
                      rec={sRec}
                      index={idx}
                      isFirst={idx === 0}
                      isLast={idx === similar.length - 1}
                      onCardClick={(clicked) => {
                        setSimilar([]);
                        rec.movie = clicked.movie;
                        rec.score = clicked.score;
                        rec.explanation = clicked.explanation;
                      }}
                    />
                  </div>
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
