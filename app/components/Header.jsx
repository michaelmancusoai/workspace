// components/Header.jsx
"use client";

import React, { useState } from "react";

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
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Example Capability Map v1
            </a>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Example Capability Map v2
            </a>
            <a
              href="#"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Other Capability Map
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const Header = ({
  searchQuery,
  setSearchQuery,
  showHeatMap,
  setShowHeatMap,
  maxLevel,
  setMaxLevel,
}) => {
  return (
    <header className="bg-gray-800 text-white p-6 fixed top-0 left-0 right-0 z-20">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-left flex-1">
          Business Capability Mapper
        </h1>

        <div className="flex-1 text-center">
          <div className="flex items-center justify-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search capabilities..."
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 w-full max-w-md"
              style={{ backgroundColor: "#ffffff", color: "#000000" }}
            />
          </div>
        </div>

        <div className="flex-1 flex justify-end items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showHeatMap}
              onChange={() => setShowHeatMap((prev) => !prev)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Heat Map</span>
          </label>

          <div className="flex space-x-2">
            <button
              onClick={() => setMaxLevel(2)}
              className={`px-3 py-1 rounded ${
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
              className={`px-3 py-1 rounded ${
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
              className={`px-3 py-1 rounded ${
                maxLevel === 4
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              disabled={searchQuery.trim() !== ""}
            >
              Level 4
            </button>
          </div>

          <Dropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;
