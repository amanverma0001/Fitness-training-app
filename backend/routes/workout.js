const express = require("express");
const router = express.Router();
const Workout = require("../models/Workout");
const User = require("../models/User");
const Streak = require("../models/Streak");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, async (req, res) => {
  const { name, exercises, duration, calories } = req.body;
  try {
    const workout = await Workout.create({
      userId: req.user.id,
      name,
      exercises,
      duration,
      calories: calories || 0,
      completed: true,
      date: new Date()
    });

    const user = await User.findById(req.user.id);
    const today = new Date();
    const lastWorkout = user.lastWorkout ? new Date(user.lastWorkout) : null;
    
    // ✅ NEW STREAK LOGIC - 1 se start, 48 hours miss pe reset to 1
    let newStreak;
    
    if (!lastWorkout) {
      // First workout ever
      newStreak = 1;
    } else {
      const hoursSinceLastWorkout = (today - lastWorkout) / (1000 * 60 * 60);
      
      if (hoursSinceLastWorkout <= 48) {
        // Consecutive workout within 48 hours
        newStreak = (user.streak || 0) + 1;
      } else {
        // Missed 48 hour window — streak resets to 1 (fresh start)
        newStreak = 1;
      }
    }

    await User.findByIdAndUpdate(req.user.id, {
      streak: newStreak,
      lastWorkout: today
    });

    let streakDoc = await Streak.findOne({ userId: req.user.id });
    if (!streakDoc) {
      streakDoc = await Streak.create({
        userId: req.user.id,
        currentStreak: 0,
        bestStreak: 0
      });
    }
    const bestStreak = Math.max(newStreak, streakDoc.bestStreak);
    await Streak.findOneAndUpdate(
      { userId: req.user.id },
      { currentStreak: newStreak, bestStreak, lastUpdated: today },
      { new: true }
    );

    res.status(201).json({ workout, streak: newStreak });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error!" });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ error: "Server error!" });
  }
});

router.get("/leaderboard", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({})
      .select("name streak lastWorkout")
      .sort({ streak: -1 })
      .limit(10);
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error!" });
  }
});

module.exports = router;