import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  getMovieImage,
  getRecommendationTag,
  handleImageError,
} from "../../Requests/imageHelper";
import thumbsUp from "../../assets/thumbs-up.svg";

// Global image cache to prevent reloading
const imageCache = new Map();

const CineCard = ({
  rec,
  index = 0,
  isFirst = false,
  isLast = false,
  onCardClick,
  onLike,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const imgRef = useRef(null);

  const movie = rec?.movie || rec;
  const score = rec?.score;
  const matchPct = score !== undefined ? Math.round(score * 100) : null;
  const explanation = rec?.explanation;
  const imageUrl = useMemo(() => getMovieImage(movie), [movie]);

  // Red tag only appears on approximately 1 out of 8 cards pseudo-randomly
  const redTag = getRecommendationTag(rec, index);

  // Preload image and cache it
  useEffect(() => {
    if (!imageUrl) return;

    // If already in cache, mark as loaded
    if (imageCache.has(imageUrl)) {
      setImageLoaded(true);
      return;
    }

    // Preload the image
    const img = new Image();
    img.onload = () => {
      imageCache.set(imageUrl, true);
      setImageLoaded(true);
    };
    img.onerror = () => {
      imageCache.set(imageUrl, false);
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(false);
  };

  // Determine horizontal alignment of the expanded card so it stays in viewport
  const getPopoverPositionClasses = () => {
    if (isFirst) {
      return "left-0 -top-8 origin-left";
    }
    if (isLast) {
      return "right-0 -top-8 origin-right";
    }
    return "left-1/2 -translate-x-1/2 -top-8 origin-center";
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onCardClick && onCardClick(rec)}
      style={{ zIndex: isHovered ? 100 : 1 }}
      className={`relative w-full cursor-pointer select-none transition-all duration-300 ease-out ${
        isHovered ? "z-[100]" : "z-[1]"
      }`}
    >
      {/* Base Card */}
      <div
        className="relative h-40 w-full overflow-hidden rounded-md bg-[#181818] shadow-md transition-all duration-300 md:h-44"
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt={movie.title}
          className="h-full w-full rounded-md object-cover brightness-90"
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          onLoad={() => {
            imageCache.set(imageUrl, true);
            setImageLoaded(true);
          }}
        />

        {/* Ambient Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Center Title */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3 text-center">
          <h3 className="line-clamp-2 px-2 text-lg font-black uppercase leading-tight tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] md:text-xl">
            {movie.title}
          </h3>
        </div>

        {/* Red Badge: Only displayed on 1 out of 8 cards */}
        {redTag && (
          <div className="pointer-events-none absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center">
            <span className="whitespace-nowrap rounded-[3px] bg-[#e50914] px-2.5 py-0.5 text-xs font-black tracking-tight text-white shadow-lg">
              {redTag}
            </span>
          </div>
        )}

        {/* Top-Right Match % badge: Red and White */}
        {matchPct !== null && (
          <div className="pointer-events-none absolute right-2.5 top-2.5 z-10">
            <span className="rounded bg-[#e50914] px-2 py-0.5 text-xs font-black tracking-wider text-white shadow-md">
              {matchPct}%
            </span>
          </div>
        )}
      </div>

      {/* Expanded Hover Popover */}
      {isHovered && (
        <div
          className={`absolute ${getPopoverPositionClasses()} animate-in fade-in zoom-in-95 pointer-events-auto z-[100] w-[20rem] sm:w-[22rem] md:w-[24rem] transform overflow-hidden rounded-xl border border-neutral-700/80 bg-[#181818] shadow-[0_25px_50px_rgba(0,0,0,0.98)] transition-all duration-200`}
        >
          {/* Expanded Preview Image - Sized 40% larger */}
          <div className="md:h-54 relative h-48 w-full overflow-hidden bg-neutral-900">
            <img
              src={imageUrl}
              alt={movie.title}
              className="h-full w-full object-cover"
              decoding="async"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-black/30" />

            {/* Title on Expanded Image */}
            <div className="absolute bottom-3 left-4 right-4 text-left">
              <h3 className="line-clamp-1 text-xl font-black tracking-wide text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] md:text-2xl">
                {movie.title}
              </h3>
            </div>

            {/* Red Badge on Expanded Image (if applicable) */}
            {redTag && (
              <div className="absolute left-3 top-3 z-10">
                <span className="rounded-[3px] bg-[#e50914] px-2.5 py-0.5 text-xs font-black text-white shadow">
                  {redTag}
                </span>
              </div>
            )}

            {/* Top-Right Red and White Match % in Expanded Image */}
            {matchPct !== null && (
              <div className="absolute right-3 top-3 z-10">
                <span className="rounded bg-[#e50914] px-2 py-0.5 text-xs font-black text-white shadow-md">
                  {matchPct}%
                </span>
              </div>
            )}
          </div>

          {/* Hover Action Strip & Details */}
          <div className="space-y-3 p-4 text-white">
            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCardClick && onCardClick(rec);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow transition hover:bg-neutral-200 md:h-10 md:w-10"
                  title="Explore"
                >
                  <span className="ml-0.5 text-base font-black">▶</span>
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-500 bg-neutral-900/80 text-white transition hover:border-white md:h-10 md:w-10"
                  title="Add to My List"
                >
                  <span className="text-base font-bold">+</span>
                </button>
                {/* Thumbs-up SVG icon with dynamic liked feedback */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLiked((prev) => !prev);
                    onLike && onLike(movie);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border p-2 transition md:h-10 md:w-10 ${
                    isLiked
                      ? "border-red-500 bg-red-600 text-white"
                      : "border-neutral-500 bg-neutral-900/80 hover:border-white"
                  }`}
                  title={isLiked ? "Liked!" : "Like"}
                >
                  <img
                    src={thumbsUp}
                    alt="Like"
                    className={`h-full w-full ${isLiked ? "" : "invert"}`}
                  />
                </button>
              </div>

              {/* Expand chevron button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCardClick && onCardClick(rec);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-500 bg-neutral-900/80 text-white transition hover:border-white md:h-10 md:w-10"
                title="More Info"
              >
                <span className="text-sm font-bold">v</span>
              </button>
            </div>

            {/* Meta Line: Match % in Red & White · Year · Rating */}
            <div className="flex items-center space-x-2.5 text-xs font-semibold md:text-sm">
              {matchPct !== null && (
                <span className="rounded bg-[#e50914] px-2 py-0.5 text-xs font-black text-white shadow">
                  {matchPct}% Match
                </span>
              )}
              {movie.year && (
                <span className="font-bold text-neutral-300">{movie.year}</span>
              )}
              {movie.avg_rating && (
                <span className="rounded border border-neutral-600 px-1.5 py-0.5 text-xs font-bold text-amber-400">
                  Rating:{movie.avg_rating}
                </span>
              )}
              <span className="rounded border border-neutral-700 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-400">
                HD
              </span>
            </div>

            {/* Why This Explanation Snippet */}
            {explanation?.reason && (
              <p className="line-clamp-1 text-xs font-medium italic text-emerald-300/90 md:text-sm">
                {explanation.reason}
              </p>
            )}

            {/* Genres Tag List */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs font-medium text-neutral-300">
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
