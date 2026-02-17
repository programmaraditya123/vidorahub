// require("dotenv").config();

// const { Worker } = require("bullmq");
// const connection = require("../queue/redis");

// const connectMongo = require("../db/mongo");
// const Video = require("../db/videoModel");

// const downloadVideo = require("../ffmpeg/downloader");
// const encodeVideo = require("../ffmpeg/encoder");
// const uploadDirectory = require("../ffmpeg/uploader");
// const { createTempDir, cleanup } = require("../ffmpeg/tempManager");

// connectMongo();

// new Worker(
//   "transcodeQueue",
//   async (job) => {
//     const { videoId, inputUrl, outputPath, resolutions } = job.data;

//     const tmpDir = `/tmp/${videoId}`;
//     const inputFile = `${tmpDir}/input.mp4`;

//     await createTempDir(tmpDir);

//     console.log("Downloading...");
//     await downloadVideo(inputUrl, inputFile);

//     console.log("Encoding...");
//     for (const res of resolutions) {
//       await encodeVideo(inputFile, tmpDir, res);
//     }

//     console.log("Uploading...");
//     await uploadDirectory(tmpDir, outputPath);

//     console.log("Updating DB...");
//     await Video.updateOne(
//       { videoId },
//       { status: "ready", hlsPath: outputPath }
//     );

//     await cleanup(tmpDir);

//     console.log("Done:", videoId);
//   },
//   { connection }
// );