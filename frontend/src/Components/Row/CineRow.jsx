import React, { useRef, useState, useCallback, useMemo } from "react";
import CineCard from "../Card/CineCard";

const CineRow = ({ title, items = [], onCardClick }) => {
  if (!items || items.length === 0) return null;

  // Show first 5 in grid, remaining 5 in horizontal scroll strip
  const topItems = useMemo(() => items.slice(0, 5), [items]);
  const moreItems = useMemo(() => items.slice(5, 10), [items]);

  const scrollRef = useRef(null);
  const [showMore, setShowMore] = useState(false);

  const handleCardClick = useCallback(
    (rec) => {
      onCardClick && onCardClick(rec);
    },
    [onCardClick],
  );

  const toggleMore = useCallback(() => {
    setShowMore((v) => !v);
  }, []);

  return (
    <div className="relative space-y-3 overflow-visible px-6 py-4 md:px-12">
      {/* Row Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-wide text-white md:text-xl">
          <span className="inline-block h-4 w-1 rounded-full bg-[#e50914]" />
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-400">
            Top {topItems.length + moreItems.length} curated
          </span>
          {moreItems.length > 0 && (
            <button
              onClick={toggleMore}
              className="text-xs font-semibold text-red-500 underline underline-offset-2 transition hover:text-red-400"
            >
              {showMore ? "Show Less" : `+${moreItems.length} More`}
            </button>
          )}
        </div>
      </div>

      {/* Top 5 Non-scrolling Row Grid */}
      <div className="grid grid-cols-2 gap-3.5 overflow-visible py-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {topItems.map((rec, index) => (
          <CineCard
            key={rec.movie?.movie_id || rec.movie_id}
            rec={rec}
            index={index}
            isFirst={index === 0}
            isLast={index === topItems.length - 1}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      {/* Bottom 5: horizontal scroll strip, revealed when user clicks "+N More" */}
      {showMore && moreItems.length > 0 && (
        <div
          ref={scrollRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-smooth pb-3"
        >
          {moreItems.map((rec, index) => (
            <div
              key={rec.movie?.movie_id || rec.movie_id}
              className="w-[calc(20%-0.7rem)] min-w-[180px] flex-none snap-start"
            >
              <CineCard
                rec={rec}
                index={topItems.length + index}
                isFirst={index === 0}
                isLast={index === moreItems.length - 1}
                onCardClick={handleCardClick}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CineRow;
