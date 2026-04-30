import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

function Dashboard({ darkMode }) {
  const [workouts, setWorkouts] = useState([]);
  const [streak, setStreak] = useState({ currentStreak: 0, bestStreak: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState("Push Day");
  const [liveActivity, setLiveActivity] = useState([
    { user: "Priya Singh", action: "Started workout just now", time: "just now" },
    { user: "Amit Kumar", action: "Completed 7 day streak!", time: "2 min ago" },
    { user: "Neha Gupta", action: "5 day streak ongoing!", time: "5 min ago" },
  ]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const workoutPlans = {
    "Push Day": [
      { name: "Push Ups", sets: 4, reps: 15 },
      { name: "Bench Press", sets: 3, reps: 10 },
      { name: "Shoulder Press", sets: 3, reps: 12 },
      { name: "Tricep Dips", sets: 3, reps: 12 },
      { name: "Lateral Raises", sets: 3, reps: 15 },
    ],
    "Pull Day": [
      { name: "Pull Ups", sets: 4, reps: 8 },
      { name: "Bent Over Rows", sets: 3, reps: 10 },
      { name: "Lat Pulldown", sets: 3, reps: 12 },
      { name: "Bicep Curls", sets: 3, reps: 15 },
      { name: "Face Pulls", sets: 3, reps: 15 },
    ],
    "Leg Day": [
      { name: "Squats", sets: 4, reps: 12 },
      { name: "Romanian Deadlift", sets: 3, reps: 10 },
      { name: "Leg Press", sets: 3, reps: 15 },
      { name: "Lunges", sets: 3, reps: 12 },
      { name: "Calf Raises", sets: 4, reps: 20 },
    ],
    "Cardio Day": [
      { name: "Warm Up Run", sets: 1, reps: 5 },
      { name: "High Knees", sets: 4, reps: 30 },
      { name: "Burpees", sets: 3, reps: 15 },
      { name: "Jump Rope", sets: 4, reps: 50 },
      { name: "Cool Down Walk", sets: 1, reps: 5 },
    ],
    "Full Body": [
      { name: "Deadlifts", sets: 3, reps: 8 },
      { name: "Push Ups", sets: 3, reps: 15 },
      { name: "Pull Ups", sets: 3, reps: 8 },
      { name: "Squats", sets: 3, reps: 12 },
      { name: "Plank", sets: 3, reps: 60 },
    ],
  };

  const workoutIcons = { "Push Day": "💪", "Pull Day": "🏋️", "Leg Day": "🦵", "Cardio Day": "🏃", "Full Body": "🔥" };
  const workoutSubtitles = { "Push Day": "Upper Body", "Pull Day": "Back & Biceps", "Leg Day": "Lower Body", "Cardio Day": "Cardio & HIIT", "Full Body": "Full Body" };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    fetchWorkouts();
    fetchStreak();
    fetchLeaderboard();
    socket.on("friend_working_out", (data) => {
      setLiveActivity(prev => [
        { user: data.user, action: "Started a workout!", time: "just now" },
        ...prev.slice(0, 4)
      ]);
    });
    return () => socket.off("friend_working_out");
  }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/workout/my", { headers: { Authorization: `Bearer ${token}` } });
      setWorkouts(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchStreak = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/streak/my", { headers: { Authorization: `Bearer ${token}` } });
      setStreak(res.data || { currentStreak: 0, bestStreak: 0 });
    } catch (err) { console.log(err); }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/workout/leaderboard", { headers: { Authorization: `Bearer ${token}` } });
      setLeaderboard(res.data);
    } catch (err) { console.log(err); }
  };

  const completedWorkouts = workouts.filter(w => w.completed).length;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayWorkouts = workouts.filter(w => { const d = new Date(w.date); d.setHours(0,0,0,0); return d.getTime() === today.getTime() && w.completed; });
  const todayCalories = todayWorkouts.reduce((acc, w) => acc + (w.calories || 0), 0);
  const thisMonthWorkouts = workouts.filter(w => { const d = new Date(w.date); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() && w.completed; }).length;
  const consistency = workouts.length > 0 ? Math.round((completedWorkouts / workouts.length) * 100) : 0;

  const now = new Date();
  const currentDay = now.getDay();
  const startOfWeek = new Date(now);
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  startOfWeek.setDate(now.getDate() - daysToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekData = days.map((day, index) => {
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + index);
    const isFuture = targetDate > now;
    const workoutCount = workouts.filter(w => { const wd = new Date(w.date); return wd.toDateString() === targetDate.toDateString() && w.completed; }).length;
    return { day, workouts: isFuture ? 0 : workoutCount, isFuture };
  });

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

  const card = (extraStyle = {}) => ({
    background: cardBg,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${cardBorder}`,
    borderRadius: "20px",
    boxShadow: cardShadow,
    position: "relative",
    overflow: "hidden",
    ...extraStyle,
  });

  const metricCards = [
    { icon: "💪", label: "Total Workouts", value: completedWorkouts, sub: `+${thisMonthWorkouts} this month`, color: "#ff6b35" },
    { icon: "🔥", label: "Today's Calories", value: todayCalories.toLocaleString(), sub: "kcal burned today", color: "#ef9f27" },
    { icon: "🏆", label: "Best Streak", value: `${streak.bestStreak}d`, sub: "personal best", color: "#a78bfa" },
    { icon: "📈", label: "Consistency", value: `${consistency}%`, sub: consistency >= 80 ? "Excellent! 🌟" : consistency >= 50 ? "Good! 👍" : "Keep going! 💪", color: "#4ade80" },
  ];

  return (
    <div style={{ padding: "28px 32px", background: bg, minHeight: "100vh" }}>

      {/* Background orb */}
      <div style={{
        position: "fixed", top: "-100px", right: "-100px",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,107,53,0.05) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ maxWidth: "1160px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div className="fade-in-up" style={{ ...card({ padding: "24px 28px" }), display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{
            position: "absolute", top: 0, left: "5%", right: "5%", height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.4), transparent)",
          }} />
          <div>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: textColor }}>
              {getGreeting()}, <span style={{ color: "#ff6b35" }}>{user?.name}</span>! 👋
            </h2>
            <p style={{ margin: "4px 0 0", color: mutedColor, fontSize: "14px" }}>
              Let's crush your fitness goals today!
            </p>
          </div>
          <div style={{
            background: isDark ? "rgba(255,107,53,0.12)" : "rgba(216,90,48,0.08)",
            border: "1px solid rgba(255,107,53,0.25)",
            borderRadius: "16px", padding: "14px 22px", textAlign: "center",
            animation: "pulseGlow 3s ease-in-out infinite",
          }}>
            <p style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#ff6b35", textShadow: "0 0 20px rgba(255,107,53,0.5)" }}>
              🔥 {streak.currentStreak} days
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: mutedColor }}>
              Best: {streak.bestStreak} days
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="fade-in-up-d1" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
          {metricCards.map((mc, i) => (
            <div key={i} className="card-hover" style={{ ...card({ padding: "22px", textAlign: "center" }) }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                background: `linear-gradient(90deg, transparent, ${mc.color}, transparent)`,
                opacity: 0.7,
              }} />
              <div style={{
                width: "52px", height: "52px", borderRadius: "14px",
                background: `${mc.color}18`,
                border: `1px solid ${mc.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "24px", margin: "0 auto 12px",
              }}>
                {mc.icon}
              </div>
              <p style={{ margin: "0 0 4px", color: mutedColor, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>
                {mc.label}
              </p>
              <p style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: "700", color: mc.color }}>
                {mc.value}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: mutedColor }}>{mc.sub}</p>
            </div>
          ))}
        </div>

        {/* Middle row */}
        <div className="fade-in-up-d2" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", marginBottom: "20px" }}>

          {/* Today's Workout */}
          <div style={{ ...card({ padding: "24px" }) }}>
            <div style={{
              position: "absolute", top: 0, left: "5%", right: "5%", height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.5), transparent)",
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{ fontSize: "18px" }}>🔥</span>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: textColor }}>Today's Workout</h3>
            </div>

            {/* Workout selector chips */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "18px", flexWrap: "wrap" }}>
              {Object.keys(workoutPlans).map((type) => (
                <button key={type} onClick={() => setSelectedWorkout(type)} style={{
                  padding: "7px 14px",
                  background: selectedWorkout === type
                    ? "linear-gradient(135deg, #ff6b35, #D85A30)"
                    : subBg,
                  color: selectedWorkout === type ? "white" : mutedColor,
                  border: `1.5px solid ${selectedWorkout === type ? "rgba(255,107,53,0.5)" : dividerColor}`,
                  borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: "600",
                  transition: "all 0.2s cubic-bezier(0.34,1.3,0.64,1)",
                  boxShadow: selectedWorkout === type ? "0 4px 15px rgba(255,107,53,0.35)" : "none",
                  transform: selectedWorkout === type ? "scale(1.05)" : "scale(1)",
                }}>
                  {workoutIcons[type]} {type}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: "14px" }}>
              <p style={{ margin: "0 0 4px", fontWeight: "600", color: textColor, fontSize: "15px" }}>
                {workoutIcons[selectedWorkout]} {selectedWorkout} — <span style={{ color: mutedColor, fontWeight: "400", fontSize: "13px" }}>{workoutSubtitles[selectedWorkout]}</span>
              </p>
              <p style={{ margin: 0, color: mutedColor, fontSize: "12px" }}>
                {workoutPlans[selectedWorkout].length} exercises · ~45 minutes
              </p>
            </div>

            {workoutPlans[selectedWorkout].map((ex, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 0",
                borderBottom: i < workoutPlans[selectedWorkout].length - 1 ? `1px solid ${dividerColor}` : "none",
              }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "8px",
                  border: `1.5px solid ${dividerColor}`,
                  background: subBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", color: mutedColor, fontWeight: "600",
                }}>{i + 1}</div>
                <span style={{ fontSize: "14px", color: textColor, flex: 1 }}>{ex.name}</span>
                <span style={{
                  fontSize: "12px", color: "#ff6b35", fontWeight: "600",
                  background: "rgba(255,107,53,0.1)", padding: "3px 10px", borderRadius: "20px",
                  border: "1px solid rgba(255,107,53,0.2)",
                }}>
                  {ex.sets}×{ex.reps}
                </span>
              </div>
            ))}

            <button onClick={() => { localStorage.setItem("selectedWorkout", selectedWorkout); navigate("/workout"); }}
              className="btn-glow" style={{
                width: "100%", marginTop: "18px", padding: "15px",
                fontSize: "15px", fontWeight: "700", borderRadius: "14px",
              }}>
              ▶ Start {selectedWorkout}
            </button>
          </div>

          {/* Live Activity */}
          <div style={{ ...card({ padding: "24px" }) }}>
            <div style={{
              position: "absolute", top: 0, left: "5%", right: "5%", height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.4), transparent)",
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%", background: "#ff6b35",
                boxShadow: "0 0 0 3px rgba(255,107,53,0.25)",
                animation: "livePulse 1.5s ease-in-out infinite",
              }} />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: textColor }}>Live Activity Feed</h3>
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "#ff6b35", fontWeight: "600", background: "rgba(255,107,53,0.1)", padding: "3px 8px", borderRadius: "20px" }}>LIVE</span>
            </div>
            {liveActivity.map((a, i) => (
              <div key={i} style={{
                display: "flex", gap: "12px", alignItems: "flex-start",
                padding: "12px 0",
                borderBottom: i < liveActivity.length - 1 ? `1px solid ${dividerColor}` : "none",
                animation: i === 0 ? "fadeInSlide 0.4s ease" : "none",
              }}>
                <div style={{
                  width: "38px", height: "38px", borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,107,53,0.1))",
                  border: "1px solid rgba(255,107,53,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: "700", color: "#ff6b35", flexShrink: 0,
                }}>
                  {a.user.charAt(0)}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "13px", color: textColor }}>{a.user}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: mutedColor }}>💪 {a.action}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.2)" : "#bbb" }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="fade-in-up-d3" style={{ ...card({ padding: "24px", marginBottom: "20px" }) }}>
          <div style={{
            position: "absolute", top: 0, left: "3%", right: "3%", height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.4), transparent)",
          }} />
          <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "600", color: textColor }}>
            📊 Weekly Consistency
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false}
                tick={{ fill: mutedColor, fontSize: 12, fontWeight: 500 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: isDark ? "rgba(20,20,40,0.95)" : "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(255,107,53,0.3)",
                  borderRadius: "10px", color: textColor,
                  backdropFilter: "blur(10px)",
                }}
              />
              <Bar dataKey="workouts" radius={[8, 8, 0, 0]}>
                {weekData.map((entry, i) => (
                  <Cell key={i} fill={entry.workouts > 0
                    ? "url(#barGradient)"
                    : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"
                  } />
                ))}
              </Bar>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6b35" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#D85A30" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: "8px" }}>
            {weekData.map((d, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <span style={{ fontSize: "14px" }}>{d.workouts > 0 ? "✅" : "⬜"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="fade-in-up-d4" style={{ ...card({ padding: "24px" }) }}>
          <div style={{
            position: "absolute", top: 0, left: "3%", right: "3%", height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.4), transparent)",
          }} />
          <h3 style={{ margin: "0 0 18px", fontSize: "16px", fontWeight: "600", color: textColor }}>
            🏆 Leaderboard — This Week
          </h3>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ fontSize: "40px", margin: "0 0 8px" }}>🏆</p>
              <p style={{ color: mutedColor }}>Complete a workout to appear on leaderboard!</p>
            </div>
          ) : (
            leaderboard.map((u, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "16px",
                padding: "12px 16px", marginBottom: "6px",
                borderRadius: "14px",
                background: u.name === user?.name
                  ? isDark ? "rgba(255,107,53,0.1)" : "rgba(216,90,48,0.07)"
                  : "transparent",
                border: u.name === user?.name ? "1px solid rgba(255,107,53,0.2)" : "1px solid transparent",
                transition: "all 0.2s ease",
              }}>
                <span style={{ fontSize: "22px", width: "32px", textAlign: "center", filter: i < 3 ? "drop-shadow(0 0 6px gold)" : "none" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <div style={{
                  width: "38px", height: "38px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #ff6b35, #D85A30)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: "700", color: "white",
                  boxShadow: "0 4px 12px rgba(255,107,53,0.3)",
                }}>
                  {u.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: "600", color: textColor }}>
                    {u.name} {u.name === user?.name ? <span style={{ color: "#ff6b35", fontSize: "12px" }}>(You)</span> : ""}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: mutedColor }}>
                    🔥 {u.streak} day streak
                  </p>
                </div>
                <div style={{ display: "flex", gap: "2px" }}>
                  {Array.from({ length: Math.min(u.streak, 5) }).map((_, j) => (
                    <span key={j} style={{ fontSize: "14px", filter: "drop-shadow(0 0 4px orange)" }}>🔥</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(255,107,53,0.2); }
          50% { box-shadow: 0 0 35px rgba(255,107,53,0.5); }
        }
        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(255,107,53,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(255,107,53,0.1); }
        }
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.6s ease both; }
        .fade-in-up-d1 { animation: fadeInUp 0.6s 0.1s ease both; }
        .fade-in-up-d2 { animation: fadeInUp 0.6s 0.2s ease both; }
        .fade-in-up-d3 { animation: fadeInUp 0.6s 0.3s ease both; }
        .fade-in-up-d4 { animation: fadeInUp 0.6s 0.4s ease both; }
        .card-hover { transition: transform 0.3s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-8px) scale(1.02) perspective(800px) rotateX(3deg); box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,107,53,0.2); }
        .btn-glow { position: relative; overflow: hidden; background: linear-gradient(135deg, #ff6b35, #D85A30); border: none; color: white; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.34,1.3,0.64,1); box-shadow: 0 4px 20px rgba(255,107,53,0.4); }
        .btn-glow::before { content: ''; position: absolute; top: -50%; left: -60%; width: 50%; height: 200%; background: rgba(255,255,255,0.2); transform: skewX(-20deg); transition: left 0.5s ease; }
        .btn-glow:hover::before { left: 130%; }
        .btn-glow:hover { transform: translateY(-4px) scale(1.04); box-shadow: 0 10px 40px rgba(255,107,53,0.6); }
        .btn-glow:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}

export default Dashboard;
