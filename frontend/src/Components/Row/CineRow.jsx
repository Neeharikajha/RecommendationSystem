import React from "react";
import CineCard from "../Card/CineCard";

const CineRow = ({ title, items = [], onCardClick }) => {
  if (!items || items.length === 0) return null;

  // Display top 5 curated recommendations per row to fit the screen without horizontal scrolling
  const displayItems = items.slice(0, 5);

  return (
    <div className="py-4 px-6 md:px-12 space-y-3 relative overflow-visible">
      {/* Row Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <span className="h-4 w-1 bg-[#e50914] rounded-full inline-block" />
          {title}
        </h2>
        <span className="text-xs text-neutral-400 font-medium">
          Top {displayItems.length} curated
        </span>
      </div>

      {/* Non-scrolling Row Grid: Clean responsive layout with zero horizontal scrolling */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 overflow-visible py-2">
        {displayItems.map((rec, index) => (
          <CineCard
            key={rec.movie?.movie_id || rec.movie_id}
            rec={rec}
            index={index}
            isFirst={index === 0}
            isLast={index === displayItems.length - 1}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
};

export default CineRow;
