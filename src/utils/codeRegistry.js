/**
 * Code Registry - Manages unique code generation with persistent storage
 * Prevents duplicate QR codes even after project restart
 */

const STORAGE_KEY = 'qr_code_registry';

/**
 * Get all previously generated codes from localStorage
 */
const getGeneratedCodes = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    const array = JSON.parse(stored);
    return new Set(Array.isArray(array) ? array : []);
  } catch (error) {
    console.warn('Failed to retrieve code registry:', error);
    return new Set();
  }
};

/**
 * Save generated codes to localStorage
 */
const saveGeneratedCodes = (codes) => {
  try {
    const codeArray = Array.isArray(codes) ? codes : Array.from(codes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codeArray));
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      // localStorage full - keep only the last 5000 codes
      const codeArray = Array.from(codes);
      const trimmed = codeArray.slice(-5000);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch {
        console.warn('Code registry: localStorage is full, unable to save.');
      }
    } else {
      console.warn('Failed to save code registry:', error);
    }
  }
};

/**
 * Check if a code has already been generated
 */
export const isCodeGenerated = (code) => {
  const codes = getGeneratedCodes();
  return codes.has(code);
};

/**
 * Register a code as generated
 */
export const registerCode = (code) => {
  const codes = getGeneratedCodes();
  codes.add(code);
  saveGeneratedCodes(codes);
};

