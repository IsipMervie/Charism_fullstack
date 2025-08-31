// frontend/src/utils/arrayUtils.js
// Utility functions for safe array operations

/**
 * Safely filters an array, ensuring the input is an array before calling filter
 * @param {any} input - The input to filter (could be array, null, undefined, etc.)
 * @param {Function} filterFn - The filter function to apply
 * @param {Array} fallback - Fallback array if input is not an array (default: [])
 * @returns {Array} - The filtered array or fallback
 */
export const safeFilter = (input, filterFn, fallback = []) => {
  if (!Array.isArray(input)) {
    console.warn('safeFilter: Input is not an array:', input);
    return fallback;
  }
  try {
    return input.filter(filterFn);
  } catch (error) {
    console.error('safeFilter: Error during filter operation:', error);
    return fallback;
  }
};

/**
 * Safely maps over an array, ensuring the input is an array before calling map
 * @param {any} input - The input to map over (could be array, null, undefined, etc.)
 * @param {Function} mapFn - The map function to apply
 * @param {Array} fallback - Fallback array if input is not an array (default: [])
 * @returns {Array} - The mapped array or fallback
 */
export const safeMap = (input, mapFn, fallback = []) => {
  if (!Array.isArray(input)) {
    console.warn('safeMap: Input is not an array:', input);
    return fallback;
  }
  try {
    return input.map(mapFn);
  } catch (error) {
    console.error('safeMap: Error during map operation:', error);
    return fallback;
  }
};

/**
 * Safely gets the length of an array
 * @param {any} input - The input to get length of
 * @returns {number} - The length of the array or 0 if not an array
 */
export const safeLength = (input) => {
  return Array.isArray(input) ? input.length : 0;
};

/**
 * Safely checks if an array is empty
 * @param {any} input - The input to check
 * @returns {boolean} - True if input is an empty array, false otherwise
 */
export const safeIsEmpty = (input) => {
  return !Array.isArray(input) || input.length === 0;
};

/**
 * Safely creates a Set from an array
 * @param {any} input - The input to create a Set from
 * @returns {Set} - A Set containing the unique values or empty Set
 */
export const safeSet = (input) => {
  if (!Array.isArray(input)) {
    return new Set();
  }
  try {
    return new Set(input);
  } catch (error) {
    console.error('safeSet: Error creating Set:', error);
    return new Set();
  }
};

/**
 * Safely spreads an array into another array
 * @param {any} input - The input to spread
 * @param {Array} fallback - Fallback array if input is not an array (default: [])
 * @returns {Array} - The spread array or fallback
 */
export const safeSpread = (input, fallback = []) => {
  if (!Array.isArray(input)) {
    return fallback;
  }
  try {
    return [...input];
  } catch (error) {
    console.error('safeSpread: Error spreading array:', error);
    return fallback;
  }
};
