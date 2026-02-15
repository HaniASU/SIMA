import { generateQRCode, generateBarcode, generateDataMatrix, loadQRImage } from './codeGenerator';
import { PRINT_CONFIG } from './constants';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

const cmToPixels = (cm, dpi) => (cm / PRINT_CONFIG.cmToInch) * dpi;

/**
 * Pre-generate and cache all unique code images before drawing.
 * Returns a Map: "type:data" -> HTMLImageElement
 */
const preloadCodeImages = async (labels, codeW, codeH) => {
  const cache = new Map();
  const promises = [];

  for (const label of labels) {
    const key = `${label.type}:${label.qrData}`;
    if (cache.has(key)) continue;

    // Reserve the key so we don't duplicate work
    cache.set(key, null);

    const promise = (async () => {
      try {
        let dataUrl;
        if (label.type === 'barcode') {
          dataUrl = generateBarcode(label.qrData, codeW, codeH);
        } else if (label.type === 'datamatrix') {
          dataUrl = await generateDataMatrix(label.qrData, codeW);
        } else {
          dataUrl = await generateQRCode(label.qrData, codeW);
        }
        const img = await loadQRImage(dataUrl);
        cache.set(key, img);
      } catch {
        cache.set(key, null);
      }
    })();
    promises.push(promise);
  }

  await Promise.all(promises);
  return cache;
};

const drawLabelBox = (
  ctx,
  label,
  x,
  y,
  width,
  height,
  options,
  codeImg
) => {
  const {
    showBorder,
    brandName,
    showBrandName,
    brandFontSize,
    showDataText,
    dataFontSize,
  } = options;

  // Scale factor: user enters font sizes in screen px (~72 DPI), canvas is 300 DPI
  const scale = PRINT_CONFIG.dpi / 72;

  // Draw label border
  if (showBorder) {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = Math.max(1, scale);
    ctx.strokeRect(x, y, width, height);
  }

  // Padding proportional to label size
  const padding = Math.max(8, Math.min(width, height) * 0.04);

  const brandText = brandName || label.brandName || '';
  const hasBrand = showBrandName && !!brandText;
  const bFontSize = Math.round((brandFontSize || 12) * scale);
  const brandAreaHeight = hasBrand ? bFontSize + padding : 0;

  const hasData = showDataText && !!label.qrData;
  const dFontSize = Math.round((dataFontSize || 10) * scale);
  const dataAreaHeight = hasData ? dFontSize + padding : 0;

  // Available space for the code (minus brand above and data below)
  const availW = width - padding * 2;
  const availH = height - padding * 2 - brandAreaHeight - dataAreaHeight;

  const isBarcode = label.type === 'barcode';
  let codeW, codeH;

  if (isBarcode) {
    codeW = Math.min(availW, availH * 2.2);
    codeH = codeW * 0.45;
  } else {
    const size = Math.min(availW, availH);
    codeW = size;
    codeH = size;
  }

  // Position: brand on top, code centered in middle, data at bottom
  const topOffset = y + padding + brandAreaHeight;
  const codeX = x + (width - codeW) / 2;
  const codeY = topOffset + (availH - codeH) / 2;

  // Brand name centered above the code
  if (hasBrand) {
    ctx.fillStyle = '#333';
    ctx.font = `bold ${bFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(brandText, x + width / 2, y + padding + brandAreaHeight / 2, availW);
  }

  // Draw the pre-loaded code image
  if (codeImg) {
    ctx.drawImage(codeImg, codeX, codeY, codeW, codeH);
  } else {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(codeX, codeY, codeW, codeH);
  }

  // Content/Data text centered below the code
  if (hasData) {
    ctx.fillStyle = '#555';
    ctx.font = `${dFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.qrData, x + width / 2, y + height - padding - dataAreaHeight / 2, availW);
  }

  // Reset text properties
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
};

export const generateExportWithWorker = async (labels, printSettings, exportFormat = 'pdf') => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/exportWorker.js', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e) => {
      const { type, blob, filename, error } = e.data;
      if (type === 'SUCCESS') {
        // Create a download link for the blob
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        worker.terminate();
        resolve();
      } else if (type === 'ERROR') {
        console.error('Worker error:', error);
        worker.terminate();
        reject(new Error(error));
      }
    };

    worker.onerror = (err) => {
      console.error('Worker script error:', err);
      worker.terminate();
      reject(err);
    };

    worker.postMessage({
      type: 'GENERATE_PDF',
      payload: {
        labels,
        printSettings,
        exportFormat,
      },
    });
  });
};

// Deprecated: kept for fallback or reference, but not used by main app anymore
export const generatePDFSheet = async (canvas, labels, printSettings) => {
  // ... (Keep existing logic if needed for fallback, or just return empty)
  // For cleanliness, we can point this to the worker or remove it.
  // Let's keep the core drawing logic but we don't strictly need it if worker works.
  // I will just leave the export stub to avoid breaking imports during transition.
  return []; 
};

export const downloadCanvasAsImage = async () => {
  // No longer needed in the main thread with worker approach, 
  // but kept to avoid breaking import in LabelGenerator until updated.
};
