import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setProfile } from "../../Store/profile";
import accountIcon from "../../assets/account copy.svg";

const NETFLIX_LOGO = "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg";

const Header = ({ onOpenMetrics, onToggleCustomBuilder, showCustomBuilder }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 7);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const selectedProfile = useSelector((state) => state.ProfileData || state.profile);
  const dispatch = useDispatch();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSwitchProfile = (p) => {
    dispatch(setProfile(p));
    setShowProfileMenu(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 transition-colors duration-300 ${
        isScrolled ? "bg-[#141414]/95 backdrop-blur-md shadow-lg" : "bg-gradient-to-b from-black/90 to-transparent"
      }`}
    >
      <div className="flex items-center space-x-6 md:space-x-8">
        <Link to="/home" className="flex items-center">
          <img className="w-24 md:w-28 object-contain" src={NETFLIX_LOGO} alt="Netflix" />
        </Link>
        <nav className="hidden md:flex space-x-6 text-sm font-medium text-gray-200">
          <Link to="/home" className="hover:text-white transition">Home</Link>
          <button
            onClick={onToggleCustomBuilder}
            className={`transition ${
              showCustomBuilder ? "text-red-500 font-bold" : "hover:text-white text-gray-300"
            }`}
          >
            Build Profile
          </button>
          <button
            onClick={onOpenMetrics}
            className="hover:text-white text-gray-300 transition"
          >
            Analytics
          </button>
        </nav>
      </div>

      <div className="relative flex items-center space-x-4">
        {/* Profile Pill Badge */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/90 px-3 py-1 text-xs font-semibold text-gray-200 hover:border-red-500 transition shadow"
          >
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            <span className="capitalize">
              {selectedProfile === "neeharika" || selectedProfile === 1
                ? "Neeharika"
                : selectedProfile === "new"
                ? "New User"
                : "Custom"}
            </span>
            <span className="text-[10px] text-gray-400">▼</span>
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-neutral-700 bg-[#181818] p-1.5 shadow-2xl z-50 animate-in fade-in">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                Switch Profile
              </div>
              <button
                onClick={() => handleSwitchProfile("neeharika")}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition flex items-center justify-between ${
                  selectedProfile === "neeharika" || selectedProfile === 1
                    ? "bg-red-600/20 text-red-400 font-bold"
                    : "text-gray-300 hover:bg-neutral-800"
                }`}
              >
                <span>Neeharika (Personal)</span>
                {(selectedProfile === "neeharika" || selectedProfile === 1) && <span>✓</span>}
              </button>
              <button
                onClick={() => handleSwitchProfile("new")}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition flex items-center justify-between ${
                  selectedProfile === "new"
                    ? "bg-red-600/20 text-red-400 font-bold"
                    : "text-gray-300 hover:bg-neutral-800"
                }`}
              >
                <span>New (Discovery)</span>
                {selectedProfile === "new" && <span>✓</span>}
              </button>
              <button
                onClick={() => handleSwitchProfile("custom")}
                className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition flex items-center justify-between ${
                  selectedProfile === "custom"
                    ? "bg-red-600/20 text-red-400 font-bold"
                    : "text-gray-300 hover:bg-neutral-800"
                }`}
              >
                <span>Custom (Taste Builder)</span>
                {selectedProfile === "custom" && <span>✓</span>}
              </button>
              <div className="my-1 border-t border-neutral-800" />
              <Link
                to="/"
                onClick={() => setShowProfileMenu(false)}
                className="block w-full text-left px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg transition"
              >
                Who's Watching Screen →
              </Link>
            </div>
          )}
        </div>

        <Link to="/">
          <img
            className="w-8 h-8 rounded-sm object-cover cursor-pointer hover:ring-2 hover:ring-red-600 transition invert brightness-200"
            src={accountIcon}
            alt="Profile"
            title="Switch User Profile"
          />
        </Link>
      </div>
    </header>
  );
};

export default Header;
