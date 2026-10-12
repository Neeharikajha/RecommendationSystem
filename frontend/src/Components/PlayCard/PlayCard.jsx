import React, { useEffect, useState } from "react";
import axios from "../../Requests/axios";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import YouTube from "react-youtube";
import movieTrailer from "movie-trailer";

const PlayCard = ({ fetchUrl }) => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trailerURL, setTrailerURL] = useState("");
  const [toast, setToast] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(fetchUrl);
        const results = response.data.results || [];
        const randomIndex = Math.floor(Math.random() * results.length);
        setMovie(results[randomIndex]);
      } catch (err) {
        console.error(err);
      } finally {
        setTimeout(() => setLoading(false), 400);
      }
    }
    fetchData();
  }, [fetchUrl]);

  const handlePlayTrailer = () => {
    if (trailerURL) {
      setTrailerURL("");
    } else {
      movieTrailer(movie?.title || movie?.original_title || movie?.name || "")
        .then((url) => {
          if (url) {
            const urlParams = new URLSearchParams(new URL(url).search);
            setTrailerURL(urlParams.get("v"));
          }
        })
        .catch((err) => console.log(err));
    }
  };

  const handleAddWatchList = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const youtubeOpts = {
    height: "390",
    width: "100%",
    playerVars: { autoplay: 1 },
  };

  if (loading) {
    return (
      <div className="h-[55vh] md:h-[75vh] w-full bg-gray-900 animate-pulse">
        <SkeletonTheme baseColor="#202020" highlightColor="#444">
          <Skeleton height="100%" />
        </SkeletonTheme>
      </div>
    );
  }

  return (
    <div className="relative h-[55vh] md:h-[75vh] w-full text-white">
      {/* Background Poster Image */}
      <div className="absolute inset-0">
        <img
          src={`https://image.tmdb.org/t/p/original/${movie?.backdrop_path || movie?.poster_path}`}
          alt={movie?.title}
          className="h-full w-full object-cover"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content Info */}
      <div className="absolute bottom-12 left-6 md:left-12 max-w-xl z-20 space-y-4">
        <h1 className="text-3xl md:text-5xl font-extrabold drop-shadow-md">
          {movie?.title || movie?.original_title || movie?.name}
        </h1>
        <p className="text-sm md:text-base text-gray-300 line-clamp-3 drop-shadow">
          {movie?.overview}
        </p>

        {/* Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handlePlayTrailer}
            className="flex items-center justify-center rounded bg-white px-6 py-2 text-sm md:text-base font-bold text-black hover:bg-gray-200 transition"
          >
            ▶ {trailerURL ? "Close Trailer" : "Play"}
          </button>
          <button
            onClick={handleAddWatchList}
            className="flex items-center justify-center rounded bg-gray-600/70 px-6 py-2 text-sm md:text-base font-bold text-white hover:bg-gray-700 transition"
          >
            + My List
          </button>
        </div>
      </div>

      {/* Embedded Trailer Drawer */}
      {trailerURL && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/90 p-4">
          <YouTube videoId={trailerURL} opts={youtubeOpts} />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 rounded-md bg-black/90 border border-gray-700 px-6 py-3 text-sm text-white shadow-lg animate-fade-in">
          Added to My List
        </div>
      )}
    </div>
  );
};

export default PlayCard;
