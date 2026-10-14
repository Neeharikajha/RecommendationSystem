import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setProfile } from "../../Store/profile";
import requests from "../../Requests/request";
import CineRow from "../Row/CineRow";
import PlayCard from "../PlayCard/PlayCard";

import CustomProfileBuilder from "../Layouts/CustomProfileBuilder";
import MovieModal from "../Card/MovieModal";
import { getUserHome, getCustomHome, getMeta } from "../../Requests/backendApi";

const Home = ({ showCustomBuilder, setShowCustomBuilder }) => {
  const selectedProfile = useSelector((state) => state.profile);
  const dispatch = useDispatch();

  const [activeUserId, setActiveUserId] = useState(1);
  const [userList, setUserList] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [backendRows, setBackendRows] = useState([]);
  const [loadingBackend, setLoadingBackend] = useState(true);
  const [activeModalRec, setActiveModalRec] = useState(null);
  const [backendError, setBackendError] = useState(null);

  // Initialize active user from Redux or default to 1
  useEffect(() => {
    if (selectedProfile === "custom") {
      setShowCustomBuilder(true);
      // Fetch empty cold-start home
      fetchCustomHome([]);
    } else {
      const uId = typeof selectedProfile === "number" ? selectedProfile : parseInt(selectedProfile?.replace?.(/\D/g, "") || "1", 10) || 1;
      setActiveUserId(uId);
      fetchUserData(uId);
    }
  }, [selectedProfile]);

  // Load user list from metadata
  useEffect(() => {
    async function fetchMeta() {
      try {
        const meta = await getMeta();
        if (meta?.user_ids) {
          setUserList(meta.user_ids);
        }
      } catch (err) {
        console.warn("Could not fetch metadata:", err);
      }
    }
    fetchMeta();
  }, []);

  const fetchUserData = async (userId) => {
    try {
      setLoadingBackend(true);
      setBackendError(null);
      const data = await getUserHome(userId, 10);
      setProfileData(data.profile);

      // Strict cross-row deduplication: once a movie is placed in a row, never repeat it in another row
      const seenIds = new Set();
      const dedupedRows = (data.rows || []).map((row) => {
        const uniqueItems = [];
        for (const item of row.items || []) {
          const mId = item.movie?.movie_id || item.movie_id;
          if (!seenIds.has(mId)) {
            seenIds.add(mId);
            uniqueItems.push(item);
          }
        }
        return { ...row, items: uniqueItems };
      }).filter((row) => row.items.length > 0);

      setBackendRows(dedupedRows);
    } catch (err) {
      console.error("Backend fetch error:", err);
      setBackendError(err.message || "Failed to connect to recommendation backend.");
    } finally {
      setLoadingBackend(false);
    }
  };

  const fetchCustomHome = async (ratings) => {
    try {
      setLoadingBackend(true);
      setBackendError(null);
      const data = await getCustomHome(ratings, 10);
      setProfileData(data.profile);

      // Strict cross-row deduplication for custom profiles
      const seenIds = new Set();
      const dedupedRows = (data.rows || []).map((row) => {
        const uniqueItems = [];
        for (const item of row.items || []) {
          const mId = item.movie?.movie_id || item.movie_id;
          if (!seenIds.has(mId)) {
            seenIds.add(mId);
            uniqueItems.push(item);
          }
        }
        return { ...row, items: uniqueItems };
      }).filter((row) => row.items.length > 0);

      setBackendRows(dedupedRows);
    } catch (err) {
      console.error("Custom profile error:", err);
      setBackendError(err.message);
    } finally {
      setLoadingBackend(false);
    }
  };

  const handleUserChange = (newUserId) => {
    setActiveUserId(newUserId);
    dispatch(setProfile(newUserId));
    fetchUserData(newUserId);
  };

  const handleRandomUser = () => {
    if (userList.length === 0) return;
    const randId = userList[Math.floor(Math.random() * userList.length)];
    handleUserChange(randId);
  };

  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white">
      {/* Featured TMDB Billboard Banner */}
      <PlayCard fetchUrl={requests.fetchTrending} />

      {/* Custom Taste Profile Builder Drawer (collapsible or activated via header) */}
      {showCustomBuilder && (
        <CustomProfileBuilder
          onApplyProfile={(ratings) => fetchCustomHome(ratings)}
          onReset={() => {
            if (activeUserId) fetchUserData(activeUserId);
          }}
        />
      )}

      {/* Backend Hybrid Engine Recommendation Rows */}
      {loadingBackend ? (
        <div className="py-12 px-6 md:px-12 text-center text-gray-400">
          <span>Loading recommendations...</span>
        </div>
      ) : backendError ? (
        <div className="mx-6 md:mx-12 my-4 rounded-xl bg-red-950/30 border border-red-800/40 p-4 text-xs text-red-300">
          Error loading recommendations: {backendError}
        </div>
      ) : (
        <div className="space-y-2">
          {backendRows.map((row, idx) => (
            <CineRow
              key={idx}
              title={row.title}
              items={row.items}
              onCardClick={(rec) => setActiveModalRec(rec)}
            />
          ))}
        </div>
      )}



      {/* Modal with Why This explanation, Signals & More Like This */}
      {activeModalRec && (
        <MovieModal
          rec={activeModalRec}
          onClose={() => setActiveModalRec(null)}
        />
      )}
    </div>
  );
};

export default Home;
