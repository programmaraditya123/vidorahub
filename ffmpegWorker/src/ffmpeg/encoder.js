const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

const resolutionMap = {
  "360p": { size: "640x360", bandwidth: 800000 },
  "480p": { size: "854x480", bandwidth: 1400000 },
  "720p": { size: "1280x720", bandwidth: 2800000 },
  "1080p": { size: "1920x1080", bandwidth: 5000000 },
};

function encodeVideo(input, outputDir, resolutions) {
  return new Promise(async (resolve, reject) => {
    try {
      // ✅ Auto-fix if single resolution string
      if (typeof resolutions === "string") {
        resolutions = [resolutions];
      }

      if (!Array.isArray(resolutions)) {
        return reject(new Error("resolutions must be an array or string"));
      }

      const masterPlaylistPath = path.join(outputDir, "master.m3u8");
      let masterContent = "#EXTM3U\n#EXT-X-VERSION:3\n";

      for (const resolution of resolutions) {
        const config = resolutionMap[resolution];

        if (!config) {
          throw new Error(`Unsupported resolution: ${resolution}`);
        }

        const resDir = path.join(outputDir, resolution);
        fs.mkdirSync(resDir, { recursive: true });

        const segmentPath = path.join(resDir, "segment_%03d.ts");
        const playlistPath = path.join(resDir, "index.m3u8");

        console.log(`🎬 Encoding ${resolution}...`);

        await new Promise((res, rej) => {
          ffmpeg(input)
            .videoCodec("libx264")
            .audioCodec("aac")
            .size(config.size)
            .addOptions([
              "-preset veryfast",
              "-profile:v main",
              "-crf 20",
              "-sc_threshold 0",
              "-g 48",
              "-keyint_min 48",
              "-hls_time 6",
              "-hls_playlist_type vod",
              `-hls_segment_filename ${segmentPath}`,
            ])
            .output(playlistPath)
            .on("end", () => {
              console.log(`✅ Finished ${resolution}`);
              res();
            })
            .on("error", (err) => {
              console.error(`❌ Failed ${resolution}`, err);
              rej(err);
            })
            .run();
        });

        // Add entry to master playlist
        masterContent += `
#EXT-X-STREAM-INF:BANDWIDTH=${config.bandwidth},RESOLUTION=${config.size}
${resolution}/index.m3u8
`;
      }

      // Write master playlist
      fs.writeFileSync(masterPlaylistPath, masterContent);

      console.log("🎉 HLS Master Playlist Created");
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = encodeVideo;






// const ffmpeg = require("fluent-ffmpeg");
// const ffmpegPath = require("ffmpeg-static");

// ffmpeg.setFfmpegPath(ffmpegPath);
// const path = require("path");

// const resolutionMap = {
//   "360p": "640x360",
//   "480p": "854x480",
//   "720p": "1280x720",
//   "1080p": "1920x1080",
// };

// function encodeVideo(input, outputDir, resolution) {
//   return new Promise((resolve, reject) => {
//     const size = resolutionMap[resolution];

//     if (!size) {
//       return reject(new Error(`Unsupported resolution: ${resolution}`));
//     }

//     ffmpeg(input)
//       .videoCodec("libx264")
//       .size(size) // ✅ correct format now
//       .output(path.join(outputDir, `video_${resolution}.mp4`))
//       .on("end", () => {
//         console.log(`✅ Finished encoding ${resolution}`);
//         resolve();
//       })
//       .on("error", (err) => {
//         console.error(`❌ Encoding failed for ${resolution}`, err);
//         reject(err);
//       })
//       .run();
//   });
// }

// module.exports = encodeVideo;