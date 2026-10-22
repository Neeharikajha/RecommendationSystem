import React, { useRef, useState, useCallback, useMemo } from "react";
import CineCard from "../Card/CineCard";

const CineRow = ({ title, items = [], onCardClick }) => {
  if (!items || items.length === 0) return null;

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const handleCardClick = useCallback(
    (rec) => {
      onCardClick && onCardClick(rec);
    },
    [onCardClick],
  );

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="group relative space-y-3 overflow-visible px-6 py-4 md:px-12">
      {/* Row Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-wide text-white md:text-xl">
          <span className="inline-block h-4 w-1 rounded-full bg-[#e50914]" />
          {title}
        </h2>
        <span className="text-xs font-medium text-neutral-400">
          {items.length} curated picks
        </span>
      </div>

      {/* Horizontal Slider Area */}
      <div className="relative">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            aria-label="Scroll Left"
            className="absolute -left-4 top-1/2 z-30 flex h-12 w-10 -translate-y-1/2 items-center justify-center rounded-r bg-black/70 text-2xl font-bold text-white opacity-0 backdrop-blur-sm transition-all duration-200 hover:bg-black/90 hover:text-[#e50914] group-hover:opacity-100"
          >
            ‹
          </button>
        )}

        {/* Horizontal Card Track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="no-scrollbar flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth py-12 px-2"
        >
          {items.map((rec, index) => (
            <div
              key={rec.movie?.movie_id || rec.movie_id}
              className="w-56 flex-shrink-0 sm:w-64 md:w-72 overflow-visible"
            >
              <CineCard
                rec={rec}
                index={index}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                onCardClick={handleCardClick}
              />
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            aria-label="Scroll Right"
            className="absolute -right-4 top-1/2 z-30 flex h-12 w-10 -translate-y-1/2 items-center justify-center rounded-l bg-black/70 text-2xl font-bold text-white opacity-0 backdrop-blur-sm transition-all duration-200 hover:bg-black/90 hover:text-[#e50914] group-hover:opacity-100"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
};

export default CineRow;
