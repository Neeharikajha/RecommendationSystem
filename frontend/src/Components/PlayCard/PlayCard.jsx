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

  // Listen for Escape key to close trailer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && trailerURL) {
        setTrailerURL("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [trailerURL]);

  const handlePlayTrailer = async () => {
    if (trailerURL) {
      setTrailerURL("");
      return;
    }

    // 1. Try official TMDB videos endpoint first (guarantees official landscape trailers, not random YouTube shorts)
    if (movie?.id) {
      try {
        const mediaType = movie.media_type === "tv" ? "tv" : "movie";
        const apiKey = "a8bd04e1711338362bc753aded515929";
        const res = await axios.get(`/${mediaType}/${movie.id}/videos?api_key=${apiKey}&language=en-US`);
        const videos = res.data?.results || [];

        // Priority 1: Official Trailer on YouTube
        let selected = videos.find(
          (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
        );
        // Priority 2: Any Trailer on YouTube
        if (!selected) {
          selected = videos.find((v) => v.site === "YouTube" && v.type === "Trailer");
        }
        // Priority 3: Teaser on YouTube
        if (!selected) {
          selected = videos.find((v) => v.site === "YouTube" && v.type === "Teaser");
        }
        // Priority 4: Any clip
        if (!selected) {
          selected = videos.find((v) => v.site === "YouTube");
        }

        if (selected?.key) {
          setTrailerURL(selected.key);
          return;
        }
      } catch (err) {
        console.warn("TMDB video fetch error, trying movieTrailer fallback:", err);
      }
    }

    // 2. Fallback to movie-trailer library if TMDB didn't have one
    const searchTitle = movie?.title || movie?.original_title || movie?.name || "";
    try {
      const url = await movieTrailer(searchTitle, { id: true });
      if (url) {
        setTrailerURL(url);
      } else {
        const fullUrl = await movieTrailer(searchTitle);
        if (fullUrl) {
          const urlParams = new URLSearchParams(new URL(fullUrl).search);
          const v = urlParams.get("v");
          if (v) setTrailerURL(v);
        }
      }
    } catch (err) {
      console.error("Trailer fallback error:", err);
    }
  };

  const handleAddWatchList = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const youtubeOpts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  if (loading) {
    return (
      <div className="h-[80vh] w-full bg-gray-900 animate-pulse">
        <SkeletonTheme baseColor="#202020" highlightColor="#444">
          <Skeleton height="100%" />
        </SkeletonTheme>
      </div>
    );
  }

  return (
    <div className="relative h-[80vh] w-full text-white">
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
            className="flex items-center justify-center gap-2 rounded bg-white px-6 py-2 text-sm md:text-base font-bold text-black hover:bg-gray-200 transition shadow-lg"
          >
            <span>▶</span>
            <span>{trailerURL ? "Close Trailer" : "Play Trailer"}</span>
          </button>
          <button
            onClick={handleAddWatchList}
            className="flex items-center justify-center rounded bg-gray-600/70 px-6 py-2 text-sm md:text-base font-bold text-white hover:bg-gray-700 transition"
          >
            + My List
          </button>
        </div>
      </div>

      {/* Full-Hero Cinematic Video Overlay */}
      {trailerURL && (
        <div
          onClick={() => setTrailerURL("")}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/95 backdrop-blur-md"
        >
          {/* Close Button X */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTrailerURL("");
            }}
            aria-label="Close trailer"
            className="absolute top-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/80 text-xl font-bold text-white shadow-xl transition-all hover:bg-[#e50914] hover:scale-105 hover:border-transparent"
            title="Close Trailer (Esc or click outside)"
          >
            ✕
          </button>

          {/* Video Container that occupies the hero banner properly */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative h-full w-full max-w-6xl aspect-video max-h-[80vh] p-4 flex items-center justify-center"
          >
            <div className="h-full w-full overflow-hidden rounded-xl shadow-2xl border border-neutral-800">
              <YouTube videoId={trailerURL} opts={youtubeOpts} className="h-full w-full" />
            </div>
          </div>
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
