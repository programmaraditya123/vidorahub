//this uploads the video of different resolutions back into the gcloud storage

const fs = require("fs-extra");
const path = require("path");
const bucket = require("../gcs/storage");

async function uploadDirectory(localDir, gcsPath) {
  const files = await fs.readdir(localDir);

  for (const file of files) {
    await bucket.upload(path.join(localDir, file), {
      destination: `${gcsPath}/${file}`,
    });
  }
}

module.exports = uploadDirectory;