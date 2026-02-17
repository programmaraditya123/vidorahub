//this downloads the file from gcloud storage

const axios = require("axios");
const fs = require("fs-extra");

async function downloadVideo(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);
  const response = await axios.get(url, { responseType: "stream" });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

module.exports = downloadVideo;