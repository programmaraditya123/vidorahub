const alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const base = BigInt(alphabet.length);

// Hermes (React Native) does not ship TextEncoder/TextDecoder, so we encode and
// decode UTF-8 manually. The byte output matches TextEncoder, keeping slugs
// compatible with the web app.
function utf8Encode(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const hi = code;
      const lo = str.charCodeAt(++i);
      code = 0x10000 + ((hi - 0xd800) << 10) + (lo - 0xdc00);
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return bytes;
}

function utf8Decode(bytes: number[]): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const c = bytes[i++];
    if (c < 0x80) {
      result += String.fromCharCode(c);
    } else if (c < 0xe0) {
      result += String.fromCharCode(((c & 0x1f) << 6) | (bytes[i++] & 0x3f));
    } else if (c < 0xf0) {
      result += String.fromCharCode(
        ((c & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f),
      );
    } else {
      const code =
        ((c & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f);
      const cp = code - 0x10000;
      result += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    }
  }
  return result;
}

export function encodeFilename(str: string): string {
  const bytes = utf8Encode(str);
  let num = 0n;
  for (const b of bytes) {
    num = (num << 8n) + BigInt(b);
  }

  let encoded = '';
  while (num > 0n) {
    const index = Number(num % base);
    encoded = alphabet[index] + encoded;
    num /= base;
  }

  return encoded || 'A';
}

export function decodeFilename(encoded: string): string {
  let num = 0n;

  for (const ch of encoded) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) throw new Error(`Invalid encoded character: ${ch}`);
    num = num * base + BigInt(idx);
  }

  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 255n));
    num >>= 8n;
  }

  return utf8Decode(bytes);
}

export function buildVideoSlug(filePath: string, videoId: string): string {
  return `${encodeFilename(filePath)}${videoId}`;
}

export function parseVideoSlug(slug: string): { filePath: string; videoId: string } {
  const videoId = slug.slice(-24);
  const encodedPath = slug.slice(0, -24);
  const filePath = decodeFilename(encodedPath);
  return { filePath, videoId };
}

export function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'just now';
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return String(views);
}

export function generateSessionId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
};

export function formatProductPrice(price: number, currency = 'INR'): string {
  const symbol = CURRENCY_SYMBOL[currency.toUpperCase()] ?? `${currency} `;
  const formatted =
    Number.isInteger(price) || price % 1 === 0 ? String(price) : price.toFixed(2);
  return `${symbol}${formatted}`;
}

export function getProductImages(product: {
  images?: string[];
  image?: string;
}): string[] {
  const fromArray = (product.images ?? []).filter(
    (url) => typeof url === 'string' && url.trim().length > 0,
  );
  if (fromArray.length > 0) return fromArray;
  if (product.image?.trim()) return [product.image];
  return [];
}
