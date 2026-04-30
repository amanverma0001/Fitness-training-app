const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:3000" }
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/workout", require("./routes/workout"));
app.use("/api/streak", require("./routes/streak"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/nutrition", require("./routes/nutrition"));
app.use("/api/reminder", require("./routes/reminder"));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("workout_started", (data) => {
    io.emit("friend_working_out", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.log("DB Error:", err));

server.listen(process.env.PORT, () => {
  console.log(`Tejas server running on port ${process.env.PORT}`);
});