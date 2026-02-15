import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import bwipjs from 'bwip-js';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

// Redefine constants needed for calculation (moved from constants.js to avoid import issues if not pure)
const PRINT_CONFIG = {
  a4Width: 210 / 25.4, // inches
  a4Height: 297 / 25.4, // inches
  dpi: 300,
  cmToInch: 2.54,
};

const cmToPixels = (cm, dpi) => (cm / PRINT_CONFIG.cmToInch) * dpi;
const DEFAULT_DARK_COLOR = '#000000';

const normalizeHexColor = (value, fallback = DEFAULT_DARK_COLOR) => {
  const raw = String(value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw}`.toUpperCase();
  return fallback;
};

const createMaskFromCanvasOffscreen = (sourceCanvas) => {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const maskCanvas = new OffscreenCanvas(width, height);
  const maskCtx = maskCanvas.getContext('2d');
  maskCtx.drawImage(sourceCanvas, 0, 0, width, height);

  const imageData = maskCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (!alpha) {
      data[i + 3] = 0;
      continue;
    }
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const isDark = luminance < 180;
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = isDark ? 255 : 0;
  }
  maskCtx.putImageData(imageData, 0, 0);
  return maskCanvas;
};

const applyFillToMaskOffscreen = (maskCanvas, codeColor = DEFAULT_DARK_COLOR, patternBitmap = null) => {
  const width = maskCanvas.width;
  const height = maskCanvas.height;
  const darkColor = normalizeHexColor(codeColor, DEFAULT_DARK_COLOR);
  const outputCanvas = new OffscreenCanvas(width, height);
  const ctx = outputCanvas.getContext('2d');

  if (patternBitmap) {
    ctx.drawImage(patternBitmap, 0, 0, width, height);
  } else {
    ctx.fillStyle = darkColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0, width, height);

  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';

  return outputCanvas;
};

// Worker-compatible Code Generators

const generateQRCodeOffscreen = async (data, sizePx, codeColor = DEFAULT_DARK_COLOR, patternBitmap = null) => {
  const rawCanvas = new OffscreenCanvas(sizePx, sizePx);
  await QRCode.toCanvas(rawCanvas, data, {
    margin: 0,
    width: sizePx,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  const maskCanvas = createMaskFromCanvasOffscreen(rawCanvas);
  return applyFillToMaskOffscreen(maskCanvas, codeColor, patternBitmap);
};

const generateQRWithLogoOffscreen = async (
  data,
  sizePx,
  logoBitmap,
  position = 'center',
  codeColor = DEFAULT_DARK_COLOR,
  patternBitmap = null
) => {
  try {
    const canvas = await generateQRCodeOffscreen(data, sizePx, codeColor, patternBitmap);
    const ctx = canvas.getContext('2d');

    if (logoBitmap) {
      // Calculate logo size and placement.
      const logoSize = sizePx * 0.25;
      const pad = sizePx * 0.04;
      let logoX, logoY;

      // Vertical position
      if (position.startsWith('top')) {
        logoY = pad;
      } else if (position.startsWith('bottom')) {
        logoY = sizePx - logoSize - pad;
      } else {
        logoY = (sizePx - logoSize) / 2;
      }

      // Horizontal position
      if (position.endsWith('left')) {
        logoX = pad;
      } else if (position.endsWith('right')) {
        logoX = sizePx - logoSize - pad;
      } else {
        logoX = (sizePx - logoSize) / 2;
      }

      // Draw white background/padding
      const bgPad = 6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(logoX - bgPad, logoY - bgPad, logoSize + bgPad * 2, logoSize + bgPad * 2);

      // 4. Draw Logo
      ctx.drawImage(logoBitmap, logoX, logoY, logoSize, logoSize);
    }

    return canvas;
  } catch (error) {
    console.error('Worker QR+Logo error', error);
    return generateQRCodeOffscreen(data, sizePx, codeColor, patternBitmap);
  }
};

const generateBarcodeOffscreen = (data, width, height, codeColor = DEFAULT_DARK_COLOR, patternBitmap = null) => {
  const normalizedWidth = Math.max(1, Math.round(width));
  const normalizedHeight = Math.max(1, Math.round(height));
  const rawCanvas = new OffscreenCanvas(normalizedWidth, normalizedHeight);
  JsBarcode(rawCanvas, data, {
    format: 'CODE128',
    width: Math.max(1, Math.round(normalizedWidth / 100)),
    height: normalizedHeight,
    displayValue: false,
    margin: 0,
    lineColor: '#000000',
    background: '#ffffff',
  });
  const maskCanvas = createMaskFromCanvasOffscreen(rawCanvas);
  return applyFillToMaskOffscreen(maskCanvas, codeColor, patternBitmap);
};

const generateDataMatrixOffscreen = (data, sizePx, codeColor = DEFAULT_DARK_COLOR, patternBitmap = null) => {
  const normalizedSize = Math.max(1, Math.round(sizePx));
  const rawCanvas = new OffscreenCanvas(normalizedSize, normalizedSize);
  bwipjs.toCanvas(rawCanvas, {
    bcid: 'datamatrix',
    text: data,
    scale: Math.max(2, Math.round(normalizedSize / 30)),
    padding: 0,
    foregroundcolor: '000000',
    backgroundcolor: 'FFFFFF',
  });
  const maskCanvas = createMaskFromCanvasOffscreen(rawCanvas);
  return applyFillToMaskOffscreen(maskCanvas, codeColor, patternBitmap);
};

// --- Logic ---

const preloadCodeImagesOffscreen = async (
  labels,
  codeW,
  codeH,
  logoBitmap,
  logoPosition,
  codeColor,
  qrPatternBitmap
) => {
  const cache = new Map();
  const promises = [];

  for (const label of labels) {
    const key = `${label.type}:${label.qrData}`;
    if (cache.has(key)) continue;

    cache.set(key, null);

    const promise = (async () => {
      try {
        let canvas;
        if (label.type === 'barcode') {
          canvas = generateBarcodeOffscreen(label.qrData, codeW, codeH, codeColor, qrPatternBitmap);
        } else if (label.type === 'datamatrix') {
          canvas = generateDataMatrixOffscreen(label.qrData, codeW, codeColor, qrPatternBitmap);
        } else {
          if (logoBitmap) {
            canvas = await generateQRWithLogoOffscreen(
              label.qrData,
              codeW,
              logoBitmap,
              logoPosition,
              codeColor,
              qrPatternBitmap
            );
          } else {
            canvas = await generateQRCodeOffscreen(label.qrData, codeW, codeColor, qrPatternBitmap);
          }
        }
        // Store the OffscreenCanvas directly (or ImageBitmap)
        const bitmap = await createImageBitmap(canvas);
        cache.set(key, bitmap);
      } catch (err) {
        console.error('Worker gen error', err);
        cache.set(key, null);
      }
    })();
    promises.push(promise);
  }

  await Promise.all(promises);
  return cache;
};

const drawLabelBoxOffscreen = (
  ctx,
  label,
  x,
  y,
  width,
  height,
  options,
  codeBitmap
) => {
  const {
    showBorder,
    brandName,
    showBrandName,
    brandFontSize,
    showDataText,
    dataFontSize,
  } = options;

  const scale = PRINT_CONFIG.dpi / 72;

  if (showBorder) {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = Math.max(1, scale);
    ctx.strokeRect(x, y, width, height);
  }

  const padding = Math.max(8, Math.min(width, height) * 0.04);

  const brandText = brandName || label.brandName || '';
  const hasBrand = showBrandName && !!brandText;
  const bFontSize = Math.round((brandFontSize || 12) * scale);
  const brandAreaHeight = hasBrand ? bFontSize + padding : 0;

  const hasData = showDataText && !!label.qrData;
  const dFontSize = Math.round((dataFontSize || 10) * scale);
  const dataAreaHeight = hasData ? dFontSize + padding : 0;

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

  const topOffset = y + padding + brandAreaHeight;
  const codeX = x + (width - codeW) / 2;
  const codeY = topOffset + (availH - codeH) / 2;

  if (hasBrand) {
    ctx.fillStyle = '#333';
    ctx.font = `bold ${bFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(brandText, x + width / 2, y + padding + brandAreaHeight / 2, availW);
  }

  if (codeBitmap) {
    ctx.drawImage(codeBitmap, codeX, codeY, codeW, codeH);
  } else {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(codeX, codeY, codeW, codeH);
  }

  if (hasData) {
    ctx.fillStyle = '#555';
    ctx.font = `${dFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.qrData, x + width / 2, y + height - padding - dataAreaHeight / 2, availW);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
};

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'GENERATE_PDF') {
    try {
      const { labels, printSettings, exportFormat } = payload;
      const dpi = PRINT_CONFIG.dpi;
      const a4Width = PRINT_CONFIG.a4Width * dpi;
      const a4Height = PRINT_CONFIG.a4Height * dpi;

      const labelWidth = cmToPixels(printSettings.labelWidthCm, dpi);
      const labelHeight = cmToPixels(printSettings.labelHeightCm, dpi);
      const spacingX = cmToPixels(printSettings.spacingXCm || 0.5, dpi);
      const spacingY = cmToPixels(printSettings.spacingYCm || 0.5, dpi);

      const drawOptions = {
        showBorder: printSettings.showBorder !== false,
        brandName: printSettings.brandName || '',
        showBrandName: printSettings.showBrandName !== false,
        brandFontSize: printSettings.brandFontSize || 12,
        showDataText: printSettings.showDataText !== undefined ? printSettings.showDataText : false,
        dataFontSize: printSettings.dataFontSize || 10,
      };

      const maxCols = Math.floor(a4Width / (labelWidth + spacingX));
      const cols = printSettings.columnsPerRow ? Math.min(printSettings.columnsPerRow, maxCols) : maxCols;
      const rows = Math.floor(a4Height / (labelHeight + spacingY));
      const labelsPerPage = cols * rows;

      const totalPages = Math.ceil(labels.length / labelsPerPage);
      const codeColor = normalizeHexColor(printSettings.codeColor, DEFAULT_DARK_COLOR);

      let logoBitmap = null;
      if (printSettings.showLogo && printSettings.logoImage) {
        try {
          // Fetch the blob from the data URL
          const res = await fetch(printSettings.logoImage);
          const blob = await res.blob();
          logoBitmap = await createImageBitmap(blob);
        } catch (e) {
          console.error('Failed to load logo in worker', e);
        }
      }

      let qrPatternBitmap = null;
      if (printSettings.qrFillMode === 'image' && printSettings.qrPatternImage) {
        try {
          const res = await fetch(printSettings.qrPatternImage);
          const blob = await res.blob();
          qrPatternBitmap = await createImageBitmap(blob);
        } catch (e) {
          console.error('Failed to load QR pattern image in worker', e);
        }
      }

      const imageCache = await preloadCodeImagesOffscreen(
        labels,
        labelWidth,
        labelHeight,
        logoBitmap,
        printSettings.logoPosition,
        codeColor,
        qrPatternBitmap
      );
      
      const pageBlobs = []; // will store blobs of each page

      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        const canvas = new OffscreenCanvas(a4Width, a4Height);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, a4Width, a4Height);

        const startIndex = pageNum * labelsPerPage;
        const endIndex = Math.min(startIndex + labelsPerPage, labels.length);

        for (let i = startIndex; i < endIndex; i++) {
          const label = labels[i];
          const idx = i - startIndex;
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          const lx = col * (labelWidth + spacingX) + spacingX;
          const ly = row * (labelHeight + spacingY) + spacingY;

          const codeBitmap = imageCache.get(`${label.type}:${label.qrData}`) || null;
          drawLabelBoxOffscreen(ctx, label, lx, ly, labelWidth, labelHeight, drawOptions, codeBitmap);
        }

        const blob = await canvas.convertToBlob({ type: 'image/png' });
        pageBlobs.push(blob);
      }
      
      // Convert Blobs to ArraysBuffers to send back (or just send blobs)
      // Actually we can generate the final PDF/ZIP here if we want, or send back pages.
      // Sending back pages allows the main thread to handle the download logic, 
      // but creating the PDF here offloads more work.
      
      // Let's create the final output blob here.

      let resultBlob;
      const filename = `qr-labels.${exportFormat}`;
      
      if (exportFormat === 'pdf') {
         // Create PDF using jsPDF
         const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
         const pdfWidth = pdf.internal.pageSize.getWidth();
         const pdfHeight = pdf.internal.pageSize.getHeight();

         for (let i = 0; i < pageBlobs.length; i++) {
           if (i > 0) pdf.addPage();
           
           // jsPDF addImage supports Blob since recent versions, or we can use ArrayBuffer
           const buffer = await pageBlobs[i].arrayBuffer();
           const uint8 = new Uint8Array(buffer);
           
           // We need to provide format. 
           pdf.addImage(uint8, 'PNG', 0, 0, pdfWidth, pdfHeight);
         }
         resultBlob = pdf.output('blob');
         
      } else if (exportFormat === 'png') {
         if (pageBlobs.length === 1) {
            resultBlob = pageBlobs[0];
         } else {
            const zip = new JSZip();
            for (let i = 0; i < pageBlobs.length; i++) {
               zip.file(`page-${i+1}.png`, pageBlobs[i]);
            }
            resultBlob = await zip.generateAsync({ type: 'blob' });
         }
      } else if (exportFormat === 'svg') {
         // SVG generation is tricky in worker because we were using simple string concatenation in the main thread
         // which is fine, but we don't have the canvas data as easily accessible "dataURL" string without conversion.
         // We can do it!
         // But for now, let's treat SVG same as PNG regarding zip for multiple pages?
         // Actually the previous logic was: embed PNG inside SVG.
         // Let's stick to that.
         
         const a4WMm = 210;
         const a4HMm = 297;
         
         const createSvgContent = async (pngBlob) => {
            // Buffer to base64
            const reader = new FileReader();
            return new Promise(resolve => {
               reader.onloadend = () => {
                  const base64data = reader.result; // data:image/png;base64,...
                  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${a4WMm}mm" height="${a4HMm}mm" viewBox="0 0 ${a4WMm} ${a4HMm}">
  <image x="0" y="0" width="${a4WMm}" height="${a4HMm}" xlink:href="${base64data}" />
</svg>`;
                  resolve(svg);
               };
               reader.readAsDataURL(pngBlob);
            });
         };

         if (pageBlobs.length === 1) {
            const svgContent = await createSvgContent(pageBlobs[0]);
            resultBlob = new Blob([svgContent], { type: 'image/svg+xml' });
         } else {
            const zip = new JSZip();
            for (let i = 0; i < pageBlobs.length; i++) {
               const svgContent = await createSvgContent(pageBlobs[i]);
               zip.file(`page-${i+1}.svg`, svgContent);
            }
            resultBlob = await zip.generateAsync({ type: 'blob' });
         }
      }

      postMessage({ type: 'SUCCESS', blob: resultBlob, filename });

    } catch (error) {
       console.error(error);
      postMessage({ type: 'ERROR', error: error.message });
    }
  }
};
