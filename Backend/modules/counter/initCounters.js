// import mongoose from "mongoose";
// import { Counter } from "./counter.model.js";

// async function initCounters() {
//   await mongoose.connect(process.env.MONGO_URI);

//   await Counter.updateOne(
//     { _id: "user" },
//     { $setOnInsert: { seq: 0 } },
//     { upsert: true }
//   );

//   await Counter.updateOne(
//     { _id: "video" },
//     { $setOnInsert: { seq: 500000000 } },
//     { upsert: true }
//   );

//   console.log("Counters initialized");
//   process.exit();
// }

// initCounters();
