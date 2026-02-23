//this uploads the video of different resolutions back into the gcloud storage

const fs = require("fs-extra");
const path = require("path");
const bucket = require("../gcs/storage");

async function uploadDirectory(localDir, gcsPath) {
  const items = await fs.readdir(localDir);

  for (const item of items) {
    const fullPath = path.join(localDir, item);
    const stat = await fs.stat(fullPath);

    const gcsDestination = `${gcsPath}/${item}`.replace(/\\/g, "/");

    if (stat.isDirectory()) {
      // 🔁 recursively upload subfolder
      await uploadDirectory(fullPath, gcsDestination);
    } else {
      // 🎯 set correct content type for HLS
      let contentType = "application/octet-stream";

      if (item.endsWith(".m3u8")) {
        contentType = "application/x-mpegURL";
      } else if (item.endsWith(".ts")) {
        contentType = "video/MP2T";
      }

      await bucket.upload(fullPath, {
        destination: gcsDestination,
        metadata: {
          contentType,
        },
      });

      console.log("☁️ Uploaded:", gcsDestination);
    }
  }
}

module.exports = uploadDirectory;