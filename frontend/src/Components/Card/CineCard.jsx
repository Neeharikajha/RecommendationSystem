import React, { useState, useRef } from "react";
import { getMovieImage, getRecommendationTag } from "../../Requests/imageHelper";

const CineCard = ({ rec, index = 0, isFirst = false, isLast = false, onCardClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const movie = rec?.movie || rec;
  const score = rec?.score;
  const matchPct = score !== undefined ? Math.round(score * 100) : null;
  const explanation = rec?.explanation;
  const imageUrl = getMovieImage(movie);

  // Red tag only appears on approximately 1 out of 8 cards pseudo-randomly
  const redTag = getRecommendationTag(rec, index);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 150); // Buttery smooth slight delay like Netflix
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  // Determine horizontal alignment of the expanded card so it stays in viewport
  const getPopoverPositionClasses = () => {
    if (isFirst) {
      return "left-0 -top-16 origin-left";
    }
    if (isLast) {
      return "right-0 -top-16 origin-right";
    }
    return "left-1/2 -translate-x-1/2 -top-16 origin-center";
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onCardClick && onCardClick(rec)}
      style={{ zIndex: isHovered ? 100 : 1 }}
      className={`relative w-full cursor-pointer transition-all duration-300 ease-out select-none ${
        isHovered ? "z-[100]" : "z-[1]"
      }`}
    >
      {/* Base Card: Dimensions and text increased by 8-12% */}
      <div
        className={`relative h-40 md:h-44 w-full overflow-hidden rounded-md bg-[#181818] transition-all duration-300 shadow-md ${
          isHovered ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <img
          src={imageUrl}
          alt={movie.title}
          className="h-full w-full object-cover rounded-md brightness-90"
          loading="lazy"
        />

        {/* Ambient Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Center Title - Increased font size by 10-12% */}
        <div className="absolute inset-0 flex items-center justify-center p-3 text-center pointer-events-none">
          <h3 className="text-lg md:text-xl font-black text-white tracking-wide uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] line-clamp-2 px-2 leading-tight">
            {movie.title}
          </h3>
        </div>

        {/* Red Badge: Only displayed on 1 out of 8 cards */}
        {redTag && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center pointer-events-none">
            <span className="rounded-[3px] bg-[#e50914] px-2.5 py-0.5 text-xs font-black tracking-tight text-white shadow-lg whitespace-nowrap">
              {redTag}
            </span>
          </div>
        )}

        {/* Top-Right Match % badge: Red and White */}
        {matchPct !== null && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <span className="rounded bg-[#e50914] px-2 py-0.5 text-xs font-black text-white shadow-md tracking-wider">
              {matchPct}%
            </span>
          </div>
        )}
      </div>

      {/* Expanded Hover Popover: Increased by > 40% & strictly placed over left and right cards */}
      {isHovered && (
        <div
          className={`absolute ${getPopoverPositionClasses()} z-[100] w-[23rem] sm:w-[25rem] md:w-[27rem] rounded-xl bg-[#181818] shadow-[0_20px_45px_rgba(0,0,0,0.95)] border border-neutral-700/80 overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95 pointer-events-auto`}
        >
          {/* Expanded Preview Image - Sized 40% larger */}
          <div className="relative h-48 md:h-54 w-full overflow-hidden bg-neutral-900">
            <img
              src={imageUrl}
              alt={movie.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-black/30" />

            {/* Title on Expanded Image */}
            <div className="absolute bottom-3 left-4 right-4 text-left">
              <h3 className="text-xl md:text-2xl font-black text-white tracking-wide drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] line-clamp-1">
                {movie.title}
              </h3>
            </div>

            {/* Red Badge on Expanded Image (if applicable) */}
            {redTag && (
              <div className="absolute top-3 left-3 z-10">
                <span className="rounded-[3px] bg-[#e50914] px-2.5 py-0.5 text-xs font-black text-white shadow">
                  {redTag}
                </span>
              </div>
            )}

            {/* Top-Right Red and White Match % in Expanded Image */}
            {matchPct !== null && (
              <div className="absolute top-3 right-3 z-10">
                <span className="rounded bg-[#e50914] px-2 py-0.5 text-xs font-black text-white shadow-md">
                  {matchPct}%
                </span>
              </div>
            )}
          </div>

          {/* Hover Action Strip & Details */}
          <div className="p-4 space-y-3 text-white">
            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCardClick && onCardClick(rec);
                  }}
                  className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-white text-black hover:bg-neutral-200 transition shadow"
                  title="Explore"
                >
                  <span className="text-base font-black ml-0.5">▶</span>
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-neutral-500 bg-neutral-900/80 text-white hover:border-white transition"
                  title="Add to My List"
                >
                  <span className="text-base font-bold">+</span>
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-neutral-500 bg-neutral-900/80 text-white hover:border-white transition"
                  title="Rate"
                >
                  <span className="text-sm">👍</span>
                </button>
              </div>

              {/* Expand chevron button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCardClick && onCardClick(rec);
                }}
                className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-neutral-500 bg-neutral-900/80 text-white hover:border-white transition"
                title="More Info"
              >
                <span className="text-sm font-bold">∨</span>
              </button>
            </div>

            {/* Meta Line: Match % in Red & White · Year · Rating */}
            <div className="flex items-center space-x-2.5 text-xs md:text-sm font-semibold">
              {matchPct !== null && (
                <span className="rounded bg-[#e50914] text-white px-2 py-0.5 text-xs font-black shadow">
                  {matchPct}% Match
                </span>
              )}
              {movie.year && <span className="text-neutral-300 font-bold">{movie.year}</span>}
              {movie.avg_rating && (
                <span className="rounded border border-neutral-600 px-1.5 py-0.5 text-xs text-amber-400 font-bold">
                  ★ {movie.avg_rating}
                </span>
              )}
              <span className="rounded border border-neutral-700 px-1.5 py-0.5 text-[10px] text-neutral-400 uppercase font-bold">
                HD
              </span>
            </div>

            {/* Why This Explanation Snippet */}
            {explanation?.reason && (
              <p className="text-xs md:text-sm text-emerald-300/90 font-medium line-clamp-1 italic">
                💡 {explanation.reason}
              </p>
            )}

            {/* Genres Tag List */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-neutral-300 font-medium">
              {movie.genres?.slice(0, 3).map((g, i) => (
                <span key={g} className="flex items-center">
                  {i > 0 && <span className="mr-1.5 text-neutral-600">•</span>}
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CineCard;
