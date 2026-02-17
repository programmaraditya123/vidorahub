const addTranscodeJob = require("./jobProducer.js");

(async () => {
  await addTranscodeJob({
    videoId: "test123",
    inputUrl: "https://example.com/video.mp4",
    outputPath: "videos/test123",
    resolutions: ["360p"],
  });

  console.log("Job added!");
})();