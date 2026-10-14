import React, { useRef, useState } from "react";
import CineCard from "../Card/CineCard";

const CineRow = ({ title, items = [], onCardClick }) => {
  if (!items || items.length === 0) return null;

  // Show first 5 in grid, remaining 5 in horizontal scroll strip
  const topItems = items.slice(0, 5);
  const moreItems = items.slice(5, 10);

  const scrollRef = useRef(null);
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="py-4 px-6 md:px-12 space-y-3 relative overflow-visible">
      {/* Row Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <span className="h-4 w-1 bg-[#e50914] rounded-full inline-block" />
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium">
            Top {topItems.length + moreItems.length} curated
          </span>
          {moreItems.length > 0 && (
            <button
              onClick={() => setShowMore((v) => !v)}
              className="text-xs text-red-500 hover:text-red-400 font-semibold transition underline underline-offset-2"
            >
              {showMore ? "Show Less" : `+${moreItems.length} More`}
            </button>
          )}
        </div>
      </div>

      {/* Top 5 Non-scrolling Row Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 overflow-visible py-2">
        {topItems.map((rec, index) => (
          <CineCard
            key={rec.movie?.movie_id || rec.movie_id}
            rec={rec}
            index={index}
            isFirst={index === 0}
            isLast={index === topItems.length - 1}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      {/* Bottom 5: horizontal scroll strip, revealed when user clicks "+N More" */}
      {showMore && moreItems.length > 0 && (
        <div
          ref={scrollRef}
          className="flex gap-3.5 overflow-x-auto pb-3 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {moreItems.map((rec, index) => (
            <div
              key={rec.movie?.movie_id || rec.movie_id}
              className="snap-start flex-none w-[calc(20%-0.7rem)] min-w-[180px]"
            >
              <CineCard
                rec={rec}
                index={topItems.length + index}
                isFirst={index === 0}
                isLast={index === moreItems.length - 1}
                onCardClick={onCardClick}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CineRow;
