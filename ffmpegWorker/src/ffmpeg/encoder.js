//this converts the video into different resolutions as menioned in queue

const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

function encodeVideo(input, outputDir, resolution) {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .videoCodec("libx264")
      .size(resolution)
      .output(path.join(outputDir, `video_${resolution}.mp4`))
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

module.exports = encodeVideo;