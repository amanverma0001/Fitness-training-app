const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Streak = require("../models/Streak");
const authMiddleware = require("../middleware/authMiddleware");
const cron = require("node-cron");

router.get("/settings", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("reminderEnabled reminderTime");
    res.json({
      enabled: user.reminderEnabled || false,
      time: user.reminderTime || "09:00"
    });
  } catch (err) {
    res.status(500).json({ error: "Server error!" });
  }
});

router.put("/settings", authMiddleware, async (req, res) => {
  const { enabled, time } = req.body;
  try {
    await User.findByIdAndUpdate(req.user.id, {
      reminderEnabled: enabled,
      reminderTime: time
    });
    res.json({ message: "Reminder settings updated!" });
  } catch (err) {
    res.status(500).json({ error: "Server error!" });
  }
});

router.get("/check", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const streak = await Streak.findOne({ userId: req.user.id });
    const now = new Date();
    const today = now.toDateString();
    const lastWorkoutDate = user.lastWorkout ? new Date(user.lastWorkout).toDateString() : null;
    const workedOutToday = lastWorkoutDate === today;

    const reminders = [];

    if (!user.reminderEnabled) {
      return res.json({ reminders });
    }

    const currentStreak = streak?.currentStreak || 0;

    // Streak about to break — within 6 hours of 48-hour window expiring
    if (currentStreak > 0 && user.lastWorkout) {
      const hoursSinceLast = (now - new Date(user.lastWorkout)) / (1000 * 60 * 60);
      if (hoursSinceLast >= 42 && hoursSinceLast < 48) {
        const hoursLeft = Math.max(1, Math.ceil(48 - hoursSinceLast));
        reminders.push({
          type: "streak_warning",
          title: "🔥 Streak khatre mein hai!",
          body: `Bas ${hoursLeft}h bache hain — ${currentStreak} day streak save karo!`,
          action: "/workout",
          priority: "high"
        });
        return res.json({ reminders });
      }
    }

    // Daily workout reminder if not worked out today
    if (!workedOutToday) {
      reminders.push({
        type: "workout",
        title: "💪 Time to Workout!",
        body: currentStreak > 0
          ? `Aaj ka workout karo — ${currentStreak} day streak chalu hai! 🔥`
          : "Aaj ka workout shuru karo 🚀",
        action: "/workout",
        priority: "normal"
      });
    }

    res.json({ reminders });
  } catch (err) {
    console.log("Reminder check error:", err);
    res.status(500).json({ error: "Server error!" });
  }
});

cron.schedule("0 9 * * *", async () => {
  console.log("🔔 Checking for daily reminders...");
  const users = await User.find({ reminderEnabled: true });
  console.log(`📋 ${users.length} users need reminders today`);
});

module.exports = router;