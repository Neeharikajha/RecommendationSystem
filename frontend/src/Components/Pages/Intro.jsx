import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setProfile } from "../../Store/profile";
import netflixSplashGif from "../../assets/NetFlix Animation copy.gif";
import user1Img from "../../assets/User1.png";
import user2Img from "../../assets/User2.png";
import user3Img from "../../assets/User3.jfif";
import user4Img from "../../assets/User4.jpg";

const NETFLIX_LOGO = "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg";

const userProfiles = [
  { id: 1, label: "User 1", sublabel: "Algo", image: user1Img },
  { id: 2, label: "User 2", sublabel: "Algo", image: user2Img },
  { id: 3, label: "User 3", sublabel: "Algo", image: user3Img },
  { id: 4, label: "User 4", sublabel: "Algo", image: user4Img },
];

const Intro = () => {
  const [showSplash, setShowSplash] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 1. Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectProfile = (userId) => {
    dispatch(setProfile(userId));
    navigate("/home");
  };

  return showSplash ? (
    /* Screen 1: Netflix Animated Splash Screen */
    <div className="grid h-screen place-items-center bg-black">
      <img
        className="w-80 md:w-[32rem] object-contain"
        src={netflixSplashGif}
        alt="Netflix Animation"
      />
    </div>
  ) : (
    /* Screen 2: Who's Watching Profile Picker */
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#141414] px-6 text-center">
      <div className="flex items-center mb-8">
        <img className="w-32 md:w-44" src={NETFLIX_LOGO} alt="Netflix" />
      </div>

      <h1 className="mb-10 text-3xl font-medium text-white md:text-5xl">
        Who's Watching?
      </h1>

      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
        {userProfiles.map((user) => (
          <div
            key={user.id}
            onClick={() => handleSelectProfile(user.id)}
            className="group flex flex-col items-center cursor-pointer"
          >
            <div className="w-24 h-24 md:w-36 md:h-36 overflow-hidden rounded-md border-2 border-transparent transition-all duration-200 group-hover:border-white group-hover:scale-105 shadow-xl">
              <img
                src={user.image}
                alt={user.label}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-400 group-hover:text-white transition">
              {user.label}
            </p>
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
              {user.sublabel}
            </span>
          </div>
        ))}

        {/* Custom / Add Profile Slot with + sign */}
        <div
          onClick={() => handleSelectProfile("custom")}
          className="group flex flex-col items-center cursor-pointer"
        >
          <div className="flex w-24 h-24 md:w-36 md:h-36 items-center justify-center rounded-md border-2 border-dashed border-gray-600 bg-[#1c1c1c] text-4xl font-light text-gray-400 transition-all duration-200 group-hover:border-red-500 group-hover:text-white group-hover:scale-105">
            +
          </div>
          <p className="mt-3 text-sm font-semibold text-gray-400 group-hover:text-white transition">
            Add Profile
          </p>
          <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
            Custom
          </span>
        </div>
      </div>
    </div>
  );
};

export default Intro;
