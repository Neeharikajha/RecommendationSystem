import React from "react";

// Generate deterministic gradient for aesthetic movie cards based on title
const getGradient = (text = "") => {
  const hash = [...text].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 360, 7);
  return `linear-gradient(145deg, hsl(${hash} 65% 24%), hsl(${(hash + 45) % 360} 55% 10%))`;
};

const CineCard = ({ rec, onCardClick }) => {
  const movie = rec?.movie || rec;
  const score = rec?.score;
  const matchPct = score !== undefined ? Math.round(score * 100) : null;
  const explanation = rec?.explanation;

  return (
    <div
      onClick={() => onCardClick && onCardClick(rec)}
      className="group relative h-48 w-40 md:h-56 md:w-48 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg transition-all duration-300 hover:scale-105 hover:z-20 hover:shadow-2xl hover:shadow-red-900/30 flex flex-col justify-between p-3.5 border border-white/10 hover:border-red-600/60"
      style={{ background: getGradient(movie.title) }}
    >
      {/* Top badges */}
      <div className="flex items-center justify-between gap-1 z-10">
        {matchPct !== null ? (
          <span className="rounded bg-emerald-500/90 px-1.5 py-0.5 text-[11px] font-bold text-black tracking-wide shadow">
            {matchPct}% Match
          </span>
        ) : (
          <span />
        )}
        {movie.year && (
          <span className="text-[11px] font-semibold text-gray-300">
            {movie.year}
          </span>
        )}
      </div>

      {/* Center visual emblem */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-1 py-2">
        <h3 className="text-sm md:text-base font-bold text-white line-clamp-3 leading-snug drop-shadow-md group-hover:text-red-300 transition-colors">
          {movie.title}
        </h3>
        {movie.avg_rating && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-400 font-medium">
            <span>★</span>
            <span>{movie.avg_rating}</span>
            <span className="text-gray-400 text-[10px]">({movie.n_ratings})</span>
          </div>
        )}
      </div>

      {/* Bottom meta / why tag */}
      <div className="z-10 space-y-1">
        {explanation?.reason && (
          <p className="text-[10px] text-emerald-300/90 font-medium line-clamp-1 italic">
            💡 {explanation.reason}
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          {movie.genres?.slice(0, 2).map((g) => (
            <span
              key={g}
              className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-gray-300 border border-white/5"
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Subtle overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

export default CineCard;
