const RoaringBitmap32 = require("roaring/RoaringBitmap32");

const bitmapStore = new Map();

/*
  Key examples:
    video:10:likes
    video:10:dislikes
    user:5:seen
    user:5:following
*/

// 🔹 Get or create bitmap
function getBitmap(key) {
  if (!bitmapStore.has(key)) {
    bitmapStore.set(key, new RoaringBitmap32());
  }
  return bitmapStore.get(key);
}

// 🔹 Add value
function addToBitmap(key, value) {
  const bitmap = getBitmap(key);
  bitmap.add(value);
  return bitmap.size;
}

// 🔹 Remove value
function removeFromBitmap(key, value) {
  const bitmap = getBitmap(key);
  bitmap.remove(value);
  return bitmap.size;
}

// 🔹 Check if value exists
function existsInBitmap(key, value) {
  const bitmap = getBitmap(key);
  return bitmap.has(value);
}

// 🔹 Count values
function countBitmap(key) {
  const bitmap = getBitmap(key);
  return bitmap.size;
}

// 🔹 Get all values (be careful for large sets)
function getAllValues(key) {
  const bitmap = getBitmap(key);
  return bitmap.toArray();
}

// 🔹 Union (OR)
function unionBitmaps(key1, key2) {
  const bm1 = getBitmap(key1);
  const bm2 = getBitmap(key2);

  const result = RoaringBitmap32.or(bm1, bm2);
  return result.toArray();
}

// 🔹 Intersection (AND)
function intersectBitmaps(key1, key2) {
  const bm1 = getBitmap(key1);
  const bm2 = getBitmap(key2);

  const result = RoaringBitmap32.and(bm1, bm2);
  return result.toArray();
}

// 🔹 Delete bitmap completely
function deleteBitmap(key) {
  return bitmapStore.delete(key);
}

// 🔹 Stats
function stats() {
  return {
    totalBitmaps: bitmapStore.size,
  };
}

module.exports = {
  addToBitmap,
  removeFromBitmap,
  existsInBitmap,
  countBitmap,
  getAllValues,
  unionBitmaps,
  intersectBitmaps,
  deleteBitmap,
  stats,
};
