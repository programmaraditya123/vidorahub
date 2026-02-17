//this temporarily store video for processing  or storing purpose

const fs = require("fs-extra");

async function createTempDir(dir) {
  await fs.ensureDir(dir);
}

async function cleanup(dir) {
  await fs.remove(dir);
}

module.exports = { createTempDir, cleanup };