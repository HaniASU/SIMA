import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import bwipjs from 'bwip-js';

export const generateQRThumbnail = async (data) => {
  try {
    return await QRCode.toDataURL(data, { margin: 0, width: 120 });
  } catch (error) {
    console.error('Failed to generate QR thumbnail for:', data, error);
    throw error;
  }
};

export const generateQRCode = async (data, sizePx) => {
  try {
    return await QRCode.toDataURL(data, {
      margin: 0,
      width: Math.round(sizePx),
    });
  } catch (error) {
    console.error('Failed to generate QR code for:', data, error);
    throw error;
  }
};

export const generateQRWithLogo = async (data, sizePx, logoBase64, position = 'center') => {
  try {
    // 1. Generate QR Code
    const qrDataUrl = await QRCode.toDataURL(data, {
      margin: 0,
      width: Math.round(sizePx),
      errorCorrectionLevel: 'H', // High error correction for logo overlay
    });

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
    return generateQRCode(data, sizePx); // Fallback
  }
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

export const generateBarcodeThumbnail = (data) => {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, data, {
      format: 'CODE128',
      width: 1,
      height: 40,
      displayValue: false,
      margin: 0,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to generate barcode thumbnail for:', data, error);
    throw error;
  }
};

export const generateBarcode = (data, width, height) => {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, data, {
      format: 'CODE128',
      width: Math.max(1, Math.round(width / 100)),
      height: Math.round(height),
      displayValue: false,
      margin: 0,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to generate barcode for:', data, error);
    throw error;
  }
};

export const generateDataMatrixThumbnail = async (data) => {
  try {
    const canvas = document.createElement('canvas');
    bwipjs.toCanvas(canvas, {
      bcid: 'datamatrix',
      text: data,
      scale: 3,
      padding: 0,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to generate Data Matrix thumbnail for:', data, error);
    throw error;
  }
};

export const generateDataMatrix = async (data, sizePx) => {
  try {
    const canvas = document.createElement('canvas');
    bwipjs.toCanvas(canvas, {
      bcid: 'datamatrix',
      text: data,
      scale: Math.max(2, Math.round(sizePx / 30)),
      padding: 0,
    });
    return canvas.toDataURL('image/png');
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
