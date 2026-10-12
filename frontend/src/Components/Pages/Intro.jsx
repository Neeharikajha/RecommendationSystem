import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setProfile } from "../../Store/profile";
import { getMeta } from "../../Requests/backendApi";

const defaultAvatars = [
  "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png",
  "https://mir-s3-cdn-cf.behance.net/project_modules/disp/bb3a8833858140.56ba544a374b7.png",
  "https://mir-s3-cdn-cf.behance.net/project_modules/disp/1b164333858140.56ba544a32e81.png",
  "https://mir-s3-cdn-cf.behance.net/project_modules/disp/bf642933858140.56ba544a3713b.png",
];

const NETFLIX_LOGO = "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg";
const NETFLIX_SPLASH_GIF = "https://cdn.dribbble.com/users/992274/screenshots/10665249/media/ceba06c28f6e80b2a419266f8beeeef1.gif";

const Intro = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeUsers, setActiveUsers] = useState([1, 2, 3, 4]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 1. Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch real users from backend metadata
  useEffect(() => {
    async function fetchUsers() {
      try {
        const meta = await getMeta();
        if (meta?.user_ids?.length) {
          // Take first 4 distinct users from the dataset
          setActiveUsers(meta.user_ids.slice(0, 4));
        }
      } catch (err) {
        console.warn("Using fallback user profiles", err);
      }
    }
    fetchUsers();
  }, []);

  const handleSelectProfile = (userId) => {
    dispatch(setProfile(userId));
    navigate("/home");
  };

  return showSplash ? (
    /* Screen 1: N Animated Splash Screen */
    <div className="grid h-screen place-items-center bg-black">
      <img
        className="w-72 md:w-96 object-contain"
        src={NETFLIX_SPLASH_GIF}
        alt="Netflix Animation"
      />
    </div>
  ) : (
    /* Screen 2: Who's Watching Profile Picker */
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#141414] px-6 text-center">
      <div className="flex items-center gap-2 mb-8">
        <img className="w-32 md:w-44" src={NETFLIX_LOGO} alt="Netflix" />
        <span className="rounded bg-red-600/20 border border-red-500/40 text-[10px] uppercase font-black text-red-500 px-2 py-0.5 tracking-wider">
          CineMatch AI
        </span>
      </div>

      <h1 className="mb-2 text-3xl font-medium text-white md:text-5xl">
        Who's Watching?
      </h1>
      <p className="mb-10 text-xs md:text-sm text-gray-400 max-w-md">
        Select a benchmark viewer to load their personalized SVD + Content + Popularity recommendations.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
        {activeUsers.map((userId, index) => (
          <div
            key={userId}
            onClick={() => handleSelectProfile(userId)}
            className="group flex flex-col items-center cursor-pointer"
          >
            <div className="w-24 h-24 md:w-36 md:h-36 overflow-hidden rounded-md border-2 border-transparent transition-all duration-200 group-hover:border-white group-hover:scale-105 shadow-xl">
              <img
                src={defaultAvatars[index % defaultAvatars.length]}
                alt={`User ${userId}`}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-400 group-hover:text-white transition">
              User #{userId}
            </p>
            <span className="text-[10px] text-gray-500">Benchmark Profile</span>
          </div>
        ))}

        {/* Cold Start / Custom Viewer Slot */}
        <div
          onClick={() => handleSelectProfile("custom")}
          className="group flex flex-col items-center cursor-pointer"
        >
          <div className="flex w-24 h-24 md:w-36 md:h-36 items-center justify-center rounded-md border-2 border-dashed border-gray-600 bg-[#1c1c1c] text-3xl font-light text-gray-400 transition-all duration-200 group-hover:border-red-500 group-hover:text-white group-hover:scale-105">
            ✨
          </div>
          <p className="mt-3 text-sm font-semibold text-gray-400 group-hover:text-white transition">
            Build My Own
          </p>
          <span className="text-[10px] text-gray-500">Cold-start / Custom</span>
        </div>
      </div>
    </div>
  );
};

export default Intro;
