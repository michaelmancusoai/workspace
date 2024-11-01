"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import Papa, { ParseResult } from "papaparse";

// Define the structure of each capability
type CapabilityData = {
  id: string;
  desc: string;
  score: number; // Score is now required and comes from CSV
  children?: Record<string, CapabilityData>;
  matched?: boolean; // Indicates if this node matches the search
};

// Define the structure of each CSV row
type CSVRow = {
  Level1: string;
  Level1_ID: string;
  Level1_Desc: string;
  Level2?: string;
  Level2_ID?: string;
  Level2_Desc?: string;
  Level3?: string;
  Level3_ID?: string;
  Level3_Desc?: string;
  Level4?: string;
  Level4_ID?: string;
  Level4_Desc?: string;
  Score: number; // New Score field
};

// Function to map level to padding classes
const getPaddingClass = (level: number) => {
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

// Function to check if a string is a valid hex color
const isValidHexColor = (hex: string): boolean => {
  return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
};

// Function to get appropriate text color based on background color
const getContrastYIQ = (hexcolor: string) => {
  hexcolor = hexcolor.replace("#", "");
  if (hexcolor.length === 3) {
    hexcolor =
      hexcolor[0] +
      hexcolor[0] +
      hexcolor[1] +
      hexcolor[1] +
      hexcolor[2] +
      hexcolor[2];
  }
  if (hexcolor.length !== 6) {
    return "black"; // Default to black if invalid hex color
  }
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
};

const CapabilityMap = () => {
  const [capabilities, setCapabilities] = useState<
    Record<string, CapabilityData>
  >({});
  const [showHeatMap, setShowHeatMap] = useState<boolean>(true);
  const [maxLevel, setMaxLevel] = useState<number>(2); // Segmented button: 2,3,4
  const [searchQuery, setSearchQuery] = useState<string>(""); // Search query
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [level1Colors, setLevel1Colors] = useState<Record<string, string>>({}); // Background colors
  const [isColorPanelOpen, setIsColorPanelOpen] = useState<boolean>(false); // Bottom panel

  // Updated list of default colors for Level 1 columns
  const defaultColors = [
    "#8B246E", // Vibrant Magenta
    "#7A1C68", // Dark Magenta
    "#7A1A1A", // Crimson Red
    "#B34700", // Dark Orange
    "#8B3E00", // Burnt Orange
    "#A1421F", // Dark Coral
    "#B8860B", // Dark Goldenrod
    "#7D6608", // Mustard Yellow
    "#6F4E37", // Golden Brown
    "#2C6A0E", // Forest Green
    "#556B2F", // Olive Green
    "#394D2D", // Dark Moss Green
    "#0F4C5C", // Teal Blue
    "#003366", // Deep Blue
    "#274B61", // Steel Blue
    "#001F3F", // Navy Blue
    "#3A306B", // Deep Purple
    "#00205C", // Navy
    "#001B4D", // Deep Navy
    "#4B3069", // Dark Plum
  ];

  // Effect to handle automatic toggle adjustments based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      setMaxLevel(4);
    }
  }, [searchQuery]);

  // Effect to handle unchecking maxLevel when necessary
  useEffect(() => {
    if (maxLevel < 3 && maxLevel < 4) {
      // No action needed since maxLevel defines the limit
    }
  }, [maxLevel]);

  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const response = await fetch("/business-capabilities.csv"); // Updated CSV filename
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        Papa.parse<CSVRow>(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: {
            Score: true, // Parse 'Score' as a number
          },
          complete: (results: ParseResult<CSVRow>) => {
            const data = results.data;
            const nestedData = buildNestedCapabilities(data);
            setCapabilities(nestedData);
            setLoading(false);
          },
          error: (err: any) => {
            setError(err.message || "Error parsing CSV");
            setLoading(false);
          },
        });
      } catch (err: any) {
        setError(err.message || "Error fetching CSV");
        setLoading(false);
      }
    };

    fetchCSV();
  }, []);

  // Function to build nested capabilities from CSV rows
  const buildNestedCapabilities = (
    rows: CSVRow[]
  ): Record<string, CapabilityData> => {
    const capabilityMap: Record<string, CapabilityData> = {};

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

      // Skip if Level1 is missing
      if (!Level1) return;

      if (!capabilityMap[Level1]) {
        capabilityMap[Level1] = {
          id: Level1_ID || "",
          desc: Level1_Desc || "",
          score: 0, // Initialize score to 0 by default
          children: {},
        };
      }

      const level1 = capabilityMap[Level1];

      // Handle Level2
      if (Level2) {
        if (!level1.children![Level2]) {
          level1.children![Level2] = {
            id: Level2_ID || "",
            desc: Level2_Desc || "",
            score: 0, // Initialize score to 0 by default
            children: {},
          };
        }

        const level2 = level1.children![Level2];

        // Handle Level3
        if (Level3) {
          if (!level2.children![Level3]) {
            level2.children![Level3] = {
              id: Level3_ID || "",
              desc: Level3_Desc || "",
              score: 0, // Initialize score to 0 by default
              children: {},
            };
          }

          const level3 = level2.children![Level3];

          // Handle Level4
          if (Level4) {
            if (!level3.children![Level4]) {
              level3.children![Level4] = {
                id: Level4_ID || "",
                desc: Level4_Desc || "",
                score: Number(Score), // Ensure Score is a number
              };
            } else {
              // If Level4 already exists, update the score
              level3.children![Level4].score = Number(Score);
            }
          }
        }
      }
    });

    return capabilityMap;
  };

  // Function to determine the color based on score
  const getScoreColor = (score: number) => {
    if (score === 0) return "bg-gray-400"; // Map score 0 to gray
    if (score >= 85) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Function to render the score heatmap
  const renderScore = (score: number) =>
    showHeatMap ? (
      <div className={`w-8 h-8 rounded ${getScoreColor(score)}`}></div>
    ) : null;

  // Function to highlight matching text
  const highlightText = (text: string, query: string) => {
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

  // Function to render each capability row with level-based indentation
  const renderCapabilityRow = (
    name: string,
    data: CapabilityData,
    level: number,
    className = "",
    style: React.CSSProperties = {}
  ) => {
    const paddingClass = getPaddingClass(level);

    // Tooltip positioning: always below the text
    const tooltipPositionClass = "top-full mt-2 left-0";

    // Determine margin-right for the heat map color box based on level
    let heatmapMarginRight = "0px";
    switch (level) {
      case 1:
        heatmapMarginRight = "39px";
        break;
      case 2:
        heatmapMarginRight = "13px";
        break;
      case 3:
        heatmapMarginRight = "4px";
        break;
      default:
        heatmapMarginRight = "0px";
    }

    return (
      <div
        className={`flex items-center relative group ${className}`}
        style={style}
      >
        <div
          className={`flex-1 ${paddingClass} overflow-hidden overflow-ellipsis flex items-center`}
        >
          {/* Highlight matching text */}
          <span className={`whitespace-nowrap font-semibold`}>
            {highlightText(name, searchQuery)}
          </span>
          <span className="text-gray-500 ml-2">{data.id}</span>
        </div>
        <div
          className="flex-shrink-0 ml-2"
          style={{ marginRight: heatmapMarginRight }}
        >
          {renderScore(data.score)}
        </div>
        {/* Tooltip */}
        <div
          className={`absolute z-10 bg-black text-white p-2 rounded text-xs w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${tooltipPositionClass}`}
          role="tooltip"
        >
          {data.desc}
        </div>
      </div>
    );
  };

  // Function to filter capabilities based on search query and maxLevel
  const filterCapabilities = (
    capabilities: Record<string, CapabilityData>,
    query: string
  ): Record<string, CapabilityData> => {
    if (!query.trim()) return capabilities;

    const lowerCaseQuery = query.toLowerCase();

    const filtered: Record<string, CapabilityData> = {};

    Object.entries(capabilities).forEach(([level1Name, level1Data]) => {
      // Check if Level1 matches
      const level1Match =
        level1Name.toLowerCase().includes(lowerCaseQuery) ||
        level1Data.desc.toLowerCase().includes(lowerCaseQuery);

      // Initialize children if needed
      const filteredLevel1: CapabilityData = {
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

            const filteredLevel2: CapabilityData = {
              ...level2Data,
              children: {},
              matched: level2Match,
            };
            let hasGrandChildMatch = false;

            if (level2Data.children && maxLevel >= 3) {
              Object.entries(level2Data.children).forEach(
                ([level3Name, level3Data]) => {
                  if (maxLevel < 3) return; // Do not include Level3 if maxLevel <3

                  const level3Match =
                    level3Name.toLowerCase().includes(lowerCaseQuery) ||
                    level3Data.desc.toLowerCase().includes(lowerCaseQuery);

                  const filteredLevel3: CapabilityData = {
                    ...level3Data,
                    children: {},
                    matched: level3Match,
                  };
                  let hasGreatGrandChildMatch = false;

                  if (level3Data.children && maxLevel >= 4) {
                    Object.entries(level3Data.children).forEach(
                      ([level4Name, level4Data]) => {
                        if (maxLevel < 4) return; // Do not include Level4 if maxLevel <4

                        const level4Match =
                          level4Name.toLowerCase().includes(lowerCaseQuery) ||
                          level4Data.desc
                            .toLowerCase()
                            .includes(lowerCaseQuery);

                        if (level4Match) {
                          filteredLevel3.children![level4Name] = {
                            ...level4Data,
                            matched: true,
                          };
                          hasGreatGrandChildMatch = true;
                        }
                      }
                    );
                  }

                  if (level3Match || hasGreatGrandChildMatch) {
                    filteredLevel2.children![level3Name] = filteredLevel3;
                    hasGrandChildMatch = true;
                  }
                }
              );
            }

            if (level2Match || hasGrandChildMatch) {
              filteredLevel1.children![level2Name] = filteredLevel2;
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

  // Memoize the filtered capabilities for performance
  const displayedCapabilities = useMemo(() => {
    return filterCapabilities(capabilities, searchQuery);
  }, [capabilities, searchQuery, maxLevel]);

  // Compute default colors for Level 1 columns based on the number of columns
  const defaultLevel1Colors = useMemo(() => {
    const level1Domains = Object.keys(displayedCapabilities);
    const N = level1Domains.length;
    const M = defaultColors.length;
    const defaultColorsForDomains: Record<string, string> = {};

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
  }, [displayedCapabilities]);

  // Function to render Level 4 capabilities
  const renderLevel4 = (capabilities: Record<string, CapabilityData>) => {
    return Object.entries(capabilities).map(([name, data]) => (
      <div key={name} className="p-1 border-l-2 border-gray-200 ml-2">
        {renderCapabilityRow(name, data, 4, "text-xs")}
      </div>
    ));
  };

  // Function to render Level 3 capabilities
  const renderLevel3 = (capabilities: Record<string, CapabilityData>) => {
    if (maxLevel < 3) return null;

    return Object.entries(capabilities).map(([name, data]) => {
      const capabilityData = data as CapabilityData;
      return (
        <div key={name} className="p-2 border rounded">
          {renderCapabilityRow(name, capabilityData, 3, "text-sm font-medium")}
          {capabilityData.children &&
            maxLevel >= 4 &&
            Object.keys(capabilityData.children).length > 0 && (
              <div className="mt-2">
                {renderLevel4(capabilityData.children)}
              </div>
            )}
        </div>
      );
    });
  };

  // Function to render Level 2 capabilities
  const renderLevel2 = (capabilities: Record<string, CapabilityData>) => {
    return Object.entries(capabilities).map(([name, data]) => {
      const capabilityData = data as CapabilityData;
      return (
        <div key={name} className="border rounded p-2 bg-gray-50 mb-4">
          {renderCapabilityRow(name, capabilityData, 2, "font-medium mb-2")}
          {capabilityData.children &&
            Object.keys(capabilityData.children).length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {renderLevel3(capabilityData.children)}
              </div>
            )}
        </div>
      );
    });
  };

  // Handler for setting background color of Level1 capabilities
  const handleColorChange = (level1Name: string, color: string) => {
    setLevel1Colors((prevColors) => ({
      ...prevColors,
      [level1Name]: color,
    }));
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

  // Removed the calculation of level1Count and the message displaying it

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header Section with Title and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold whitespace-nowrap">
            Dental Practice Capability Model
          </h1>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-6">
            {/* Search Field */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search capabilities..."
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            {/* Toggles and Segmented Button Group */}
            <div className="flex items-center space-x-4">
              {/* Heat Map Toggle */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showHeatMap}
                  onChange={() => setShowHeatMap((prev: boolean) => !prev)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Show Heat Map</span>
              </label>
              {/* Segmented Button Group for Levels */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setMaxLevel(2)}
                  className={`px-4 py-2 rounded ${
                    maxLevel === 2
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  disabled={searchQuery.trim() !== ""}
                >
                  Level 2
                </button>
                <button
                  onClick={() => setMaxLevel(3)}
                  className={`px-4 py-2 rounded ${
                    maxLevel === 3
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  disabled={searchQuery.trim() !== ""}
                >
                  Level 3
                </button>
                <button
                  onClick={() => setMaxLevel(4)}
                  className={`px-4 py-2 rounded ${
                    maxLevel === 4
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  disabled={searchQuery.trim() !== ""}
                >
                  Level 4
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Removed the section displaying the "Showing X Level 1 capabilities" message */}
        {/* Capabilities Display */}
        <div className="flex gap-6 overflow-x-auto">
          {Object.entries(displayedCapabilities).map(
            ([domain, data], index) => {
              const rawColor =
                level1Colors[domain] || defaultLevel1Colors[domain];
              const backgroundColor = isValidHexColor(rawColor)
                ? rawColor
                : "transparent";

              return (
                <div key={domain} className="flex flex-col">
                  {/* Level 1 capability header */}
                  {renderCapabilityRow(
                    domain,
                    data,
                    1,
                    "text-lg font-bold mb-4 text-center"
                  )}
                  {/* Column with Level 2 capabilities */}
                  <div
                    className="border rounded p-4 flex flex-col min-w-[450px]"
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
            }
          )}
          {Object.keys(displayedCapabilities).length === 0 && (
            <p className="text-gray-500">No capabilities match your search.</p>
          )}
        </div>
        {/* Button to Open Color Panel */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsColorPanelOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Customize Colors
          </button>
        </div>
        {/* Bottom Panel for Color Customization */}
        {isColorPanelOpen && (
          <div className="fixed inset-0 flex justify-center items-end z-20">
            <div
              className="fixed inset-0 bg-black opacity-50"
              onClick={() => setIsColorPanelOpen(false)}
            ></div>
            <div className="bg-white w-full max-w-md p-6 rounded-t-lg shadow-lg z-30">
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
                            : defaultLevel1Colors[level1Name] || "#ffffff"
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
                          defaultLevel1Colors[level1Name] || "#ffffff"
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
      </CardContent>
    </Card>
  );
};

export default function Home() {
  return (
    <main>
      <CapabilityMap />
    </main>
  );
}
