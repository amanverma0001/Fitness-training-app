const mongoose = require("mongoose");

const nutritionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  meals: [
    {
      name: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fats: Number,
      time: { type: String, default: "Breakfast" }
    }
  ],
  waterIntake: { type: Number, default: 0 },
  totalCalories: { type: Number, default: 0 },
  totalProtein: { type: Number, default: 0 },
  totalCarbs: { type: Number, default: 0 },
  totalFats: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Nutrition", nutritionSchema);