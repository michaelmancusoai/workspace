// app/components/CapabilityRow.tsx

import React from "react";
import { CapabilityData } from "types/types";
import { getPaddingClass, getScoreColor } from "@lib/capabilityUtils";

type CapabilityRowProps = {
  name: string;
  data: CapabilityData;
  level: number;
  searchQuery: string;
  showHeatMap: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const CapabilityRow: React.FC<CapabilityRowProps> = ({
  name,
  data,
  level,
  searchQuery,
  showHeatMap,
  className = "",
  style = {},
}) => {
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

  // Function to render the score heatmap
  const renderScore = (score: number) =>
    showHeatMap ? (
      <div className={`w-8 h-8 rounded ${getScoreColor(score)}`}></div>
    ) : null;

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

export default CapabilityRow;
