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

  const getLabelSignature = (items) =>
    items.map((label) => `${label.type || 'qr'}:${label.qrData}`).join('|');

  const createThumbPromise = (label, style) => {
    const patternImage = style.qrFillMode === 'image' ? style.qrPatternImage : null;
    const qrOptions = {
      darkColor: style.codeColor || '#000000',
      patternImage,
    };
    const linearCodeOptions = {
      darkColor: style.codeColor || '#000000',
      patternImage,
    };

    if (label.type === 'barcode') {
      return Promise.resolve(generateBarcodeThumbnail(label.qrData, linearCodeOptions));
    }
    if (label.type === 'datamatrix') {
      return generateDataMatrixThumbnail(label.qrData, linearCodeOptions);
    }
    if (style.showLogo && style.logoImage) {
      return generateQRWithLogo(label.qrData, 120, style.logoImage, style.logoPosition || 'center', qrOptions);
    }
    return generateQRThumbnail(label.qrData, qrOptions);
  };

  // Rebuild thumbnails when label set or style settings change.
  useEffect(() => {
    if (labels.length === 0) return;

    const style = {
      logoImage: logoSettings?.logoImage,
      showLogo: logoSettings?.showLogo,
      logoPosition: logoSettings?.logoPosition,
      codeColor: logoSettings?.codeColor || '#000000',
      qrFillMode: logoSettings?.qrFillMode || 'color',
      qrPatternImage: logoSettings?.qrPatternImage || null,
    };

    const labelSnapshot = labels.map((label) => ({
      ...label,
      type: label.type || 'qr',
    }));
    const snapshotSig = getLabelSignature(labelSnapshot);
    let cancelled = false;

    Promise.all(
      labelSnapshot.map((label) =>
        createThumbPromise(label, style).catch((error) => {
          console.error('Failed to generate thumbnail for label:', label.qrData, error);
          return null;
        })
      )
    ).then((thumbs) => {
      if (cancelled) return;
      setLabels((prev) => {
        if (getLabelSignature(prev) !== snapshotSig) return prev;
        return prev.map((label, idx) => ({
          ...label,
          thumb: thumbs[idx] || label.thumb || null,
        }));
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    labels.length,
    getLabelSignature(labels),
    logoSettings?.logoImage,
    logoSettings?.showLogo,
    logoSettings?.logoPosition,
    logoSettings?.codeColor,
    logoSettings?.qrFillMode,
    logoSettings?.qrPatternImage,
  ]);

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
