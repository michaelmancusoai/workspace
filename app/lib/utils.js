import { clsx } from "clsx"; // Removed TypeScript type import
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into one, removing duplicates and resolving conflicts.
 * @param  {...any} inputs - Class names or expressions to combine.
 * @returns {string} - The merged class names.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
