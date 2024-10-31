"use client";

import React, { useEffect, useState, useMemo } from "react";
import Papa, { ParseResult } from "papaparse";
import CapabilityRow from "./CapabilityRow";
import ColorCustomizationPanel from "./ColorCustomizationPanel";
import { CapabilityData, CSVRow } from "types/types";
import { isValidHexColor } from "../lib/capabilityUtils";
import { Card, CardContent } from "./ui/card";

const CapabilityMap: React.FC = () => {
  // Explicitly declare as a React.FC
  const [capabilities, setCapabilities] = useState<
    Record<string, CapabilityData>
  >({});
  const [showHeatMap, setShowHeatMap] = useState<boolean>(true);
  const [maxLevel, setMaxLevel] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [level1Colors, setLevel1Colors] = useState<Record<string, string>>({});
  const [isColorPanelOpen, setIsColorPanelOpen] = useState<boolean>(false);

  const defaultColors: string[] = [
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
  ];

  useEffect(() => {
    if (searchQuery.trim()) {
      setMaxLevel(4);
    }
  }, [searchQuery]);

  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const response = await fetch("/business-capabilities.csv");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        Papa.parse<CSVRow>(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: { Score: true },
          complete: (results: ParseResult<CSVRow>) => {
            const data = results.data;
            const nestedData = buildNestedCapabilities(data);
            setCapabilities(nestedData);
            setLoading(false);
          },
          error: (err: unknown) => {
            const errorMessage =
              err instanceof Error ? err.message : "Error parsing CSV";
            setError(errorMessage);
            setLoading(false);
          },
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Error fetching CSV";
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchCSV();
  }, []);

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
        if (!level1.children![Level2]) {
          level1.children![Level2] = {
            id: Level2_ID || "",
            desc: Level2_Desc || "",
            score: 0,
            children: {},
          };
        }
        const level2 = level1.children![Level2];
        if (Level3) {
          if (!level2.children![Level3]) {
            level2.children![Level3] = {
              id: Level3_ID || "",
              desc: Level3_Desc || "",
              score: 0,
              children: {},
            };
          }
          const level3 = level2.children![Level3];
          if (Level4) {
            if (!level3.children![Level4]) {
              level3.children![Level4] = {
                id: Level4_ID || "",
                desc: Level4_Desc || "",
                score: Score || 0,
              };
            } else {
              level3.children![Level4].score = Score || 0;
            }
          }
        }
      }
    });
    return capabilityMap;
  };

  // Render logic continues...
  return (
    <div className="w-full">
      {loading && (
        <div className="text-center p-6">
          <p>Loading capabilities...</p>
        </div>
      )}
      {error && (
        <div className="text-center text-red-500 p-6">
          <p>Error: {error}</p>
        </div>
      )}
      {!loading && !error && Object.keys(capabilities).length > 0 ? (
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
            <h1 className="text-2xl font-bold whitespace-nowrap">
              Dental Practice Capability Model
            </h1>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search capabilities..."
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto">
            {Object.entries(capabilities).map(([domain, data]) => {
              const rawColor =
                level1Colors[domain] || defaultLevel1Colors[domain];
              const backgroundColor = isValidHexColor(rawColor)
                ? rawColor
                : "transparent";
              return (
                <div
                  key={domain}
                  className="flex flex-col min-w-[450px] p-4"
                  style={{ backgroundColor }}
                >
                  <CapabilityRow
                    name={domain}
                    data={data}
                    level={1}
                    searchQuery={searchQuery}
                    showHeatMap={showHeatMap}
                    className="text-3xl font-bold mb-4 text-center"
                  />
                  {data.children && (
                    <div>{/* Render Level 2 Children Here, If Needed */}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setIsColorPanelOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Customize Colors
        </button>
      </div>
      {isColorPanelOpen && (
        <ColorCustomizationPanel
          capabilities={capabilities}
          level1Colors={level1Colors}
          defaultLevel1Colors={defaultLevel1Colors}
          handleColorChange={handleColorChange}
          closePanel={() => setIsColorPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default CapabilityMap;
