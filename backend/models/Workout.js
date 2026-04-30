const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  exercises: [
    {
      name: String,
      sets: Number,
      reps: Number,
      completed: { type: Boolean, default: false }
    }
  ],
  duration: { type: Number, default: 0 },
  calories: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Workout", workoutSchema);