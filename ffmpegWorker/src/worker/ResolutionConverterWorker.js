require("dotenv").config();

const { Worker } = require("bullmq");
const connection = require("../config");

const { connectdb } = require("../../db/mongo");
const Video = require("../../db/videoModel");

const downloadVideo = require("../ffmpeg/downloader");
const encodeVideo = require("../ffmpeg/encoder");
const uploadDirectory = require("../ffmpeg/uploader");
const { createTempDir, cleanup } = require("../ffmpeg/tempManager");

(async () => {
  try {
    // ✅ Connect MongoDB
    await connectdb();
    console.log("✅ MongoDB Connected");

    console.log("🚀 Enter into the worker .......");

    const worker = new Worker(
      "trandcodeQueue",
      async (job) => {
        console.log("📦 Processing Job:", job.id);

        const { videoId, inputUrl, outputPath, resolutions } = job.data;

        const tmpDir = `/tmp/${videoId}`;
        const inputFile = `${tmpDir}/input.mp4`;

        try {
          await createTempDir(tmpDir);

          console.log("⬇️ Downloading...");
          await downloadVideo(inputUrl, inputFile);

          console.log("🎬 Encoding...");
          // for (const res of resolutions) {
            await encodeVideo(inputFile, tmpDir, resolutions);
          // }

          console.log("☁️ Uploading...");
          await uploadDirectory(tmpDir, outputPath);

          console.log("🗄 Updating DB...");
          await Video.updateOne(
            { _id: videoId },
            { Status: "ready", hlsUl: outputPath }
          );

          console.log("✅ Done:", videoId);
        } catch (err) {
          console.error("❌ Error inside job:", err);

          await Video.updateOne(
            { videoId },
            { status: "failed" }
          );

          throw err; // Important: Let BullMQ mark job as failed
        } finally {
          await cleanup(tmpDir);
        }
      },
      { connection }
    );

    // ✅ Worker lifecycle events
    worker.on("ready", () => {
      console.log("🟢 Worker is ready and waiting for jobs...");
    });

    worker.on("completed", (job) => {
      console.log(`🎉 Job completed: ${job.id}`);
    });

    worker.on("failed", (job, err) => {
      console.error(`🔥 Job failed: ${job?.id}`, err);
    });

    worker.on("error", (err) => {
      console.error("🚨 Worker error:", err);
    });

  } catch (err) {
    console.error("❌ Failed to start worker:", err);
    process.exit(1);
  }
})();