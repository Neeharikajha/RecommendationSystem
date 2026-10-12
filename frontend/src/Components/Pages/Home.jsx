import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setProfile } from "../../Store/profile";
import requests from "../../Requests/request";
import CineRow from "../Row/CineRow";
import PlayCard from "../PlayCard/PlayCard";
import ProfileHeader from "../Layouts/ProfileHeader";
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
      const data = await getUserHome(userId, 14);
      setProfileData(data.profile);
      setBackendRows(data.rows || []);
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
      const data = await getCustomHome(ratings, 14);
      setProfileData(data.profile);
      setBackendRows(data.rows || []);
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

      {/* CineMatch Taste Profile & Blend HUD */}
      {profileData && (
        <ProfileHeader
          profile={profileData}
          activeUserId={selectedProfile === "custom" ? null : activeUserId}
          users={userList}
          onUserChange={handleUserChange}
          onRandomUser={handleRandomUser}
        />
      )}

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
          <div className="animate-spin text-2xl inline-block mr-2">⚙️</div>
          <span>Computing CineMatch SVD & Content-based hybrid recommendations...</span>
        </div>
      ) : backendError ? (
        <div className="mx-6 md:mx-12 my-4 rounded-xl bg-red-950/30 border border-red-800/40 p-4 text-xs text-red-300">
          ⚠️ CineMatch Backend: {backendError} (Ensure FastAPI is running on port 8000)
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
