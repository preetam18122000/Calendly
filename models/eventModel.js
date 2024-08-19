const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const eventSchema = new mongoose.Schema({
  menteeEmail: { //a visitor who is scheduling the meet
    type: String,
    required: true,
  },
  mentorID: { //person whose calendar is scheduled-> me
    type: ObjectId,
    ref: "User",
  },
  schedule: {
    type: ObjectId,
    ref: "Schedule",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  day: {
    type: Date,
    required: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Event", eventSchema);