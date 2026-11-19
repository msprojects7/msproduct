import QRCode from 'qrcode';

// Cache generated QR data URLs to prevent redundant re-renders
const qrCache = new Map<string, string>();

export async function generateQrDataUrl(text: string): Promise<string> {
  if (qrCache.has(text)) {
    return qrCache.get(text)!;
  }
  try {
    const url = await QRCode.toDataURL(text, {
      margin: 1,
      width: 320,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    qrCache.set(text, url);
    return url;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}
