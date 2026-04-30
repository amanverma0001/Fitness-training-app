const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    unique: true, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  streak: { 
    type: Number, 
    default: 0 
  },
  lastWorkout: { 
    type: Date 
  },
  // Profile fields
  bio: {
    type: String,
    default: "Fitness enthusiast 💪"
  },
  goal: {
    type: String,
    default: "Build muscle"
  },
  weight: {
    type: Number,
    default: 70
  },
  age: {
    type: Number,
    default: 25
  },
  // WhatsApp / SMS fields
  phoneNumber: { 
    type: String, 
    default: null 
  },
  whatsappNumber: { 
    type: String, 
    default: null 
  },
  whatsappEnabled: { 
    type: Boolean, 
    default: false 
  },
  // App Reminder fields
  reminderEnabled: { 
    type: Boolean, 
    default: false 
  },
  reminderTime: { 
    type: String, 
    default: "09:00" 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model("User", userSchema);