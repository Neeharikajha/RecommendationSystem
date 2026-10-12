import React, { useState, useEffect } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

const Card = ({ image_src, image_alt, id }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="h-28 w-48 md:h-36 md:w-64 flex-shrink-0 overflow-hidden rounded bg-gray-800 animate-pulse">
        <SkeletonTheme baseColor="#202020" highlightColor="#444">
          <Skeleton height="100%" />
        </SkeletonTheme>
      </div>
    );
  }

  return (
    <div className="group relative h-28 w-48 md:h-36 md:w-64 flex-shrink-0 cursor-pointer overflow-hidden rounded transition-all duration-300 hover:scale-105 hover:z-20">
      <img
        src={image_src}
        alt={image_alt || "Movie"}
        className="h-full w-full object-cover rounded"
        loading="lazy"
      />
    </div>
  );
};

export default Card;
