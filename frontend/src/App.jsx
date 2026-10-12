import React, { useState } from "react";
import Header from "./Components/Layouts/Header";
import Home from "./Components/Pages/Home";
import Intro from "./Components/Pages/Intro";
import MetricsDashboard from "./Components/Pages/MetricsDashboard";
import { Route, Routes, useLocation } from "react-router-dom";

const App = () => {
  const location = useLocation();
  const isIntroPage = location.pathname === "/";

  const [showMetrics, setShowMetrics] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  return (
    <div className="max-h-fit min-h-screen bg-black">
      {/* Top Header */}
      {!isIntroPage && (
        <Header
          onOpenMetrics={() => setShowMetrics(true)}
          onToggleCustomBuilder={() => setShowCustomBuilder((prev) => !prev)}
          showCustomBuilder={showCustomBuilder}
        />
      )}

      {/* Pages */}
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route
          path="/home"
          element={
            <Home
              showCustomBuilder={showCustomBuilder}
              setShowCustomBuilder={setShowCustomBuilder}
            />
          }
        />
      </Routes>

      {/* Offline Evaluation & Analytics Modal */}
      {showMetrics && <MetricsDashboard onClose={() => setShowMetrics(false)} />}
    </div>
  );
};

export default App;
