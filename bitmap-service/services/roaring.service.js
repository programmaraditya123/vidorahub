const RoaringBitmap32 = require("roaring/RoaringBitmap32");
const redis = require("../config/redis"); // your redis file

const bitmapStore = new Map();
const dirtyBitmaps = new Set();
const FLUSH_INTERVAL = 30000;

 
async function loadBitmap(key) {
  const data = await redis.get(key);

  if (!data) {
    return new RoaringBitmap32();
  }

  const buffer = Buffer.from(data, "base64");
  return RoaringBitmap32.deserialize(buffer,true);
}

 
async function saveBitmap(key, bitmap) {
  const buffer = bitmap.serialize(true);

  // Redis stores string → encode buffer safely
  await redis.set(key, buffer.toString("base64"));
}
 
async function getBitmap(key) {
  if (!bitmapStore.has(key)) {
    const bitmap = await loadBitmap(key);
    bitmapStore.set(key, bitmap);
  }
  return bitmapStore.get(key);
}

 
async function flushBitmaps() {
  if (dirtyBitmaps.size === 0) return;

  console.log(`Flushing ${dirtyBitmaps.size} bitmaps to Redis`);

  for (const key of dirtyBitmaps) {
    const bitmap = bitmapStore.get(key);
    if (bitmap) {
      await saveBitmap(key, bitmap);
    }
  }

  dirtyBitmaps.clear();
}

setInterval(flushBitmaps, FLUSH_INTERVAL);

 
async function addToBitmap(key, value) {
  const bitmap = await getBitmap(key);
  bitmap.add(value);
  dirtyBitmaps.add(key);
  return bitmap.size;
}

async function removeFromBitmap(key, value) {
  const bitmap = await getBitmap(key);
  bitmap.remove(value);
  dirtyBitmaps.add(key);
  return bitmap.size;
}

async function existsInBitmap(key, value) {
  const bitmap = await getBitmap(key);
  return bitmap.has(value);
}

async function countBitmap(key) {
  const bitmap = await getBitmap(key);
  return bitmap.size;
}

module.exports = {
  addToBitmap,
  removeFromBitmap,
  existsInBitmap,
  countBitmap,
};
