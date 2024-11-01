"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import Papa, { ParseResult } from "papaparse";

// Define the structure of each capability
type CapabilityData = {
  id: string;
  desc: string;
  score: number; // Score is now required and comes from CSV
  children?: Record<string, CapabilityData>; // Nested child capabilities
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

// Function to map level to padding classes for indentation
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

// Function to get appropriate text color based on background color for contrast
const getContrastYIQ = (hexcolor: string) => {
  hexcolor = hexcolor.replace("#", "");
  // Expand shorthand hex color to full form if necessary
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
  // Parse RGB components
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  // Calculate YIQ for brightness
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white"; // Return text color based on brightness
};

const CapabilityMap = () => {
  // State to hold the nested capabilities data
  const [capabilities, setCapabilities] = useState<
    Record<string, CapabilityData>
  >({});
  // State to toggle heatmap display
  const [showHeatMap, setShowHeatMap] = useState<boolean>(true);
  // State to control the maximum level displayed (2, 3, or 4)
  const [maxLevel, setMaxLevel] = useState<number>(2);
  // State for search query input
  const [searchQuery, setSearchQuery] = useState<string>("");
  // State to handle loading status
  const [loading, setLoading] = useState<boolean>(true);
  // State to handle error messages
  const [error, setError] = useState<string | null>(null);
  // State to store custom background colors for Level 1 capabilities
  const [level1Colors, setLevel1Colors] = useState<Record<string, string>>({});
  // State to control the visibility of the color customization panel
  const [isColorPanelOpen, setIsColorPanelOpen] = useState<boolean>(false);

  // List of default colors for Level 1 columns
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

  // Effect to automatically set maxLevel to 4 when a search query is present
  useEffect(() => {
    if (searchQuery.trim()) {
      setMaxLevel(4);
    }
  }, [searchQuery]);

  // Effect to handle adjustments when maxLevel changes (currently no action needed)
  useEffect(() => {
    if (maxLevel < 3 && maxLevel < 4) {
      // Placeholder for any future adjustments
    }
  }, [maxLevel]);

  // Effect to fetch and parse the CSV data on component mount
  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const response = await fetch("/business-capabilities.csv"); // Fetch the CSV file
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        // Parse the CSV using PapaParse
        Papa.parse<CSVRow>(csvText, {
          header: true, // Use the first row as headers
          skipEmptyLines: true, // Skip empty lines
          dynamicTyping: {
            Score: true, // Parse 'Score' as a number
          },
          complete: (results: ParseResult<CSVRow>) => {
            const data = results.data;
            // Build nested capabilities from parsed CSV data
            const nestedData = buildNestedCapabilities(data);
            setCapabilities(nestedData); // Update state with nested data
            setLoading(false); // Set loading to false after data is loaded
          },
          error: (err: any) => {
            setError(err.message || "Error parsing CSV"); // Handle parsing errors
            setLoading(false);
          },
        });
      } catch (err: any) {
        setError(err.message || "Error fetching CSV"); // Handle fetch errors
        setLoading(false);
      }
    };

    fetchCSV(); // Initiate CSV fetch on mount
  }, []);

  /**
   * Function to build nested capabilities from CSV rows
   * @param rows - Array of CSVRow objects
   * @returns Nested Record of CapabilityData
   */
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

      // Skip the row if Level1 is missing
      if (!Level1) return;

      // Initialize Level1 capability if it doesn't exist
      if (!capabilityMap[Level1]) {
        capabilityMap[Level1] = {
          id: Level1_ID || "",
          desc: Level1_Desc || "",
          score: 0, // Initialize score to 0 by default
          children: {},
        };
      }

      const level1 = capabilityMap[Level1];

      // Handle Level2 capabilities
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

        // Handle Level3 capabilities
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

          // Handle Level4 capabilities
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

    return capabilityMap; // Return the nested capabilities
  };

  /**
   * Function to determine the background color class based on score
   * @param score - Numeric score value
   * @returns Tailwind CSS class for background color
   */
  const getScoreColor = (score: number) => {
    if (score === 0) return "bg-gray-400"; // Map score 0 to gray
    if (score >= 85) return "bg-green-500"; // High score - green
    if (score >= 70) return "bg-yellow-500"; // Medium score - yellow
    return "bg-red-500"; // Low score - red
  };

  /**
   * Function to render the score as a colored heatmap box
   * @param score - Numeric score value
   * @returns JSX element representing the score heatmap
   */
  const renderScore = (score: number) =>
    showHeatMap ? (
      <div className={`w-8 h-8 rounded ${getScoreColor(score)}`}></div>
    ) : null;

  /**
   * Function to highlight matching text based on the search query
   * @param text - The text to highlight
   * @param query - The search query
   * @returns JSX element with highlighted matching parts
   */
  const highlightText = (text: string, query: string) => {
    if (!query) return text; // Return original text if no query
    const regex = new RegExp(`(${query})`, "gi"); // Create regex for case-insensitive match
    const parts = text.split(regex); // Split text by matching parts
    return (
      <>
        {parts.map((part, index) =>
          regex.test(part) ? (
            // Highlight matching parts with a background color
            <span key={index} className="bg-yellow-200">
              {part}
            </span>
          ) : (
            part // Return non-matching parts as is
          )
        )}
      </>
    );
  };

  /**
   * Function to render a capability row with proper indentation and styling
   * @param name - Name of the capability
   * @param data - CapabilityData object
   * @param level - Hierarchical level (1 to 4)
   * @param className - Additional CSS classes
   * @param style - Inline styles
   * @returns JSX element representing the capability row
   */
  const renderCapabilityRow = (
    name: string,
    data: CapabilityData,
    level: number,
    className = "",
    style: React.CSSProperties = {}
  ) => {
    const paddingClass = getPaddingClass(level); // Get padding based on level

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
          {/* Display the capability ID */}
          <span className="text-gray-500 ml-2">{data.id}</span>
        </div>
        {/* Render the score heatmap */}
        <div
          className="flex-shrink-0 ml-2"
          style={{ marginRight: heatmapMarginRight }}
        >
          {renderScore(data.score)}
        </div>
        {/* Tooltip displaying the capability description */}
        <div
          className={`absolute z-10 bg-black text-white p-2 rounded text-xs w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${tooltipPositionClass}`}
          role="tooltip"
        >
          {data.desc}
        </div>
      </div>
    );
  };

  /**
   * Function to filter capabilities based on search query and maxLevel
   * @param capabilities - Nested capabilities data
   * @param query - Search query string
   * @returns Filtered nested capabilities data
   */
  const filterCapabilities = (
    capabilities: Record<string, CapabilityData>,
    query: string
  ): Record<string, CapabilityData> => {
    if (!query.trim()) return capabilities; // Return all capabilities if query is empty

    const lowerCaseQuery = query.toLowerCase(); // Convert query to lowercase for case-insensitive search
    const filtered: Record<string, CapabilityData> = {};

    // Iterate over each Level1 capability
    Object.entries(capabilities).forEach(([level1Name, level1Data]) => {
      // Check if Level1 name or description matches the query
      const level1Match =
        level1Name.toLowerCase().includes(lowerCaseQuery) ||
        level1Data.desc.toLowerCase().includes(lowerCaseQuery);

      // Initialize a filtered Level1 capability
      const filteredLevel1: CapabilityData = {
        ...level1Data,
        children: {},
        matched: level1Match,
      };
      let hasChildMatch = false; // Flag to check if any child matches

      // If Level1 has children, iterate over them
      if (level1Data.children) {
        Object.entries(level1Data.children).forEach(
          ([level2Name, level2Data]) => {
            // Check if Level2 name or description matches the query
            const level2Match =
              level2Name.toLowerCase().includes(lowerCaseQuery) ||
              level2Data.desc.toLowerCase().includes(lowerCaseQuery);

            // Initialize a filtered Level2 capability
            const filteredLevel2: CapabilityData = {
              ...level2Data,
              children: {},
              matched: level2Match,
            };
            let hasGrandChildMatch = false; // Flag to check if any Level3 matches

            // If Level2 has children and maxLevel allows, iterate over Level3
            if (level2Data.children && maxLevel >= 3) {
              Object.entries(level2Data.children).forEach(
                ([level3Name, level3Data]) => {
                  if (maxLevel < 3) return; // Do not include Level3 if maxLevel <3

                  // Check if Level3 name or description matches the query
                  const level3Match =
                    level3Name.toLowerCase().includes(lowerCaseQuery) ||
                    level3Data.desc.toLowerCase().includes(lowerCaseQuery);

                  // Initialize a filtered Level3 capability
                  const filteredLevel3: CapabilityData = {
                    ...level3Data,
                    children: {},
                    matched: level3Match,
                  };
                  let hasGreatGrandChildMatch = false; // Flag for Level4 matches

                  // If Level3 has children and maxLevel allows, iterate over Level4
                  if (level3Data.children && maxLevel >= 4) {
                    Object.entries(level3Data.children).forEach(
                      ([level4Name, level4Data]) => {
                        if (maxLevel < 4) return; // Do not include Level4 if maxLevel <4

                        // Check if Level4 name or description matches the query
                        const level4Match =
                          level4Name.toLowerCase().includes(lowerCaseQuery) ||
                          level4Data.desc
                            .toLowerCase()
                            .includes(lowerCaseQuery);

                        if (level4Match) {
                          // If Level4 matches, include it in the filtered data
                          filteredLevel3.children![level4Name] = {
                            ...level4Data,
                            matched: true,
                          };
                          hasGreatGrandChildMatch = true;
                        }
                      }
                    );
                  }

                  // If Level3 matches or any of its children match, include it
                  if (level3Match || hasGreatGrandChildMatch) {
                    filteredLevel2.children![level3Name] = filteredLevel3;
                    hasGrandChildMatch = true;
                  }
                }
              );
            }

            // If Level2 matches or any of its children match, include it
            if (level2Match || hasGrandChildMatch) {
              filteredLevel1.children![level2Name] = filteredLevel2;
              hasChildMatch = true;
            }
          }
        );
      }

      // If Level1 matches or any of its children match, include it in the filtered data
      if (level1Match || hasChildMatch) {
        filtered[level1Name] = filteredLevel1;
      }
    });

    return filtered; // Return the filtered capabilities
  };

  // Memoize the filtered capabilities to optimize performance
  const displayedCapabilities = useMemo(() => {
    return filterCapabilities(capabilities, searchQuery);
  }, [capabilities, searchQuery, maxLevel]);

  /**
   * Compute default colors for Level 1 columns based on the number of columns
   * This ensures a distinct color for each Level1 capability
   */
  const defaultLevel1Colors = useMemo(() => {
    const level1Domains = Object.keys(displayedCapabilities); // Get all Level1 names
    const N = level1Domains.length; // Number of Level1 capabilities
    const M = defaultColors.length; // Number of default colors available
    const defaultColorsForDomains: Record<string, string> = {};

    if (N === 1) {
      // If only one Level1, assign the first default color
      defaultColorsForDomains[level1Domains[0]] = defaultColors[0];
    } else {
      // Distribute colors evenly across Level1 capabilities
      for (let i = 0; i < N; i++) {
        const domain = level1Domains[i];
        const colorIndex = Math.round((i * (M - 1)) / (N - 1));
        defaultColorsForDomains[domain] = defaultColors[colorIndex];
      }
    }
    return defaultColorsForDomains; // Return the mapping of Level1 to colors
  }, [displayedCapabilities]);

  /**
   * Function to render Level4 capabilities
   * @param capabilities - Level4 capabilities data
   * @returns Array of JSX elements representing Level4 capabilities
   */
  const renderLevel4 = (capabilities: Record<string, CapabilityData>) => {
    return Object.entries(capabilities).map(([name, data]) => (
      <div key={name} className="p-1 border-l-2 border-gray-200 ml-2">
        {renderCapabilityRow(name, data, 4, "text-xs")}
      </div>
    ));
  };

  /**
   * Function to render Level3 capabilities
   * @param capabilities - Level3 capabilities data
   * @returns Array of JSX elements representing Level3 capabilities
   */
  const renderLevel3 = (capabilities: Record<string, CapabilityData>) => {
    if (maxLevel < 3) return null; // Do not render if maxLevel is less than 3

    return Object.entries(capabilities).map(([name, data]) => {
      const capabilityData = data as CapabilityData;
      return (
        <div key={name} className="p-2 border rounded">
          {renderCapabilityRow(name, capabilityData, 3, "text-sm font-medium")}
          {/* Render Level4 capabilities if available and maxLevel allows */}
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

  /**
   * Function to render Level2 capabilities
   * @param capabilities - Level2 capabilities data
   * @returns Array of JSX elements representing Level2 capabilities
   */
  const renderLevel2 = (capabilities: Record<string, CapabilityData>) => {
    return Object.entries(capabilities).map(([name, data]) => {
      const capabilityData = data as CapabilityData;
      return (
        <div key={name} className="border rounded p-2 bg-gray-50 mb-4">
          {renderCapabilityRow(name, capabilityData, 2, "font-medium mb-2")}
          {/* Render Level3 capabilities if available */}
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

  /**
   * Handler for setting background color of Level1 capabilities
   * @param level1Name - Name of the Level1 capability
   * @param color - New color value
   */
  const handleColorChange = (level1Name: string, color: string) => {
    setLevel1Colors((prevColors) => ({
      ...prevColors,
      [level1Name]: color,
    }));
  };

  // Render loading state
  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p>Loading capabilities...</p>
        </CardContent>
      </Card>
    );
  }

  // Render error state
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
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Header Section with Title and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          {/* Updated Title with larger font size */}
          <h1 className="text-5xl font-bold whitespace-nowrap">
            Dental Practice Capability Model
          </h1>
          {/* Controls: Search, Heatmap Toggle, and Level Selector */}
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
                {/* Button for Level 2 */}
                <button
                  onClick={() => setMaxLevel(2)}
                  className={`px-4 py-2 rounded ${
                    maxLevel === 2
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  disabled={searchQuery.trim() !== ""} // Disable when searching
                >
                  Level 2
                </button>
                {/* Button for Level 3 */}
                <button
                  onClick={() => setMaxLevel(3)}
                  className={`px-4 py-2 rounded ${
                    maxLevel === 3
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  disabled={searchQuery.trim() !== ""} // Disable when searching
                >
                  Level 3
                </button>
                {/* Button for Level 4 */}
                <button
                  onClick={() => setMaxLevel(4)}
                  className={`px-4 py-2 rounded ${
                    maxLevel === 4
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  disabled={searchQuery.trim() !== ""} // Disable when searching
                >
                  Level 4
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Capabilities Display Section */}
        <div className="flex gap-6 overflow-x-auto">
          {Object.entries(displayedCapabilities).map(
            ([domain, data], index) => {
              // Determine the background color for the Level1 column
              const rawColor =
                level1Colors[domain] || defaultLevel1Colors[domain];
              const backgroundColor = isValidHexColor(rawColor)
                ? rawColor
                : "transparent";

              return (
                <div key={domain} className="flex flex-col">
                  {/* Render Level1 capability header */}
                  {renderCapabilityRow(
                    domain,
                    data,
                    1,
                    "text-3xl font-bold mb-4 text-center"
                  )}
                  {/* Column with Level2 capabilities */}
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
          {/* Display message if no capabilities match the search */}
          {Object.keys(displayedCapabilities).length === 0 && (
            <p className="text-gray-500">No capabilities match your search.</p>
          )}
        </div>
        {/* Button to Open Color Customization Panel */}
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
            {/* Overlay to darken the background */}
            <div
              className="fixed inset-0 bg-black opacity-50"
              onClick={() => setIsColorPanelOpen(false)} // Close panel on overlay click
            ></div>
            {/* Color customization panel */}
            <div className="bg-white w-full max-w-md p-6 rounded-t-lg shadow-lg z-30">
              {/* Panel Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Customize Level 1 Colors
                </h2>
                {/* Close Button */}
                <button
                  onClick={() => setIsColorPanelOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              {/* List of Level1 capabilities with color pickers */}
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {Object.keys(capabilities).map((level1Name) => (
                  <div
                    key={level1Name}
                    className="flex items-center justify-between"
                  >
                    {/* Capability Name */}
                    <span className="font-medium">{level1Name}</span>
                    {/* Color Picker and Input */}
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
                            : "border-red-500" // Highlight invalid hex codes
                        }`}
                        placeholder={
                          defaultLevel1Colors[level1Name] || "#ffffff"
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Close Button at the Bottom of the Panel */}
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

// Export the main Home component which includes the CapabilityMap
export default function Home() {
  return (
    <main>
      <CapabilityMap />
    </main>
  );
}
