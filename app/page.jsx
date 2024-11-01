// app/page.jsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Simple Card and CardContent components using Tailwind CSS
const Card = ({ children, className }) => (
  <div className={`bg-white shadow rounded ${className}`}>{children}</div>
);

const CardContent = ({ children, className }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

// Helper Functions
const highlightText = (text, query) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="bg-yellow-200">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

const isValidHexColor = (hex) => {
  return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
};

// CapabilityMap Component
const CapabilityMap = ({
  capabilities,
  loading,
  error,
  searchQuery,
  showHeatMap,
  maxLevel,
  level1Colors,
  handleColorChange,
}) => {
  // List of default colors for Level 1 columns
  const defaultColors = useMemo(
    () => [
      "#8B246E",
      "#7A1C68",
      "#7A1A1A",
      "#B34700",
      "#8B3E00",
      "#A1421F",
      "#B8860B",
      "#7D6608",
      "#6F4E37",
      "#2C6A0E",
      "#556B2F",
      "#394D2D",
      "#0F4C5C",
      "#003366",
      "#274B61",
      "#001F3F",
      "#3A306B",
      "#00205C",
      "#001B4D",
      "#4B3069",
    ],
    []
  );

  const getPaddingClass = (level) => {
    switch (level) {
      case 1:
        return "pl-2";
      case 2:
        return "pl-4";
      case 3:
        return "pl-6";
      case 4:
        return "pl-8";
      default:
        return "pl-0";
    }
  };

  const getScoreColor = (score) => {
    if (score === 0) return "bg-gray-400";
    if (score >= 85) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const renderScoreBox = (score) =>
    showHeatMap ? (
      <div className={`w-8 h-8 rounded ${getScoreColor(score)}`}></div>
    ) : null;

  const highlightTextFunc = (text, query) => {
    return highlightText(text, query);
  };

  const filterCapabilitiesFunc = (capabilities, query) => {
    if (!query.trim()) return capabilities;

    const lowerCaseQuery = query.toLowerCase();
    const filtered = {};

    Object.entries(capabilities).forEach(([level1Name, level1Data]) => {
      const level1Match =
        level1Name.toLowerCase().includes(lowerCaseQuery) ||
        level1Data.desc.toLowerCase().includes(lowerCaseQuery);

      const filteredLevel1 = {
        ...level1Data,
        children: {},
        matched: level1Match,
      };
      let hasChildMatch = false;

      if (level1Data.children) {
        Object.entries(level1Data.children).forEach(
          ([level2Name, level2Data]) => {
            const level2Match =
              level2Name.toLowerCase().includes(lowerCaseQuery) ||
              level2Data.desc.toLowerCase().includes(lowerCaseQuery);

            const filteredLevel2 = {
              ...level2Data,
              children: {},
              matched: level2Match,
            };
            let hasGrandChildMatch = false;

            if (level2Data.children && maxLevel >= 3) {
              Object.entries(level2Data.children).forEach(
                ([level3Name, level3Data]) => {
                  if (maxLevel < 3) return;

                  const level3Match =
                    level3Name.toLowerCase().includes(lowerCaseQuery) ||
                    level3Data.desc.toLowerCase().includes(lowerCaseQuery);

                  const filteredLevel3 = {
                    ...level3Data,
                    children: {},
                    matched: level3Match,
                  };
                  let hasGreatGrandChildMatch = false;

                  if (level3Data.children && maxLevel >= 4) {
                    Object.entries(level3Data.children).forEach(
                      ([level4Name, level4Data]) => {
                        if (maxLevel < 4) return;

                        const level4Match =
                          level4Name.toLowerCase().includes(lowerCaseQuery) ||
                          level4Data.desc
                            .toLowerCase()
                            .includes(lowerCaseQuery);

                        if (level4Match) {
                          filteredLevel3.children[level4Name] = {
                            ...level4Data,
                            matched: true,
                          };
                          hasGreatGrandChildMatch = true;
                        }
                      }
                    );
                  }

                  if (level3Match || hasGreatGrandChildMatch) {
                    filteredLevel2.children[level3Name] = filteredLevel3;
                    hasGrandChildMatch = true;
                  }
                }
              );
            }

            if (level2Match || hasGrandChildMatch) {
              filteredLevel1.children[level2Name] = filteredLevel2;
              hasChildMatch = true;
            }
          }
        );
      }

      if (level1Match || hasChildMatch) {
        filtered[level1Name] = filteredLevel1;
      }
    });

    return filtered;
  };

  const displayedCapabilities = useMemo(() => {
    return filterCapabilitiesFunc(capabilities, searchQuery);
  }, [capabilities, searchQuery, maxLevel]);

  const defaultLevel1ColorsComputed = useMemo(() => {
    const level1Domains = Object.keys(displayedCapabilities);
    const N = level1Domains.length;
    const M = defaultColors.length;
    const defaultColorsForDomains = {};

    if (N === 1) {
      defaultColorsForDomains[level1Domains[0]] = defaultColors[0];
    } else {
      for (let i = 0; i < N; i++) {
        const domain = level1Domains[i];
        const colorIndex = Math.round((i * (M - 1)) / (N - 1));
        defaultColorsForDomains[domain] = defaultColors[colorIndex];
      }
    }
    return defaultColorsForDomains;
  }, [displayedCapabilities, defaultColors]);

  const renderCapabilityRow = (
    name,
    data,
    level,
    className = "",
    style = {}
  ) => {
    return (
      <div
        className={`flex items-center relative group ${className}`}
        style={style}
      >
        <div
          className={`flex-1 ${getPaddingClass(
            level
          )} overflow-hidden overflow-ellipsis flex items-center`}
        >
          <span className={`whitespace-nowrap font-semibold`}>
            {highlightTextFunc(name, searchQuery)}
          </span>
          <span className="text-gray-500 ml-2">{data.id}</span>
        </div>
        <div
          className="flex-shrink-0 ml-2"
          style={{ marginRight: getHeatmapMarginRight(level) }}
        >
          {renderScoreBox(data.score)}
        </div>
        <div
          className={`absolute z-10 bg-black text-white p-2 rounded text-xs w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none top-full mt-2 left-0`}
          role="tooltip"
        >
          {data.desc}
        </div>
      </div>
    );
  };

  const getHeatmapMarginRight = (level) => {
    switch (level) {
      case 1:
        return "39px";
      case 2:
        return "13px";
      case 3:
        return "4px";
      default:
        return "0px";
    }
  };

  const renderLevel4 = (capabilities) => {
    return Object.entries(capabilities).map(([name, data]) => (
      <div key={name} className="p-1 border-l-2 border-gray-200 ml-2">
        {renderCapabilityRow(name, data, 4, "text-xs")}
      </div>
    ));
  };

  const renderLevel3 = (capabilities) => {
    if (maxLevel < 3) return null;

    return Object.entries(capabilities).map(([name, data]) => {
      return (
        <div key={name} className="p-2 border rounded">
          {renderCapabilityRow(
            name,
            data,
            3,
            "text-sm font-medium text-gray-800"
          )}
          {data.children &&
            maxLevel >= 4 &&
            Object.keys(data.children).length > 0 && (
              <div className="mt-2">{renderLevel4(data.children)}</div>
            )}
        </div>
      );
    });
  };

  const renderLevel2 = (capabilities) => {
    return Object.entries(capabilities).map(([name, data]) => {
      return (
        <div key={name} className="border rounded p-2 bg-gray-50 mb-4">
          {renderCapabilityRow(name, data, 2, "font-medium mb-2 text-gray-800")}
          {data.children && Object.keys(data.children).length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {renderLevel3(data.children)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p>Loading capabilities...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex gap-6 flex-nowrap">
        {Object.entries(displayedCapabilities).map(([domain, data], index) => {
          const rawColor =
            level1Colors[domain] || defaultLevel1ColorsComputed[domain];
          const backgroundColor = isValidHexColor(rawColor)
            ? rawColor
            : defaultLevel1ColorsComputed[domain] || "transparent";

          return (
            <div key={domain} className="flex flex-col min-w-[450px]">
              {renderCapabilityRow(
                domain,
                data,
                1,
                "text-3xl font-bold mb-4 text-left text-gray-800",
                {}
              )}
              <div
                className="border rounded p-4 flex flex-col"
                style={{ backgroundColor }}
              >
                <div className="flex-1">
                  {data.children &&
                    Object.keys(data.children).length > 0 &&
                    renderLevel2(data.children)}
                </div>
              </div>
            </div>
          );
        })}
        {Object.keys(displayedCapabilities).length === 0 && (
          <p className="text-gray-500">No capabilities match your search.</p>
        )}
      </div>
    </div>
  );
};

// Main Page Component with Header and Footer
const Page = () => {
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [maxLevel, setMaxLevel] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [isColorPanelOpen, setIsColorPanelOpen] = useState(false);
  const [level1Colors, setLevel1Colors] = useState({});
  const [capabilities, setCapabilities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultColors = useMemo(
    () => [
      "#8B246E",
      "#7A1C68",
      "#7A1A1A",
      "#B34700",
      "#8B3E00",
      "#A1421F",
      "#B8860B",
      "#7D6608",
      "#6F4E37",
      "#2C6A0E",
      "#556B2F",
      "#394D2D",
      "#0F4C5C",
      "#003366",
      "#274B61",
      "#001F3F",
      "#3A306B",
      "#00205C",
      "#001B4D",
      "#4B3069",
    ],
    []
  );

  const handleColorChange = (level1Name, color) => {
    setLevel1Colors((prevColors) => ({
      ...prevColors,
      [level1Name]: color,
    }));
  };

  const buildNestedCapabilities = (rows) => {
    const capabilityMap = {};

    rows.forEach((row) => {
      const {
        Level1,
        Level1_ID,
        Level1_Desc,
        Level2,
        Level2_ID,
        Level2_Desc,
        Level3,
        Level3_ID,
        Level3_Desc,
        Level4,
        Level4_ID,
        Level4_Desc,
        Score,
      } = row;

      if (!Level1) return;

      if (!capabilityMap[Level1]) {
        capabilityMap[Level1] = {
          id: Level1_ID || "",
          desc: Level1_Desc || "",
          score: 0,
          children: {},
        };
      }

      const level1 = capabilityMap[Level1];

      if (Level2) {
        if (!level1.children[Level2]) {
          level1.children[Level2] = {
            id: Level2_ID || "",
            desc: Level2_Desc || "",
            score: 0,
            children: {},
          };
        }

        const level2 = level1.children[Level2];

        if (Level3) {
          if (!level2.children[Level3]) {
            level2.children[Level3] = {
              id: Level3_ID || "",
              desc: Level3_Desc || "",
              score: 0,
              children: {},
            };
          }

          const level3 = level2.children[Level3];

          if (Level4) {
            if (!level3.children[Level4]) {
              level3.children[Level4] = {
                id: Level4_ID || "",
                desc: Level4_Desc || "",
                score: Number(Score),
              };
            } else {
              level3.children[Level4].score = Number(Score);
            }
          }
        }
      }
    });

    return capabilityMap;
  };

  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const response = await fetch("/business-capabilities.csv");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: {
            Score: true,
          },
          complete: (results) => {
            const data = results.data;
            const nestedData = buildNestedCapabilities(data);
            setCapabilities(nestedData);
            setLoading(false);
          },
          error: (err) => {
            setError(err.message || "Error parsing CSV");
            setLoading(false);
          },
        });
      } catch (err) {
        setError(err.message || "Error fetching CSV");
        setLoading(false);
      }
    };

    fetchCSV();
  }, []);

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

      <main className="flex-1 p-6 overflow-y-auto overflow-x-auto">
        <CapabilityMap
          capabilities={capabilities}
          loading={loading}
          error={error}
          searchQuery={searchQuery}
          showHeatMap={showHeatMap}
          maxLevel={maxLevel}
          level1Colors={level1Colors}
          handleColorChange={handleColorChange}
        />
      </main>

      <Footer
        isColorPanelOpen={isColorPanelOpen}
        setIsColorPanelOpen={setIsColorPanelOpen}
      />

      <div className="h-16"></div>

      {isColorPanelOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50">
          <div
            className="fixed inset-0 bg-black opacity-50 z-40"
            onClick={() => setIsColorPanelOpen(false)}
          ></div>
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg z-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Customize Level 1 Colors
              </h2>
              <button
                onClick={() => setIsColorPanelOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {Object.keys(capabilities).map((level1Name) => (
                <div
                  key={level1Name}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium">{level1Name}</span>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={
                        isValidHexColor(level1Colors[level1Name])
                          ? level1Colors[level1Name]
                          : defaultLevel1ColorsComputed[level1Name] || "#ffffff"
                      }
                      onChange={(e) =>
                        handleColorChange(level1Name, e.target.value)
                      }
                      className="w-10 h-10 border rounded"
                    />
                    <input
                      type="text"
                      value={level1Colors[level1Name] || ""}
                      onChange={(e) =>
                        handleColorChange(level1Name, e.target.value)
                      }
                      className={`w-24 border rounded ml-2 ${
                        isValidHexColor(level1Colors[level1Name])
                          ? ""
                          : "border-red-500"
                      }`}
                      placeholder={
                        defaultLevel1ColorsComputed[level1Name] || "#ffffff"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsColorPanelOpen(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
