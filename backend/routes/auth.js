const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Streak = require("../models/Streak");

// SIGNUP
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered!" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ name, email, password: hashed });

    // Create streak for user
    await Streak.create({ userId: user._id });

    res.status(201).json({ message: "Account created successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Server error!" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    // Check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Wrong password!" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        streak: user.streak,
        weight: user.weight || 70,
        age: user.age || 25
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error!" });
  }
});

// UPDATE PROFILE (weight, age, bio, goal)
const authMiddleware = require("../middleware/authMiddleware");

router.put("/update-profile", authMiddleware, async (req, res) => {
  const { weight, age, bio, goal, name } = req.body;
  try {
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { weight, age, bio, goal, name },
      { new: true }
    );
    res.json({
      id: updated._id,
      name: updated.name,
      email: updated.email,
      streak: updated.streak,
      weight: updated.weight,
      age: updated.age
    });
  } catch (err) {
    res.status(500).json({ error: "Update failed!" });
  }
});

module.exports = router;