// app/components/ColorCustomizationPanel.tsx

import React from "react";
import { isValidHexColor } from "../lib/capabilityUtils";

type ColorCustomizationPanelProps = {
  capabilities: Record<string, any>;
  level1Colors: Record<string, string>;
  defaultLevel1Colors: Record<string, string>;
  handleColorChange: (level1Name: string, color: string) => void;
  closePanel: () => void;
};

const ColorCustomizationPanel: React.FC<ColorCustomizationPanelProps> = ({
  capabilities,
  level1Colors,
  defaultLevel1Colors,
  handleColorChange,
  closePanel,
}) => {
  return (
    <div className="fixed inset-0 flex justify-center items-end z-20">
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={closePanel}
      ></div>
      <div className="bg-white w-full max-w-md p-6 rounded-t-lg shadow-lg z-30">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Customize Level 1 Colors</h2>
          <button
            onClick={closePanel}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {Object.keys(capabilities).map((level1Name) => (
            <div key={level1Name} className="flex items-center justify-between">
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
                  placeholder={defaultLevel1Colors[level1Name] || "#ffffff"}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={closePanel}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorCustomizationPanel;
