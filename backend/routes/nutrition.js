const express = require("express");
const router = express.Router();
const Nutrition = require("../models/Nutrition");
const authMiddleware = require("../middleware/authMiddleware");

// Get today's nutrition
router.get("/today", authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nutrition = await Nutrition.findOne({
      userId: req.user.id,
      date: { $gte: today }
    });
    if (!nutrition) {
      nutrition = await Nutrition.create({ userId: req.user.id, meals: [] });
    }
    res.json(nutrition);
  } catch (err) {
    res.status(500).json({ error: "Server error!" });
  }
});

// Add meal
router.post("/add-meal", authMiddleware, async (req, res) => {
  const { name, calories, protein, carbs, fats, time } = req.body;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nutrition = await Nutrition.findOne({
      userId: req.user.id,
      date: { $gte: today }
    });
    if (!nutrition) {
      nutrition = await Nutrition.create({ userId: req.user.id, meals: [] });
    }
    nutrition.meals.push({ name, calories, protein, carbs, fats, time });
    nutrition.totalCalories += calories;
    nutrition.totalProtein += protein;
    nutrition.totalCarbs += carbs;
    nutrition.totalFats += fats;
    await nutrition.save();
    res.json(nutrition);
  } catch (err) {
    res.status(500).json({ error: "Server error!" });
  }
});

// Add water intake
router.put("/water", authMiddleware, async (req, res) => {
  const { glasses } = req.body;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nutrition = await Nutrition.findOne({
      userId: req.user.id,
      date: { $gte: today }
    });
    if (!nutrition) {
      nutrition = await Nutrition.create({ userId: req.user.id, meals: [] });
    }
    nutrition.waterIntake = glasses;
    await nutrition.save();
    res.json(nutrition);
  } catch (err) {
    res.status(500).json({ error: "Server error!" });
  }
});

// Get history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const history = await Nutrition.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(7);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Server error!" });
  }
});

module.exports = router;