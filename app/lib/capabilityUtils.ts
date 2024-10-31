// app/lib/capabilityUtils.ts

// Function to map level to padding classes
export const getPaddingClass = (level: number) => {
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
export const isValidHexColor = (hex: string): boolean => {
  return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
};

// Function to determine the color based on score
export const getScoreColor = (score: number) => {
  if (score === 0) return "bg-gray-400"; // Map score 0 to gray
  if (score >= 85) return "bg-green-500";
  if (score >= 70) return "bg-yellow-500";
  return "bg-red-500";
};
