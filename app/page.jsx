// app/page.jsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { fetchCapabilities } from "./utils/dataLoader";
import CapabilityMap from "./components/CapabilityMap";

const Page = () => {
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [maxLevel, setMaxLevel] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [capabilities, setCapabilities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchCapabilities()
      .then((nestedData) => {
        setCapabilities(nestedData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  const effectiveMaxLevel = useMemo(() => {
    return searchQuery.trim() !== "" ? 4 : maxLevel;
  }, [searchQuery, maxLevel]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showHeatMap={showHeatMap}
        setShowHeatMap={setShowHeatMap}
        maxLevel={maxLevel}
        setMaxLevel={setMaxLevel}
      />

      <div className="h-24"></div>

      {/* Handle overflow in main container only */}
      <main className="flex-1 p-6 overflow-y-auto overflow-x-auto">
        <CapabilityMap
          capabilities={capabilities}
          loading={loading}
          error={error}
          searchQuery={searchQuery}
          showHeatMap={showHeatMap}
          maxLevel={effectiveMaxLevel}
        />
      </main>

      <Footer />

      <div className="h-16"></div>
    </div>
  );
};

export default Page;
