import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

function WorkoutSession({ darkMode }) {
  const workoutPlans = {
    "Push Day": [
      { name: "Push Ups", sets: 4, reps: 15, completed: false },
      { name: "Bench Press", sets: 3, reps: 10, completed: false },
      { name: "Shoulder Press", sets: 3, reps: 12, completed: false },
      { name: "Tricep Dips", sets: 3, reps: 12, completed: false },
      { name: "Lateral Raises", sets: 3, reps: 15, completed: false },
    ],
    "Pull Day": [
      { name: "Pull Ups", sets: 4, reps: 8, completed: false },
      { name: "Bent Over Rows", sets: 3, reps: 10, completed: false },
      { name: "Lat Pulldown", sets: 3, reps: 12, completed: false },
      { name: "Bicep Curls", sets: 3, reps: 15, completed: false },
      { name: "Face Pulls", sets: 3, reps: 15, completed: false },
    ],
    "Leg Day": [
      { name: "Squats", sets: 4, reps: 12, completed: false },
      { name: "Romanian Deadlift", sets: 3, reps: 10, completed: false },
      { name: "Leg Press", sets: 3, reps: 15, completed: false },
      { name: "Lunges", sets: 3, reps: 12, completed: false },
      { name: "Calf Raises", sets: 4, reps: 20, completed: false },
    ],
    "Cardio Day": [
      { name: "Warm Up Run", sets: 1, reps: 5, completed: false },
      { name: "High Knees", sets: 4, reps: 30, completed: false },
      { name: "Burpees", sets: 3, reps: 15, completed: false },
      { name: "Jump Rope", sets: 4, reps: 50, completed: false },
      { name: "Cool Down Walk", sets: 1, reps: 5, completed: false },
    ],
    "Full Body": [
      { name: "Deadlifts", sets: 3, reps: 8, completed: false },
      { name: "Push Ups", sets: 3, reps: 15, completed: false },
      { name: "Pull Ups", sets: 3, reps: 8, completed: false },
      { name: "Squats", sets: 3, reps: 12, completed: false },
      { name: "Plank", sets: 3, reps: 60, completed: false },
    ],
  };

  const workoutIcons = { "Push Day": "💪", "Pull Day": "🏋️", "Leg Day": "🦵", "Cardio Day": "🏃", "Full Body": "🔥" };

  const [selectedWorkout, setSelectedWorkout] = useState(localStorage.getItem("selectedWorkout") || "Push Day");
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [exercises, setExercises] = useState(workoutPlans[localStorage.getItem("selectedWorkout") || "Push Day"]);
  const [friendActivity, setFriendActivity] = useState([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // MET values per workout type (Metabolic Equivalent of Task)
  const MET_VALUES = {
    "Push Day": 5.0,
    "Pull Day": 5.0,
    "Leg Day": 6.0,
    "Cardio Day": 9.5,
    "Full Body": 5.5,
  };

  const calcCalories = (durationSeconds, workoutType) => {
    const freshUser = JSON.parse(localStorage.getItem("user")) || {};
    const weight = freshUser.weight || user?.weight || 70;
    const age = freshUser.age || user?.age || 25;
    const met = MET_VALUES[workoutType] || 5.0;
    const minutes = durationSeconds / 60;
    // MET formula: cal/min = (MET × weight_kg × 3.5) / 200
    const calPerMin = (met * weight * 3.5) / 200;
    // Age correction: ~0.4% less per year after age 20
    const ageFactor = age > 20 ? Math.max(0.75, 1 - (age - 20) * 0.004) : 1;
    return Math.round(calPerMin * minutes * ageFactor);
  };

  const isDark = darkMode !== false;
  const bg = isDark ? "#030309" : "#f0f2ff";
  const cardBg = isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.85)";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)";
  const textColor = isDark ? "#fff" : "#1a1a2e";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "#777";
  const dividerColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const subBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const cardShadow = isDark
    ? "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 8px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)";

  const card = (extra = {}) => ({
    background: cardBg,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${cardBorder}`,
    borderRadius: "20px",
    boxShadow: cardShadow,
    position: "relative",
    overflow: "hidden",
    ...extra,
  });

  useEffect(() => {
    socket.on("friend_working_out", (data) => {
      setFriendActivity(prev => [{ ...data, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
    });
    return () => { socket.off("friend_working_out"); clearInterval(intervalRef.current); };
  }, []);

  const changeWorkout = (type) => {
    if (isRunning) {
      const ok = window.confirm("Workout chal rahi hai! Change karna chahte ho?");
      if (!ok) return;
    }
    setSelectedWorkout(type);
    setExercises(workoutPlans[type].map(e => ({ ...e, completed: false })));
    setSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
    clearInterval(intervalRef.current);
    localStorage.setItem("selectedWorkout", type);
  };

  const startWorkout = () => {
    setIsRunning(true);
    setIsPaused(false);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    socket.emit("workout_started", { user: user?.name });
  };

  const pauseWorkout = () => {
    if (!isPaused) {
      clearInterval(intervalRef.current);
      setIsPaused(true);
    } else {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      setIsPaused(false);
    }
  };

  const finishWorkout = async () => {
    if (saving) return;
    setSaving(true);
    clearInterval(intervalRef.current);
    setIsRunning(false);
    try {
      const res = await axios.post("http://localhost:5001/api/workout/create",
        {
          name: selectedWorkout,
          exercises,
          duration: Math.floor(seconds / 60) || 1,
          calories: calcCalories(seconds, selectedWorkout)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("user", JSON.stringify({ ...user, streak: res.data.streak }));
      setFinished(true);
      setTimeout(() => navigate("/dashboard"), 3000);
    } catch (err) {
      console.log(err);
      setSaving(false);
      alert("Error saving! Check console.");
    }
  };

  const toggleExercise = (index) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], completed: !updated[index].completed };
      return updated;
    });
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m < 10 ? "0" : ""}${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const completedCount = exercises.filter(e => e.completed).length;
  const progress = Math.round((completedCount / exercises.length) * 100);

  if (finished) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: isDark ? "#030309" : "#f0f2ff" }}>
        <div style={{ ...card({ padding: "60px 52px", textAlign: "center", maxWidth: "400px" }), animation: "popIn 0.5s cubic-bezier(0.34,1.5,0.64,1)" }}>
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.7), transparent)",
          }} />
          <p style={{ fontSize: "80px", margin: "0 0 16px", animation: "bounceIn 0.8s ease" }}>🔥</p>
          <h2 style={{
            fontSize: "30px", fontWeight: "800", margin: "0 0 8px",
            background: "linear-gradient(135deg, #ff6b35, #ffb347)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Workout Complete!</h2>
          <p style={{ color: mutedColor, margin: "0 0 8px" }}>Amazing work! Streak updated! 💪</p>
          <p style={{ fontSize: "14px", color: "#ff6b35", fontWeight: "600", margin: "0 0 20px" }}>
            {selectedWorkout} {workoutIcons[selectedWorkout]}
          </p>
          <p style={{
            fontSize: "52px", fontWeight: "200", color: textColor, margin: "0 0 8px",
            letterSpacing: "4px", textShadow: "0 0 30px rgba(255,107,53,0.4)",
          }}>{formatTime(seconds)}</p>
          <p style={{ color: mutedColor, fontSize: "14px" }}>Redirecting to dashboard...</p>
        </div>
        <style>{`
          @keyframes popIn { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
          @keyframes bounceIn { 0% { transform: scale(0.5) rotate(-20deg); } 60% { transform: scale(1.2) rotate(10deg); } 100% { transform: scale(1) rotate(0deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", background: bg, minHeight: "100vh" }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse at 80% 20%, rgba(255,107,53,0.04) 0%, transparent 50%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{ maxWidth: "1040px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", animation: "fadeInUp 0.5s ease" }}>
          <div>
            <h2 style={{ margin: 0, color: textColor, fontSize: "22px", fontWeight: "700" }}>
              {workoutIcons[selectedWorkout]}{" "}
              <span style={{ background: "linear-gradient(135deg, #ff6b35, #ffb347)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {selectedWorkout}
              </span>
            </h2>
            <p style={{ margin: "4px 0 0", color: mutedColor, fontSize: "13px" }}>
              {exercises.length} exercises · Let's crush it!
            </p>
          </div>
          {isRunning && (
            <div style={{
              background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)",
              color: "#4ade80", padding: "7px 16px", borderRadius: "20px",
              fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "7px",
            }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", animation: "livePulse 1.5s infinite" }} />
              Live Session
            </div>
          )}
        </div>

        {/* Workout selector */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap", animation: "fadeInUp 0.5s 0.05s ease both" }}>
          {Object.keys(workoutPlans).map((type) => (
            <button key={type} onClick={() => changeWorkout(type)} style={{
              padding: "9px 18px",
              background: selectedWorkout === type ? "linear-gradient(135deg, #ff6b35, #D85A30)" : cardBg,
              backdropFilter: "blur(10px)",
              color: selectedWorkout === type ? "white" : mutedColor,
              border: `1.5px solid ${selectedWorkout === type ? "rgba(255,107,53,0.5)" : cardBorder}`,
              borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontWeight: "600",
              transition: "all 0.25s cubic-bezier(0.34,1.3,0.64,1)",
              boxShadow: selectedWorkout === type ? "0 4px 15px rgba(255,107,53,0.4)" : "none",
              transform: selectedWorkout === type ? "scale(1.06)" : "scale(1)",
            }}>
              {workoutIcons[type]} {type}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Timer */}
            <div style={{ ...card({ padding: "36px", textAlign: "center" }), animation: "fadeInUp 0.5s 0.1s ease both" }}>
              <div style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.6), transparent)",
              }} />

              {/* Circular ring behind timer */}
              <div style={{ position: "relative", display: "inline-block", marginBottom: "8px" }}>
                <div style={{
                  width: "160px", height: "160px", borderRadius: "50%", margin: "0 auto",
                  border: "3px solid rgba(255,107,53,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: isRunning && !isPaused
                    ? "0 0 40px rgba(255,107,53,0.25), inset 0 0 30px rgba(255,107,53,0.05)"
                    : "none",
                  animation: isRunning && !isPaused ? "ringPulse 2s ease-in-out infinite" : "none",
                }}>
                  <div>
                    <p style={{ color: mutedColor, margin: "0 0 4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "600" }}>
                      Session Time
                    </p>
                    <h1 style={{
                      fontSize: "56px", color: "#ff6b35", margin: 0, fontWeight: "200", letterSpacing: "3px",
                      textShadow: isRunning ? "0 0 30px rgba(255,107,53,0.6)" : "none",
                      animation: isRunning && !isPaused ? "timerPulse 1s ease-in-out infinite" : "none",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {formatTime(seconds)}
                    </h1>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
                {!isRunning ? (
                  <button onClick={startWorkout} className="btn-glow" style={{ padding: "14px 52px", fontSize: "16px", fontWeight: "700", borderRadius: "14px" }}>
                    ▶ Start Workout
                  </button>
                ) : (
                  <>
                    <button onClick={pauseWorkout} style={{
                      padding: "14px 28px", fontSize: "15px", fontWeight: "600", cursor: "pointer",
                      background: isPaused ? "linear-gradient(135deg, #ff6b35, #D85A30)" : subBg,
                      color: isPaused ? "white" : textColor,
                      border: `1.5px solid ${isPaused ? "rgba(255,107,53,0.5)" : dividerColor}`,
                      borderRadius: "12px", transition: "all 0.25s ease",
                      boxShadow: isPaused ? "0 4px 15px rgba(255,107,53,0.4)" : "none",
                    }}>
                      {isPaused ? "▶ Resume" : "⏸ Pause"}
                    </button>
                    <button onClick={finishWorkout} disabled={saving} style={{
                      padding: "14px 28px", fontSize: "15px", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer",
                      background: saving ? subBg : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                      color: saving ? mutedColor : textColor,
                      border: `1.5px solid ${dividerColor}`,
                      borderRadius: "12px", transition: "all 0.2s ease",
                    }}>
                      {saving ? "Saving..." : "Finish 💪"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Progress */}
            <div style={{ ...card({ padding: "18px 24px" }), animation: "fadeInUp 0.5s 0.15s ease both" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "14px", color: textColor, fontWeight: "600" }}>Progress</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#ff6b35" }}>
                  {completedCount}/{exercises.length} · {progress}%
                </span>
              </div>
              <div style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: "20px", height: "10px", overflow: "hidden" }}>
                <div style={{
                  background: "linear-gradient(90deg, #ff6b35, #ffb347)",
                  borderRadius: "20px", height: "10px",
                  width: `${progress}%`,
                  transition: "width 0.5s cubic-bezier(0.34,1.2,0.64,1)",
                  boxShadow: "0 0 10px rgba(255,107,53,0.5)",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    animation: "shimmer 2s infinite",
                  }} />
                </div>
              </div>
            </div>

            {/* Exercise list */}
            <div style={{ ...card({}), animation: "fadeInUp 0.5s 0.2s ease both" }}>
              <div style={{ padding: "18px 24px", borderBottom: `1px solid ${dividerColor}` }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: textColor }}>
                  {workoutIcons[selectedWorkout]} {selectedWorkout} Exercises
                </h3>
              </div>
              {exercises.map((ex, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "16px 24px",
                  borderBottom: i < exercises.length - 1 ? `1px solid ${dividerColor}` : "none",
                  background: ex.completed
                    ? isDark ? "rgba(255,107,53,0.04)" : "rgba(216,90,48,0.04)"
                    : "transparent",
                  transition: "background 0.3s ease",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: ex.completed
                        ? "linear-gradient(135deg, #ff6b35, #D85A30)"
                        : subBg,
                      border: `1.5px solid ${ex.completed ? "rgba(255,107,53,0.4)" : dividerColor}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", color: ex.completed ? "white" : mutedColor,
                      fontWeight: "700",
                      transition: "all 0.3s cubic-bezier(0.34,1.3,0.64,1)",
                      boxShadow: ex.completed ? "0 4px 12px rgba(255,107,53,0.4)" : "none",
                    }}>
                      {ex.completed ? "✓" : i + 1}
                    </div>
                    <div>
                      <p style={{
                        margin: 0, fontWeight: "600",
                        color: ex.completed ? mutedColor : textColor,
                        textDecoration: ex.completed ? "line-through" : "none",
                        fontSize: "14px", transition: "all 0.3s ease",
                      }}>{ex.name}</p>
                      <p style={{ margin: "3px 0 0", color: mutedColor, fontSize: "12px" }}>
                        {ex.sets} sets × {ex.reps} reps
                      </p>
                    </div>
                  </div>
                  <button onClick={() => toggleExercise(i)} style={{
                    padding: "8px 20px", fontSize: "13px", fontWeight: "600",
                    background: ex.completed ? "linear-gradient(135deg, #ff6b35, #D85A30)" : subBg,
                    color: ex.completed ? "white" : textColor,
                    border: `1.5px solid ${ex.completed ? "rgba(255,107,53,0.4)" : dividerColor}`,
                    borderRadius: "10px", cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.34,1.3,0.64,1)",
                    boxShadow: ex.completed ? "0 4px 12px rgba(255,107,53,0.35)" : "none",
                    transform: ex.completed ? "scale(1.03)" : "scale(1)",
                  }}>
                    {ex.completed ? "Done ✓" : "Mark Done"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Session Stats */}
            <div style={{ ...card({ padding: "22px" }), animation: "fadeInUp 0.5s 0.15s ease both" }}>
              <div style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.5), transparent)",
              }} />
              <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: "600", color: textColor }}>⚡ Session Stats</h3>
              {[
                { label: "Workout Type", value: `${workoutIcons[selectedWorkout]} ${selectedWorkout}` },
                { label: "Duration", value: formatTime(seconds), highlight: true },
                { label: "Exercises Done", value: `${completedCount}/${exercises.length}`, highlight: true },
                { label: "Calories Burned", value: `${calcCalories(seconds, selectedWorkout)} kcal`, highlight: true },
                { label: "Current Streak", value: `🔥 ${user?.streak || 0} days`, highlight: true },
              ].map((s, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderBottom: i < 4 ? `1px solid ${dividerColor}` : "none",
                }}>
                  <span style={{ color: mutedColor, fontSize: "13px" }}>{s.label}</span>
                  <span style={{
                    fontWeight: "700", fontSize: "13px",
                    color: s.highlight ? "#ff6b35" : textColor,
                    textShadow: s.highlight ? "0 0 12px rgba(255,107,53,0.4)" : "none",
                  }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Live Activity */}
            <div style={{ ...card({}), animation: "fadeInUp 0.5s 0.2s ease both" }}>
              <div style={{
                padding: "18px 22px",
                borderBottom: `1px solid ${dividerColor}`,
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <div style={{
                  width: "7px", height: "7px", borderRadius: "50%", background: "#ff6b35",
                  animation: "livePulse 1.5s infinite",
                  boxShadow: "0 0 0 3px rgba(255,107,53,0.2)",
                }} />
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: textColor }}>Live Activity</h3>
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "#ff6b35", fontWeight: "600" }}>●</span>
              </div>
              {friendActivity.length === 0 ? (
                <div style={{ padding: "32px 22px", textAlign: "center" }}>
                  <p style={{ fontSize: "36px", margin: "0 0 8px" }}>👥</p>
                  <p style={{ color: mutedColor, fontSize: "13px", margin: 0 }}>
                    Start workout to see friends' activity!
                  </p>
                </div>
              ) : (
                friendActivity.map((a, i) => (
                  <div key={i} style={{
                    padding: "14px 20px", borderBottom: `1px solid ${dividerColor}`,
                    display: "flex", gap: "10px", alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "10px",
                      background: "linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,107,53,0.1))",
                      border: "1px solid rgba(255,107,53,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px", fontWeight: "700", color: "#ff6b35", flexShrink: 0,
                    }}>
                      {a.user?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: "600", fontSize: "13px", color: textColor }}>{a.user}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: mutedColor }}>💪 Started a workout</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: mutedColor }}>{a.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes timerPulse {
          0%, 100% { text-shadow: 0 0 20px rgba(255,107,53,0.5); }
          50% { text-shadow: 0 0 50px rgba(255,107,53,0.9); }
        }
        @keyframes ringPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(255,107,53,0.2), inset 0 0 20px rgba(255,107,53,0.04); }
          50% { box-shadow: 0 0 60px rgba(255,107,53,0.4), inset 0 0 40px rgba(255,107,53,0.08); }
        }
        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(255,107,53,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(255,107,53,0.1); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .btn-glow { position: relative; overflow: hidden; background: linear-gradient(135deg, #ff6b35, #D85A30); border: none; color: white; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.34,1.3,0.64,1); box-shadow: 0 4px 20px rgba(255,107,53,0.4); }
        .btn-glow::before { content: ''; position: absolute; top: -50%; left: -60%; width: 50%; height: 200%; background: rgba(255,255,255,0.2); transform: skewX(-20deg); transition: left 0.5s ease; }
        .btn-glow:hover::before { left: 130%; }
        .btn-glow:hover { transform: translateY(-4px) scale(1.04); box-shadow: 0 10px 40px rgba(255,107,53,0.6); }
      `}</style>
    </div>
  );
}

export default WorkoutSession;
