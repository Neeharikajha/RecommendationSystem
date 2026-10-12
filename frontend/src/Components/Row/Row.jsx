import React, { useEffect, useState } from "react";
import axios from "../../Requests/axios";
import Card from "../Card/Card";

const BASE_IMAGE_URL = "https://image.tmdb.org/t/p/original/";

const Row = ({ title, fetchUrl }) => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(fetchUrl);
        setMovies(response.data.results || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [fetchUrl]);

  return (
    <div className="py-4 px-6 md:px-12">
      <h2 className="mb-3 text-lg md:text-xl font-bold text-white tracking-wide">
        {title}
      </h2>
      <div className="no-scrollbar flex space-x-3 overflow-x-scroll scroll-smooth pb-2">
        {movies.map((movie) => (
          <Card
            key={movie.id}
            id={movie.id}
            image_src={`${BASE_IMAGE_URL}${movie.backdrop_path || movie.poster_path}`}
            image_alt={movie.title || movie.name}
          />
        ))}
      </div>
    </div>
  );
};

export default Row;
