const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const authMiddleware = require("../middleware/authMiddleware");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/", authMiddleware, async (req, res) => {
  const { messages } = req.body;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Tu ek expert AI Fitness Coach hai jiska naam "Tejas Coach" hai. Tu Hinglish mein baat karta hai. Tu in topics pe expert hai: Exercise techniques, Muscle pain aur injury recovery, Diet aur nutrition, Supplements, Weight loss aur muscle gain, Yoga aur stretching, Mental health. Always friendly aur motivating tone rakho. Clear aur detailed answers do. Emojis use karo. Serious medical conditions ke liye doctor ko refer karo.`
        },
        ...messages
      ],
      max_tokens: 1000,
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "AI error!" });
  }
});

module.exports = router;