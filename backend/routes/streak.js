const express = require("express");
const router = express.Router();
const Streak = require("../models/Streak");
const authMiddleware = require("../middleware/authMiddleware");
const cron = require("node-cron");
const User = require("../models/User");

router.get("/my", authMiddleware, async (req, res) => {
  try {
    let streak = await Streak.findOne({ userId: req.user.id });
    if (!streak) {
      streak = await Streak.create({
        userId: req.user.id,
        currentStreak: 0,
        bestStreak: 0
      });
    }
    res.json(streak);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error!" });
  }
});

router.put("/update", authMiddleware, async (req, res) => {
  try {
    let streak = await Streak.findOne({ userId: req.user.id });
    if (!streak) {
      streak = await Streak.create({
        userId: req.user.id,
        currentStreak: 0,
        bestStreak: 0
      });
    }
    const newStreak = streak.currentStreak + 1;
    const bestStreak = Math.max(newStreak, streak.bestStreak);
    const updated = await Streak.findOneAndUpdate(
      { userId: req.user.id },
      { currentStreak: newStreak, bestStreak, lastUpdated: new Date() },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error!" });
  }
});

cron.schedule("0 0 * * *", async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await User.updateMany(
    { lastWorkout: { $lt: yesterday } },
    { $set: { streak: 0 } }
  );
  console.log("Streaks checked!");
});

module.exports = router;