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

const CapabilityMap = () => {
  const [capabilities, setCapabilities] = useState<
    Record<string, CapabilityData>
  >({});
  const [showHeatMap, setShowHeatMap] = useState<boolean>(true);
  const [showL3, setShowL3] = useState<boolean>(true); // Toggle for Level 3
  const [showL4, setShowL4] = useState<boolean>(true); // Toggle for Level 4
  const [searchQuery, setSearchQuery] = useState<string>(""); // Search query
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to handle automatic toggle adjustments based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      setShowL3(true);
      setShowL4(true);
    }
  }, [searchQuery]);

  // Effect to handle unchecking Level 4 when Level 3 is unchecked
  useEffect(() => {
    if (!showL3 && showL4) {
      setShowL4(false);
    }
  }, [showL3, showL4]);

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
    className = ""
  ) => {
    const paddingClass = getPaddingClass(level);

    return (
      <div className={`flex items-center relative ${className}`}>
        <div
          className={`flex-1 ${paddingClass} overflow-hidden overflow-ellipsis flex items-center`}
        >
          {/* Highlight matching text */}
          <span className={`whitespace-nowrap font-semibold`}>
            {highlightText(name, searchQuery)}
          </span>
          <span className="text-gray-500 ml-2">{data.id}</span>
        </div>
        <div className="flex-shrink-0 ml-2">{renderScore(data.score)}</div>
        <div
          className="absolute z-10 bg-black text-white p-2 rounded text-xs -top-8 left-0 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          role="tooltip"
          aria-hidden={!showHeatMap}
        >
          {data.desc}
        </div>
      </div>
    );
  };

  // Function to filter capabilities based on search query
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

            if (level2Data.children && showL3) {
              Object.entries(level2Data.children).forEach(
                ([level3Name, level3Data]) => {
                  const level3Match =
                    level3Name.toLowerCase().includes(lowerCaseQuery) ||
                    level3Data.desc.toLowerCase().includes(lowerCaseQuery);

                  const filteredLevel3: CapabilityData = {
                    ...level3Data,
                    children: {},
                    matched: level3Match,
                  };
                  let hasGreatGrandChildMatch = false;

                  if (level3Data.children && showL4) {
                    Object.entries(level3Data.children).forEach(
                      ([level4Name, level4Data]) => {
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
  }, [capabilities, searchQuery, showL3, showL4]);

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
    if (!showL3) return null;

    return Object.entries(capabilities).map(([name, data]) => {
      const capabilityData = data as CapabilityData;
      return (
        <div key={name} className="p-2 border rounded mb-4">
          {renderCapabilityRow(name, capabilityData, 3, "text-sm font-medium")}
          {capabilityData.children &&
            showL4 &&
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

  // Calculate the number of Level 1 capabilities
  const level1Count = Object.keys(displayedCapabilities).length;

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header Section with Title and Toggles */}
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
            {/* Toggles */}
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
              {/* Level 3 Toggle */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showL3}
                  onChange={() => setShowL3((prev: boolean) => !prev)}
                  className="rounded border-gray-300"
                  disabled={searchQuery.trim() !== ""}
                />
                <span className="text-sm">Show Level 3</span>
              </label>
              {/* Level 4 Toggle */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showL4}
                  onChange={() => setShowL4((prev: boolean) => !prev)}
                  className="rounded border-gray-300"
                  disabled={searchQuery.trim() !== ""}
                />
                <span className="text-sm">Show Level 4</span>
              </label>
            </div>
          </div>
        </div>
        {/* Displaying Search Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {level1Count} Level 1{" "}
            {level1Count === 1 ? "capability" : "capabilities"}
          </p>
        </div>
        {/* Capabilities Display */}
        <div className="flex gap-6 overflow-x-auto">
          {Object.entries(displayedCapabilities).map(([domain, data]) => (
            <div
              key={domain}
              className="border rounded p-4 flex flex-col min-w-[450px]"
            >
              {renderCapabilityRow(domain, data, 1, "text-lg font-bold mb-4")}
              <div className="flex-1">
                {data.children &&
                  Object.keys(data.children).length > 0 &&
                  renderLevel2(data.children)}
              </div>
            </div>
          ))}
          {level1Count === 0 && (
            <p className="text-gray-500">No capabilities match your search.</p>
          )}
        </div>
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
