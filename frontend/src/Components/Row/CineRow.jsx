import React from "react";
import CineCard from "../Card/CineCard";

const CineRow = ({ title, items = [], onCardClick }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="py-4 px-6 md:px-12 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <span className="h-4 w-1 bg-red-600 rounded-full inline-block" />
          {title}
        </h2>
        <span className="text-xs text-gray-500 font-medium">
          {items.length} recommendations
        </span>
      </div>
      <div className="no-scrollbar flex space-x-4 overflow-x-scroll scroll-smooth pb-3 pt-1">
        {items.map((rec) => (
          <CineCard
            key={rec.movie?.movie_id || rec.movie_id}
            rec={rec}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
};

export default CineRow;
