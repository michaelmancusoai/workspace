"use client"; // Ensure client-side rendering

import { useEffect, useState, useMemo } from "react";
import Papa from "papaparse"; // Ensure PapaParse is installed: npm install papaparse

// Simple Card and CardContent components using Tailwind CSS
const Card = ({ children, className }) => (
  <div className={`bg-white shadow rounded ${className}`}>{children}</div>
);

const CardContent = ({ children, className }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

// Dropdown Component
const Dropdown = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
      >
        Dental Practice Capability Model
        <svg
          className="-mr-1 ml-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.354a.75.75 0 111.14.976l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="origin-top-left absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {/* Future menu items can be added here */}
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Option 1
            </a>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Option 2
            </a>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Option 3
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

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
    ],
    []
  );

  /**
   * Determines the padding class based on the capability level.
   * @param {number} level - The level of the capability (1-4).
   * @returns {string} - The corresponding padding class.
   */
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

  /**
   * Determines the background color class based on the score.
   * @param {number} score - The score value.
   * @returns {string} - The corresponding Tailwind CSS background color class.
   */
  const getScoreColor = (score) => {
    if (score === 0) return "bg-gray-400";
    if (score >= 85) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  /**
   * Renders the score as a colored heatmap box.
   * @param {number} score - The score value.
   * @returns JSX Element representing the score box.
   */
  const renderScoreBox = (score) =>
    showHeatMap ? (
      <div className={`w-8 h-8 rounded ${getScoreColor(score)}`}></div>
    ) : null;

  /**
   * Builds nested capabilities from CSV rows.
   * @param {Array} rows - The array of CSV row objects.
   * @returns {object} - The nested capabilities object.
   */
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

      if (!Level1) return; // Skip if Level1 is missing

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

  /**
   * Filters capabilities based on search query and maxLevel.
   * @param {object} capabilities - The capabilities object.
   * @param {string} query - The search query.
   * @returns {object} - The filtered capabilities object.
   */
  const filterCapabilities = (capabilities, query) => {
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

  // Memoize the filtered capabilities for performance optimization
  const displayedCapabilities = useMemo(() => {
    return filterCapabilities(capabilities, searchQuery);
  }, [capabilities, searchQuery, maxLevel]);

  /**
   * Computes default colors for Level 1 columns based on the number of domains.
   * @returns {object} - An object mapping Level1 domains to their colors.
   */
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

  /**
   * Renders Level4 capabilities.
   * @param {object} capabilities - The Level4 capabilities.
   * @returns JSX Element representing Level4 capabilities.
   */
  const renderLevel4 = (capabilities) => {
    return Object.entries(capabilities).map(([name, data]) => (
      <div key={name} className="p-1 border-l-2 border-gray-200 ml-2">
        {renderCapabilityRow(name, data, 4, "text-xs")}
      </div>
    ));
  };

  /**
   * Renders Level3 capabilities.
   * @param {object} capabilities - The Level3 capabilities.
   * @returns JSX Element representing Level3 capabilities.
   */
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
          {/* Render Level4 capabilities if available and maxLevel allows */}
          {data.children &&
            maxLevel >= 4 &&
            Object.keys(data.children).length > 0 && (
              <div className="mt-2">{renderLevel4(data.children)}</div>
            )}
        </div>
      );
    });
  };

  /**
   * Renders Level2 capabilities.
   * @param {object} capabilities - The Level2 capabilities.
   * @returns JSX Element representing Level2 capabilities.
   */
  const renderLevel2 = (capabilities) => {
    return Object.entries(capabilities).map(([name, data]) => {
      return (
        <div key={name} className="border rounded p-2 bg-gray-50 mb-4">
          {renderCapabilityRow(name, data, 2, "font-medium mb-2 text-gray-800")}
          {/* Render Level3 capabilities if available */}
          {data.children && Object.keys(data.children).length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {renderLevel3(data.children)}
            </div>
          )}
        </div>
      );
    });
  };

  /**
   * Renders a capability row with proper indentation and styling.
   * @param {string} name - The name of the capability.
   * @param {object} data - The data object of the capability.
   * @param {number} level - The level of the capability (1-4).
   * @param {string} className - Additional CSS classes.
   * @param {object} style - Inline styles.
   * @returns JSX Element representing the capability row.
   */
  const renderCapabilityRow = (
    name,
    data,
    level,
    className = "",
    style = {}
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
          {/* Display the capability ID */}
          <span className="text-gray-500 ml-2">{data.id}</span>
        </div>
        {/* Render the score heatmap */}
        <div
          className="flex-shrink-0 ml-2"
          style={{ marginRight: heatmapMarginRight }}
        >
          {renderScoreBox(data.score)}
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
    <div>
      {/* Capabilities Display Section */}
      <div className="flex gap-6 overflow-x-auto">
        {Object.entries(displayedCapabilities).map(([domain, data], index) => {
          // Determine the background color for the Level1 column
          const rawColor =
            level1Colors[domain] || defaultLevel1ColorsComputed[domain];
          const backgroundColor = isValidHexColor(rawColor)
            ? rawColor
            : defaultLevel1ColorsComputed[domain] || "transparent";

          return (
            <div key={domain} className="flex flex-col">
              {/* Render Level1 capability header */}
              {renderCapabilityRow(
                domain,
                data,
                1,
                "text-3xl font-bold mb-4 text-left text-gray-800",
                {}
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
        })}
        {/* Display message if no capabilities match the search */}
        {Object.keys(displayedCapabilities).length === 0 && (
          <p className="text-gray-500">No capabilities match your search.</p>
        )}
      </div>
    </div>
  );
};

// Main Page Component with Header and Footer
export default function Page() {
  // Lifted State Variables
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [maxLevel, setMaxLevel] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [isColorPanelOpen, setIsColorPanelOpen] = useState(false);
  const [level1Colors, setLevel1Colors] = useState({});
  const [capabilities, setCapabilities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // List of default colors for Level 1 columns
  const defaultColors = useMemo(
    () => [
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
    ],
    []
  );

  /**
   * Handles the color change for Level1 capabilities.
   * @param {string} level1Name - The name of the Level1 capability.
   * @param {string} color - The new color value.
   */
  const handleColorChange = (level1Name, color) => {
    setLevel1Colors((prevColors) => ({
      ...prevColors,
      [level1Name]: color,
    }));
  };

  /**
   * Function to fetch and parse the CSV data
   */
  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const response = await fetch("/business-capabilities.csv"); // Fetch the CSV file
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        // Parse the CSV using PapaParse
        Papa.parse(csvText, {
          header: true, // Use the first row as headers
          skipEmptyLines: true, // Skip empty lines
          dynamicTyping: {
            Score: true, // Parse 'Score' as a number
          },
          complete: (results) => {
            const data = results.data;
            // Build nested capabilities from parsed CSV data
            const nestedData = buildNestedCapabilities(data);
            setCapabilities(nestedData); // Update state with nested data
            setLoading(false); // Set loading to false after data is loaded
          },
          error: (err) => {
            setError(err.message || "Error parsing CSV"); // Handle parsing errors
            setLoading(false);
          },
        });
      } catch (err) {
        setError(err.message || "Error fetching CSV"); // Handle fetch errors
        setLoading(false);
      }
    };

    fetchCSV(); // Initiate CSV fetch on mount
  }, []);

  /**
   * Builds nested capabilities from CSV rows.
   * @param {Array} rows - The array of CSV row objects.
   * @returns {object} - The nested capabilities object.
   */
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

      if (!Level1) return; // Skip if Level1 is missing

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

  /**
   * Determines the padding class based on the capability level.
   * @param {number} level - The level of the capability (1-4).
   * @returns {string} - The corresponding padding class.
   */
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

  /**
   * Determines the background color class based on the score.
   * @param {number} score - The score value.
   * @returns {string} - The corresponding Tailwind CSS background color class.
   */
  const getScoreColor = (score) => {
    if (score === 0) return "bg-gray-400";
    if (score >= 85) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  /**
   * Renders the score as a colored heatmap box.
   * @param {number} score - The score value.
   * @returns JSX Element representing the score box.
   */
  const renderScoreBox = (score) =>
    showHeatMap ? (
      <div className={`w-8 h-8 rounded ${getScoreColor(score)}`}></div>
    ) : null;

  /**
   * Highlights the matching text based on the search query.
   * @param {string} text - The text to highlight.
   * @param {string} query - The search query.
   * @returns JSX Element with highlighted text.
   */
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

  /**
   * Filters capabilities based on search query and maxLevel.
   * @param {object} capabilities - The capabilities object.
   * @param {string} query - The search query.
   * @returns {object} - The filtered capabilities object.
   */
  const filterCapabilities = (capabilities, query) => {
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

  // Memoize the filtered capabilities for performance optimization
  const displayedCapabilities = useMemo(() => {
    return filterCapabilities(capabilities, searchQuery);
  }, [capabilities, searchQuery, maxLevel]);

  /**
   * Computes default colors for Level 1 columns based on the number of domains.
   * @returns {object} - An object mapping Level1 domains to their colors.
   */
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

  /**
   * Renders a capability row with proper indentation and styling.
   * @param {string} name - The name of the capability.
   * @param {object} data - The data object of the capability.
   * @param {number} level - The level of the capability (1-4).
   * @param {string} className - Additional CSS classes.
   * @param {object} style - Inline styles.
   * @returns JSX Element representing the capability row.
   */
  const renderCapabilityRow = (
    name,
    data,
    level,
    className = "",
    style = {}
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
          {/* Display the capability ID */}
          <span className="text-gray-500 ml-2">{data.id}</span>
        </div>
        {/* Render the score heatmap */}
        <div
          className="flex-shrink-0 ml-2"
          style={{ marginRight: heatmapMarginRight }}
        >
          {renderScoreBox(data.score)}
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
   * Renders Level4 capabilities.
   * @param {object} capabilities - The Level4 capabilities.
   * @returns JSX Element representing Level4 capabilities.
   */
  const renderLevel4 = (capabilities) => {
    return Object.entries(capabilities).map(([name, data]) => (
      <div key={name} className="p-1 border-l-2 border-gray-200 ml-2">
        {renderCapabilityRow(name, data, 4, "text-xs")}
      </div>
    ));
  };

  /**
   * Renders Level3 capabilities.
   * @param {object} capabilities - The Level3 capabilities.
   * @returns JSX Element representing Level3 capabilities.
   */
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
          {/* Render Level4 capabilities if available and maxLevel allows */}
          {data.children &&
            maxLevel >= 4 &&
            Object.keys(data.children).length > 0 && (
              <div className="mt-2">{renderLevel4(data.children)}</div>
            )}
        </div>
      );
    });
  };

  /**
   * Renders Level2 capabilities.
   * @param {object} capabilities - The Level2 capabilities.
   * @returns JSX Element representing Level2 capabilities.
   */
  const renderLevel2 = (capabilities) => {
    return Object.entries(capabilities).map(([name, data]) => {
      return (
        <div key={name} className="border rounded p-2 bg-gray-50 mb-4">
          {renderCapabilityRow(name, data, 2, "font-medium mb-2 text-gray-800")}
          {/* Render Level3 capabilities if available */}
          {data.children && Object.keys(data.children).length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {renderLevel3(data.children)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Section */}
      <header className="bg-gray-800 text-white p-6 fixed top-0 left-0 right-0 z-20">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left: Main Title */}
          <h1 className="text-3xl font-bold text-left flex-1">
            Business Capability Mapper
          </h1>

          {/* Center: Search Capabilities */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search capabilities..."
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 w-full max-w-md"
                style={{ backgroundColor: "#ffffff", color: "#000000" }} // Ensure input is readable
              />
            </div>
          </div>

          {/* Right: Heat Map Toggle, Levels Button Group, Dropdown */}
          <div className="flex-1 flex justify-end items-center space-x-4">
            {/* Heat Map Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showHeatMap}
                onChange={() => setShowHeatMap((prev) => !prev)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Heat Map</span>
            </label>

            {/* Levels Button Group */}
            <div className="flex space-x-2">
              {/* Button for Level 2 */}
              <button
                onClick={() => setMaxLevel(2)}
                className={`px-3 py-1 rounded ${
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
                className={`px-3 py-1 rounded ${
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
                className={`px-3 py-1 rounded ${
                  maxLevel === 4
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={searchQuery.trim() !== ""} // Disable when searching
              >
                Level 4
              </button>
            </div>

            {/* Dropdown Sub-Title */}
            <Dropdown />
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from being hidden behind the fixed header */}
      <div className="h-24"></div>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-x-auto">
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

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 fixed bottom-0 left-0 right-0 z-20">
        <div className="flex justify-between items-center">
          {/* Left: Copyright */}
          <div>&copy; 2024. Evolve AI Partners.</div>

          {/* Right: Customize Colors Button */}
          <div>
            <button
              onClick={() => setIsColorPanelOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Customize Colors
            </button>
          </div>
        </div>
      </footer>

      {/* Spacer to prevent content from being hidden behind the fixed footer */}
      <div className="h-16"></div>

      {/* Color Customization Panel */}
      {isColorPanelOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50">
          {/* Overlay to darken the background */}
          <div
            className="fixed inset-0 bg-black opacity-50 z-40"
            onClick={() => setIsColorPanelOpen(false)} // Close panel on overlay click
          ></div>
          {/* Color customization panel */}
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg z-50">
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
                          : "border-red-500" // Highlight invalid hex codes
                      }`}
                      placeholder={
                        defaultLevel1ColorsComputed[level1Name] || "#ffffff"
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
    </div>
  );
}
