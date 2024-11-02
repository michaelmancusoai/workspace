// components/Footer.jsx
"use client";

import React from "react";

const Footer = ({ isColorPanelOpen, setIsColorPanelOpen }) => {
  return (
    <footer className="bg-gray-800 text-white p-4 fixed bottom-0 left-0 right-0 z-20">
      <div className="flex justify-between items-center">
        <div>&copy; 2024 - Michael Mancuso</div>
      </div>
    </footer>
  );
};

export default Footer;
