import { useState, useEffect } from 'react';
import { generateQRThumbnail, generateBarcodeThumbnail, generateDataMatrixThumbnail, generateQRWithLogo } from '../utils/codeGenerator';
import { QR_CODE_CONFIG } from '../utils/constants';
import { isCodeGenerated, registerCode } from '../utils/codeRegistry';

/**
 * Custom hook for managing QR label state and operations
 */
export const useLabels = (logoSettings) => {
  const [labels, setLabels] = useState(() => {
    try {
      const saved = localStorage.getItem('sima-session');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('sima-history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Auto-save history
  useEffect(() => {
    localStorage.setItem('sima-history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (format) => {
    if (labels.length === 0) return;
    
    const entry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      count: labels.length,
      format: format.toUpperCase(),
      labels: labels, // Store the full label data
      preview: labels[0]?.thumb // Store first thumbnail as preview
    };

    setHistory((prev) => [entry, ...prev].slice(0, 10)); // Keep last 10 entries
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('sima-history');
  };

  /**
   * Generates a random code for label identification
   */
  const generateRandomCode = () => {
    const { randomCodeLength, randomCodeCharacters } = QR_CODE_CONFIG;
    let code = '';
    for (let i = 0; i < randomCodeLength; i++) {
      code += randomCodeCharacters.charAt(
        Math.floor(Math.random() * randomCodeCharacters.length)
      );
    }
    return code;
  };

  /**
   * Generates a unique code that hasn't been used before
   */
  const generateUniqueCode = () => {
    const { randomCodeLength, randomCodeCharacters } = QR_CODE_CONFIG;
    let code;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      code = '';
      for (let i = 0; i < randomCodeLength; i++) {
        code += randomCodeCharacters.charAt(
          Math.floor(Math.random() * randomCodeCharacters.length)
        );
      }
      attempts++;
      
      if (attempts > maxAttempts) {
        // Fallback: add timestamp to ensure uniqueness
        code = code + '_' + Date.now().toString(36);
        break;
      }
    } while (isCodeGenerated(code));

    return code;
  };

  /**
   * Creates a single label with a unique generated code
   */
  const createLabel = (month) => {
    const part1 = generateUniqueCode();
    const part2 = generateUniqueCode();
    const qrData = QR_CODE_CONFIG.codeFormat(month, part1, part2);

    // Register the code to prevent future duplicates
    registerCode(part1);
    registerCode(part2);

    console.log('Created label with QR data:', qrData);

    return {
      month,
      part1,
      part2,
      qrData,
      thumb: null,
    };
  };

  /**
   * Adds multiple labels and generates their thumbnails asynchronously
   */
  const addLabels = (count, month) => {
    console.log('Generating', count, 'labels for month', month);
    const newLabels = Array.from({ length: count }, () => createLabel(month));
    console.log('New labels created:', newLabels.length);
    setLabels((prev) => [...prev, ...newLabels]);

    // Generate thumbnails for newly added labels (with logo overlay if active)
    const { logoImage: logo, showLogo, logoPosition } = logoSettings || {};
    newLabels.forEach((label, idx) => {
      const thumbPromise = (showLogo && logo)
        ? generateQRWithLogo(label.qrData, 120, logo, logoPosition || 'center')
        : generateQRThumbnail(label.qrData);
      thumbPromise
        .then((dataUrl) => {
          console.log('Thumbnail generated for label', idx, ':', label.qrData);
          setLabels((prev) => {
            const updated = [...prev];
            // Find and update the first matching label without a thumbnail
            const index = updated.findIndex(
              (lbl) => lbl.qrData === label.qrData && !lbl.thumb
            );
            if (index !== -1) {
              updated[index] = { ...updated[index], thumb: dataUrl };
            }
            return updated;
          });
        })
        .catch((error) => {
          console.error('Failed to generate thumbnail for label:', label.qrData, error);
        });
    });
  };

  /**
   * Adds labels from an AI-generated config object (supports items array with mixed qr/barcode)
   */
  const addLabelsFromConfig = (config) => {
    const { items, brandName = '' } = config;
    const newLabels = [];

    for (const item of items) {
      const { type = 'qr', count, dataPattern, startNumber = 1, isExact } = item;
      for (let i = 0; i < count; i++) {
        const n = startNumber + i;
        const qrData = isExact ? dataPattern : dataPattern.replace(/\{n\}/g, String(n));

        newLabels.push({
          qrData,
          brandName,
          type,
          thumb: null,
        });
      }
    }

    setLabels(newLabels);

    // Generate thumbnails based on type (with logo overlay if active)
    const { logoImage: logo, showLogo, logoPosition } = logoSettings || {};
    newLabels.forEach((label, idx) => {
      let generateThumb;
      if (label.type === 'barcode') {
        generateThumb = Promise.resolve(generateBarcodeThumbnail(label.qrData));
      } else if (label.type === 'datamatrix') {
        generateThumb = generateDataMatrixThumbnail(label.qrData);
      } else if (showLogo && logo) {
        generateThumb = generateQRWithLogo(label.qrData, 120, logo, logoPosition || 'center');
      } else {
        generateThumb = generateQRThumbnail(label.qrData);
      }

      generateThumb
        .then((dataUrl) => {
          setLabels((prev) => {
            const updated = [...prev];
            if (updated[idx] && !updated[idx].thumb) {
              updated[idx] = { ...updated[idx], thumb: dataUrl };
            }
            return updated;
          });
        })
        .catch((error) => {
          console.error('Failed to generate thumbnail for label:', label.qrData, error);
        });
    });
  };

  /**
   * Removes a single label by index
   */
  const removeLabel = (index) => {
    setLabels((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Removes all labels
   */
  const clearAllLabels = () => {
    setLabels([]);
  };

  return {
    labels,
    history,
    addLabels,
    addLabelsFromConfig,
    removeLabel,
    addToHistory,
    clearAllLabels,
    clearHistory,
    setLabels, // Expose setter for history restore
  };
};
