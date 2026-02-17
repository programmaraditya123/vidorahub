require("dotenv").config();

const express = require("express");
const addTranscodeJob = require("./src/queue/jobProducer");
const transcodeQueue = require("./src/queue/transcodeQueue");

const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const { connectdb } = require("./db/mongo");

const app = express();
app.use(express.json());


connectdb();


const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(transcodeQueue)],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

app.get("/",(req,res) => {
    res.send("backned is runing")
})




app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ffmpeg-worker" });
});


app.post("/addJobToQueue", async (req, res) => {
  try {
    const jobData = req.body;

    await addTranscodeJob(jobData);

    res.json({
      message: "job added Successfully",
      data: jobData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add job" });
  }
});


app.get("/queue/stats", async (req, res) => {
  const waiting = await transcodeQueue.getWaitingCount();
  const active = await transcodeQueue.getActiveCount();
  const completed = await transcodeQueue.getCompletedCount();
  const failed = await transcodeQueue.getFailedCount();

  res.json({
    waiting,
    active,
    completed,
    failed,
  });
});


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`FFmpeg Worker Service running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/admin/queues`);
});