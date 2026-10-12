import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const NETFLIX_LOGO = "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg";
const DEFAULT_AVATAR = "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png";

const Header = ({ onOpenMetrics, onToggleCustomBuilder, showCustomBuilder }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 7);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 transition-colors duration-300 ${
        isScrolled ? "bg-[#141414]/95 backdrop-blur-md shadow-lg" : "bg-gradient-to-b from-black/90 to-transparent"
      }`}
    >
      <div className="flex items-center space-x-6 md:space-x-8">
        <Link to="/home" className="flex items-center gap-2">
          <img className="w-24 md:w-28 object-contain" src={NETFLIX_LOGO} alt="Netflix" />
          <span className="hidden sm:inline-block rounded bg-red-600/20 border border-red-500/40 text-[10px] uppercase font-black text-red-500 px-1.5 py-0.5 tracking-wider">
            CineMatch AI
          </span>
        </Link>
        <nav className="hidden md:flex space-x-5 text-xs md:text-sm font-medium text-gray-200">
          <Link to="/home" className="hover:text-white transition">Home</Link>
          <button
            onClick={onToggleCustomBuilder}
            className={`transition flex items-center gap-1.5 ${
              showCustomBuilder ? "text-red-400 font-bold" : "hover:text-white text-gray-300"
            }`}
          >
            <span>🛠️</span> Build Taste Profile
          </button>
          <button
            onClick={onOpenMetrics}
            className="hover:text-white text-gray-300 transition flex items-center gap-1.5"
          >
            <span>📊</span> Model Analytics
          </button>
        </nav>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Mobile quick action buttons */}
        <button
          onClick={onToggleCustomBuilder}
          className="md:hidden rounded-lg bg-neutral-800 border border-neutral-700 px-2.5 py-1 text-xs text-gray-200"
          title="Build Taste Profile"
        >
          🛠️
        </button>
        <button
          onClick={onOpenMetrics}
          className="md:hidden rounded-lg bg-neutral-800 border border-neutral-700 px-2.5 py-1 text-xs text-gray-200"
          title="Analytics"
        >
          📊
        </button>
        <Link to="/">
          <img
            className="w-8 h-8 rounded-sm object-cover cursor-pointer hover:ring-2 hover:ring-red-600 transition"
            src={DEFAULT_AVATAR}
            alt="Profile"
            title="Switch User Profile"
          />
        </Link>
      </div>
    </header>
  );
};

export default Header;
