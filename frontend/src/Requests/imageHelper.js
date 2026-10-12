// Curated aesthetic backdrops from TMDB so every recommendation gets high-res cinematic visuals
export const POSTER_BACKDROPS = [
  "https://image.tmdb.org/t/p/w780/cn0feYcDvVzVjUDoXa1O8sRgzz.jpg", // Below
  "https://image.tmdb.org/t/p/w780/3icyRAqgakNcQn6aDVz9libFmBA.jpg", // Resident Evil
  "https://image.tmdb.org/t/p/w780/twiVn9oFXOVR0uoYgawyEBlnFu8.jpg", // The Odyssey
  "https://image.tmdb.org/t/p/w780/5lTZyuBTNOfawsfPT8Q0cIg6qAF.jpg", // Obsession
  "https://image.tmdb.org/t/p/w780/pmPXXniQlb4EdYY0gVZO90rf54F.jpg", // Onslaught
  "https://image.tmdb.org/t/p/w780/b7t3r39Oll5qPxBKzLZ8eHMBD7l.jpg", // Digger
  "https://image.tmdb.org/t/p/w780/yBDxqDB29kpH9VojTytjGWBgmdJ.jpg", // Fall 2
  "https://image.tmdb.org/t/p/w780/p40lmrdI4blcAPZQMTPaiy5v5Ym.jpg", // Insidious
  "https://image.tmdb.org/t/p/w780/ncm7djsVTHQQMX2HEbEVxMUFchG.jpg", // Other Mommy
  "https://image.tmdb.org/t/p/w780/3BoHXmGAfC2qO4wnCpMYV0BzpHD.jpg", // Verity
  "https://image.tmdb.org/t/p/w780/cv102XnL9r7M9jFr0hsMeqzpAWW.jpg", // Treasure Island
  "https://image.tmdb.org/t/p/w780/g3gpP5YDbA85DsA0bt5mgGQIe5q.jpg", // Avengers
  "https://image.tmdb.org/t/p/w780/wE6syT1vv6W24iLGfhR4kQHnIDN.jpg", // Practical Magic
  "https://image.tmdb.org/t/p/w780/kQ58qbyCGkdmqKZtxMZbLNpgSxX.jpg",
  "https://image.tmdb.org/t/p/w780/4HWAQu28LD2EdxMrSPvAoNxw9v5.jpg",
  "https://image.tmdb.org/t/p/w780/8YFL5QQVPy3AgrEQxNYVSgiPEbe.jpg",
];

// Returns deterministic cinematic image for a given movie title or id
export const getMovieImage = (movie) => {
  if (!movie) return POSTER_BACKDROPS[0];
  const str = movie.title || String(movie.movie_id || 0);
  const hash = [...str].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return POSTER_BACKDROPS[hash % POSTER_BACKDROPS.length];
};

// Generates dynamic CineMatch-specific Netflix red tag badge for roughly 1 out of 8 cards
export const getRecommendationTag = (rec, index = 0) => {
  if (!rec) return null;
  const movie = rec.movie || rec;
  const movieId = movie.movie_id || 0;

  // Only 1 out of 8 cards should show this red tag, distributed pseudo-randomly
  const hash = Math.abs((movieId * 37) ^ ((index + 1) * 19));
  if (hash % 8 !== 0) {
    return null; // 7 out of 8 cards will NOT display the red tag
  }

  const score = rec.score !== undefined ? rec.score : 0.8;
  const why = rec.explanation?.reason || "";

  if (score >= 0.95) return "99% Super Match";
  if (why.includes("Viewers who liked")) return "Because You Liked";
  if (why.includes("Trending") || why.includes("acclaimed")) return "Trending Hit";
  if (movie.avg_rating && movie.avg_rating >= 4.2) return "Critically Acclaimed";
  if (why.includes("Shares genres")) return "Taste Aligned";
  return "Recently Added";
};
