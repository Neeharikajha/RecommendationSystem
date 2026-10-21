import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setProfile } from "../../Store/profile";
import netflixSplashGif from "../../assets/NetFlix Animation copy.gif";
import user1Img from "../../assets/User1.png";
import user2Img from "../../assets/User2.png";
import user3Img from "../../assets/User3.jfif";

const NETFLIX_LOGO =
  "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg";

// Three distinct profile types
const userProfiles = [
  {
    id: "neeharika",
    label: "Neeharika",
    sublabel: "Your Profile",
    image: user1Img,
    description: "Personalized recommendations based on watch history",
  },
  {
    id: "new",
    label: "New",
    sublabel: "Fresh Start",
    image: user2Img,
    description: "New user - discover without assumptions",
  },
  {
    id: "custom",
    label: "Custom",
    sublabel: "Build Your Taste",
    image: user3Img,
    description: "Rate movies to get personalized picks",
  },
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

  const handleSelectProfile = (profileId) => {
    // Map new profile names to backend user IDs for cold-start logic
    let backendId = profileId;
    if (profileId === "neeharika") {
      backendId = 1; // Existing established user
    } else if (profileId === "new") {
      backendId = "new"; // Trigger cold-start recommendations
    } else if (profileId === "custom") {
      backendId = "custom"; // Trigger custom profile builder
    }

    dispatch(setProfile(backendId));
    navigate("/home");
  };

  return showSplash ? (
    /* Screen 1: Netflix Animated Splash Screen */
    <div className="grid h-screen place-items-center bg-black">
      <img
        className="w-80 object-contain md:w-[32rem]"
        src={netflixSplashGif}
        alt="Netflix Animation"
      />
    </div>
  ) : (
    /* Screen 2: Who's Watching Profile Picker */
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#141414] px-6 text-center">
      <div className="mb-8 flex items-center">
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
            className="group flex cursor-pointer flex-col items-center"
            title={user.description}
          >
            <div className="h-24 w-24 overflow-hidden rounded-md border-2 border-transparent shadow-xl transition-all duration-200 group-hover:scale-105 group-hover:border-[#e50914] md:h-36 md:w-36">
              <img
                src={user.image}
                alt={user.label}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-400 transition group-hover:text-white">
              {user.label}
            </p>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 group-hover:text-gray-300">
              {user.sublabel}
            </span>
            <span className="mt-2 max-w-[100px] text-[9px] text-gray-600 group-hover:text-gray-400">
              {user.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Intro;
