const Counter = require("./counter.model");

const getNextNumber = async (serialName) =>  {
  const counter = await Counter.findOneAndUpdate(
    { _id: serialName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return counter.seq;
}

module.exports = {getNextNumber}
