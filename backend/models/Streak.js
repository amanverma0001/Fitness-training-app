const mongoose = require("mongoose");

const streakSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  currentStreak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Streak", streakSchema);