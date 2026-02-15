import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import bwipjs from 'bwip-js';

const DEFAULT_DARK_COLOR = '#000000';

export const normalizeHexColor = (value, fallback = DEFAULT_DARK_COLOR) => {
  const raw = String(value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw}`.toUpperCase();
  return fallback;
};

const loadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
};

const createMaskFromCanvas = (sourceCanvas) => {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
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

const applyFillToMask = async (maskCanvas, options = {}) => {
  const width = maskCanvas.width;
  const height = maskCanvas.height;
  const darkColor = normalizeHexColor(options.darkColor, DEFAULT_DARK_COLOR);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const patternImage = options.patternImage;
  if (patternImage) {
    const image = await loadImage(patternImage);
    if (image) {
      ctx.drawImage(image, 0, 0, width, height);
    } else {
      ctx.fillStyle = darkColor;
      ctx.fillRect(0, 0, width, height);
    }
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

  return canvas.toDataURL('image/png');
};

const generateStyledQRCode = async (data, sizePx, options = {}) => {
  const normalizedSize = Math.max(1, Math.round(sizePx));
  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = normalizedSize;
  qrCanvas.height = normalizedSize;

  await QRCode.toCanvas(qrCanvas, data, {
    margin: 0,
    width: normalizedSize,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  const maskCanvas = createMaskFromCanvas(qrCanvas);
  return await applyFillToMask(maskCanvas, options);
};

export const generateQRThumbnail = async (data, options = {}) => {
  try {
    return await generateQRCode(data, 120, options);
  } catch (error) {
    console.error('Failed to generate QR thumbnail for:', data, error);
    throw error;
  }
};

export const generateQRCode = async (data, sizePx, options = {}) => {
  try {
    return await generateStyledQRCode(data, sizePx, options);
  } catch (error) {
    console.error('Failed to generate QR code for:', data, error);
    throw error;
  }
};

export const generateQRWithLogo = async (data, sizePx, logoBase64, position = 'center', options = {}) => {
  try {
    // 1. Generate QR Code
    const qrDataUrl = await generateQRCode(data, sizePx, options);

    if (!logoBase64) return qrDataUrl;

    // 2. Load images
    const qrImage = await loadImage(qrDataUrl);
    const logoImage = await loadImage(logoBase64);

    if (!qrImage || !logoImage) return qrDataUrl;

    // 3. Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = sizePx;
    canvas.height = sizePx;

    // 4. Draw QR Code
    ctx.drawImage(qrImage, 0, 0, sizePx, sizePx);

    // 5. Calculate Logo Size & Position
    const logoSize = sizePx * 0.25; // Larger logo for better brand visibility
    const pad = sizePx * 0.04; // 4% padding from edge
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

    // Draw white background/padding behind logo for readability
    const bgPad = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(logoX - bgPad, logoY - bgPad, logoSize + bgPad * 2, logoSize + bgPad * 2);

    // 6. Draw Logo
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to generate QR with logo:', error);
    return generateQRCode(data, sizePx, options); // Fallback
  }
};

export const generateBarcodeThumbnail = async (data, options = {}) => {
  try {
    return await generateBarcode(data, 120, 40, options);
  } catch (error) {
    console.error('Failed to generate barcode thumbnail for:', data, error);
    throw error;
  }
};

export const generateBarcode = async (data, width, height, options = {}) => {
  try {
    const normalizedWidth = Math.max(1, Math.round(width));
    const normalizedHeight = Math.max(1, Math.round(height));
    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = normalizedWidth;
    rawCanvas.height = normalizedHeight;
    JsBarcode(rawCanvas, data, {
      format: 'CODE128',
      width: Math.max(1, Math.round(normalizedWidth / 100)),
      height: normalizedHeight,
      displayValue: false,
      margin: 0,
      lineColor: '#000000',
      background: '#ffffff',
    });

    const maskCanvas = createMaskFromCanvas(rawCanvas);
    return await applyFillToMask(maskCanvas, options);
  } catch (error) {
    console.error('Failed to generate barcode for:', data, error);
    throw error;
  }
};

export const generateDataMatrixThumbnail = async (data, options = {}) => {
  try {
    return await generateDataMatrix(data, 120, options);
  } catch (error) {
    console.error('Failed to generate Data Matrix thumbnail for:', data, error);
    throw error;
  }
};

export const generateDataMatrix = async (data, sizePx, options = {}) => {
  try {
    const normalizedSize = Math.max(1, Math.round(sizePx));
    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = normalizedSize;
    rawCanvas.height = normalizedSize;
    bwipjs.toCanvas(rawCanvas, {
      bcid: 'datamatrix',
      text: data,
      scale: Math.max(2, Math.round(normalizedSize / 30)),
      padding: 0,
      foregroundcolor: '000000',
      backgroundcolor: 'FFFFFF',
    });

    const maskCanvas = createMaskFromCanvas(rawCanvas);
    return await applyFillToMask(maskCanvas, options);
  } catch (error) {
    console.error('Failed to generate Data Matrix for:', data, error);
    throw error;
  }
};

export const loadQRImage = async (dataUrl) => {
  const img = new Image();
  img.src = dataUrl;

  return new Promise((resolve) => {
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};
