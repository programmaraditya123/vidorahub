const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const base = alphabet.length;

// ---------------- ENCODER ----------------
export function encodeFilename(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);

  let num = 0n;
  for (const b of bytes) {
    num = (num << 8n) + BigInt(b);
  }

  let encoded = "";
  while (num > 0n) {
    const index = Number(num % BigInt(base));
    encoded = alphabet[index] + encoded;
    num /= BigInt(base);
  }

  return encoded || "A";
}

// ---------------- DECODER ----------------
export function decodeFilename(encoded: string): string {
  let num = 0n;

  // Convert Base62 → BigInt
  for (const ch of encoded) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) throw new Error("Invalid encoded character: " + ch);
    num = num * BigInt(base) + BigInt(idx);
  }

  // Convert BigInt → bytes
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 255n));
    num >>= 8n;
  }

  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
}
