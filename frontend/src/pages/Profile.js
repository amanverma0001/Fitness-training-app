import { useState, useEffect } from "react";
import axios from "axios";

function Profile({ darkMode }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [workouts, setWorkouts] = useState([]);
  const [streak, setStreak] = useState({ currentStreak: 0, bestStreak: 0 });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(localStorage.getItem("userBio") || "Fitness enthusiast 💪");
  const [goal, setGoal] = useState(localStorage.getItem("userGoal") || "Build muscle");
  const [weight, setWeight] = useState(user?.weight || 70);
  const [age, setAge] = useState(user?.age || 25);
  const [saved, setSaved] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifTime, setNotifTime] = useState("09:00");
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [notifSaved, setNotifSaved] = useState(false);
  const token = localStorage.getItem("token");

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

  const inputStyle = {
    padding: "12px 16px",
    border: `1.5px solid ${dividerColor}`,
    borderRadius: "12px",
    fontSize: "14px",
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
    color: textColor,
    outline: "none",
    fontFamily: "Inter, sans-serif",
    transition: "all 0.2s ease",
  };

  useEffect(() => { fetchWorkouts(); fetchStreak(); fetchReminderSettings(); }, []);

  const fetchReminderSettings = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/reminder/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifEnabled(!!res.data?.enabled);
      if (res.data?.time) setNotifTime(res.data.time);
    } catch (err) { console.log(err); }
  };

  const requestNotifPermission = async () => {
    if (!("Notification" in window)) {
      alert("Browser notifications support nahi karta.");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    return perm;
  };

  const saveReminderSettings = async (enabled, time) => {
    try {
      await axios.put(
        "http://localhost:5001/api/reminder/settings",
        { enabled, time },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2000);
    } catch (err) { console.log(err); }
  };

  const toggleNotifications = async () => {
    const next = !notifEnabled;
    if (next && notifPermission !== "granted") {
      const perm = await requestNotifPermission();
      if (perm !== "granted") return;
    }
    setNotifEnabled(next);
    saveReminderSettings(next, notifTime);
  };

  const handleTimeChange = (newTime) => {
    setNotifTime(newTime);
    if (notifEnabled) saveReminderSettings(notifEnabled, newTime);
  };

  const sendTestNotification = async () => {
    if (notifPermission !== "granted") {
      const perm = await requestNotifPermission();
      if (perm !== "granted") return;
    }
    const payload = {
      title: "🔥 Test Notification — Ignite",
      body: "Notifications kaam kar rahi hain! Let's crush today's workout 💪",
      action: "/workout",
      tag: "test-" + Date.now(),
    };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification(payload.title, {
        body: payload.body,
        icon: "/logo192.png",
        badge: "/logo192.png",
        tag: payload.tag,
        data: { action: payload.action },
        vibrate: [200, 100, 200],
      });
    } else {
      new Notification(payload.title, { body: payload.body, icon: "/logo192.png" });
    }
  };

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

  const saveProfile = async () => {
    const w = Number(weight) || 70;
    const a = Number(age) || 25;
    try {
      const res = await axios.put("http://localhost:5001/api/auth/update-profile",
        { name, bio, goal, weight: w, age: a },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = {
        ...user,
        name,
        weight: res.data.weight,
        age: res.data.age
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("userBio", bio);
      localStorage.setItem("userGoal", goal);
      setUser(updatedUser);
      setWeight(res.data.weight);
      setAge(res.data.age);
    } catch (err) {
      console.log("Profile update error:", err);
      // Save to localStorage at least even if API fails
      const updatedUser = { ...user, name, weight: w, age: a };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("userBio", bio);
      localStorage.setItem("userGoal", goal);
      setUser(updatedUser);
      setWeight(w);
      setAge(a);
    }
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const completedWorkouts = workouts.filter(w => w.completed).length;
  const totalMinutes = workouts.reduce((acc, w) => acc + (w.duration || 0), 0);
  const workoutTypes = workouts.reduce((acc, w) => { acc[w.name] = (acc[w.name] || 0) + 1; return acc; }, {});
  const favoriteWorkout = Object.keys(workoutTypes).length > 0
    ? Object.keys(workoutTypes).reduce((a, b) => workoutTypes[a] > workoutTypes[b] ? a : b)
    : "None yet";

  const goals = ["Build muscle", "Lose weight", "Stay fit", "Improve endurance", "Build strength"];
  const wIcons = { "Push Day": "💪", "Pull Day": "🏋️", "Leg Day": "🦵", "Cardio Day": "🏃", "Full Body": "🔥" };

  const achievements = [
    { icon: "🔥", title: "First Workout", desc: "Completed your first workout!", unlocked: completedWorkouts >= 1, color: "#ff6b35" },
    { icon: "💪", title: "5 Workouts", desc: "Completed 5 workouts!", unlocked: completedWorkouts >= 5, color: "#EF9F27" },
    { icon: "🏆", title: "10 Workouts", desc: "Completed 10 workouts!", unlocked: completedWorkouts >= 10, color: "#fbbf24" },
    { icon: "⚡", title: "3 Day Streak", desc: "3 days in a row!", unlocked: streak.bestStreak >= 3, color: "#a78bfa" },
    { icon: "🌟", title: "7 Day Streak", desc: "7 days in a row!", unlocked: streak.bestStreak >= 7, color: "#60a5fa" },
    { icon: "👑", title: "30 Day Streak", desc: "30 days in a row!", unlocked: streak.bestStreak >= 30, color: "#4ade80" },
  ];

  const statCards = [
    { icon: "💪", label: "Total Workouts", value: completedWorkouts, color: "#ff6b35" },
    { icon: "🔥", label: "Best Streak", value: `${streak.bestStreak}d`, color: "#EF9F27" },
    { icon: "⏱️", label: "Total Minutes", value: `${totalMinutes}m`, color: "#a78bfa" },
    { icon: "🏋️", label: "Fav Workout", value: favoriteWorkout.replace(" Day", "").replace(" Body", " B."), color: "#60a5fa" },
  ];

  return (
    <div style={{ padding: "28px 32px", background: bg, minHeight: "100vh" }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse at 70% 30%, rgba(167,139,250,0.04) 0%, transparent 50%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px", position: "relative", zIndex: 1 }}>

        {/* Profile Header */}
        <div className="fade-in-up" style={{ ...card({ padding: "32px" }) }}>
          <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.5), transparent)" }} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: "28px" }}>

            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: "96px", height: "96px", borderRadius: "24px",
                background: "linear-gradient(135deg, #ff6b35, #D85A30)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "40px", fontWeight: "700", color: "white", flexShrink: 0,
                boxShadow: "0 10px 35px rgba(255,107,53,0.5), 0 0 0 3px rgba(255,107,53,0.2)",
                animation: "avatarFloat 5s ease-in-out infinite",
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{
                position: "absolute", bottom: "-4px", right: "-4px",
                width: "28px", height: "28px", borderRadius: "50%",
                background: "linear-gradient(135deg, #4ade80, #22c55e)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", border: `2px solid ${isDark ? "#07071a" : "#f0f2ff"}`,
              }}>🔥</div>
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, fontSize: "16px" }} placeholder="Your name" />
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2}
                    style={{ ...inputStyle, resize: "none" }} placeholder="Your bio..." />
                  <select value={goal} onChange={e => setGoal(e.target.value)} style={inputStyle}>
                    {goals.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: mutedColor, fontWeight: "600", display: "block", marginBottom: "6px" }}>⚖️ Weight (kg)</label>
                      <input type="number" value={weight} min="30" max="200"
                        onChange={e => setWeight(e.target.value)}
                        style={{ ...inputStyle, width: "100%" }} placeholder="70" />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: mutedColor, fontWeight: "600", display: "block", marginBottom: "6px" }}>🎂 Age (years)</label>
                      <input type="number" value={age} min="10" max="100"
                        onChange={e => setAge(e.target.value)}
                        style={{ ...inputStyle, width: "100%" }} placeholder="25" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={saveProfile} className="btn-glow" style={{ padding: "11px 26px", borderRadius: "11px", fontSize: "14px", fontWeight: "700" }}>
                      Save Changes ✓
                    </button>
                    <button onClick={() => setEditing(false)} style={{
                      padding: "11px 22px", background: "transparent", color: mutedColor,
                      border: `1.5px solid ${dividerColor}`, borderRadius: "11px", cursor: "pointer", fontSize: "13px",
                    }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                    <h2 style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: textColor }}>{user?.name}</h2>
                    {saved && (
                      <span style={{
                        fontSize: "12px", color: "#4ade80", background: "rgba(74,222,128,0.12)",
                        border: "1px solid rgba(74,222,128,0.3)",
                        padding: "4px 12px", borderRadius: "20px", fontWeight: "600",
                        animation: "fadeIn 0.3s ease",
                      }}>✓ Saved!</span>
                    )}
                  </div>
                  <p style={{ margin: "0 0 6px", color: mutedColor, fontSize: "13px" }}>{user?.email}</p>
                  <p style={{ margin: "0 0 14px", color: isDark ? "rgba(255,255,255,0.7)" : "#444", fontSize: "14px" }}>{bio}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
                    <span style={{
                      background: isDark ? "rgba(255,107,53,0.12)" : "rgba(216,90,48,0.08)",
                      border: "1px solid rgba(255,107,53,0.25)",
                      color: "#ff6b35", padding: "5px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600",
                    }}>🎯 {goal}</span>
                    <span style={{
                      background: "rgba(74,222,128,0.12)",
                      border: "1px solid rgba(74,222,128,0.25)",
                      color: "#4ade80", padding: "5px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600",
                    }}>🔥 {streak.currentStreak} day streak</span>
                    <span style={{
                      background: "rgba(96,165,250,0.12)",
                      border: "1px solid rgba(96,165,250,0.25)",
                      color: "#60a5fa", padding: "5px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600",
                    }}>⚖️ {user?.weight || 70} kg</span>
                    <span style={{
                      background: "rgba(167,139,250,0.12)",
                      border: "1px solid rgba(167,139,250,0.25)",
                      color: "#a78bfa", padding: "5px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600",
                    }}>🎂 {user?.age || 25} yrs</span>
                  </div>
                  <button onClick={() => setEditing(true)} style={{
                    padding: "9px 22px", background: "transparent",
                    color: "#ff6b35", border: "1.5px solid rgba(255,107,53,0.35)",
                    borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600",
                    transition: "all 0.2s ease",
                  }}
                    onMouseEnter={e => { e.target.style.background = "rgba(255,107,53,0.1)"; }}
                    onMouseLeave={e => { e.target.style.background = "transparent"; }}
                  >✏️ Edit Profile</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="fade-in-up-d1" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {statCards.map((s, i) => (
            <div key={i} className="card-hover" style={{ ...card({ padding: "20px", textAlign: "center" }) }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`, opacity: 0.7 }} />
              <div style={{
                width: "52px", height: "52px", borderRadius: "14px",
                background: `${s.color}18`, border: `1px solid ${s.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "24px", margin: "0 auto 12px",
              }}>{s.icon}</div>
              <p style={{ margin: "0 0 4px", color: mutedColor, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "600" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: s.color, textShadow: `0 0 15px ${s.color}60` }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="fade-in-up-d2" style={{ ...card({ padding: "26px" }) }}>
          <div style={{ position: "absolute", top: 0, left: "3%", right: "3%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent)" }} />
          <h3 style={{ margin: "0 0 22px", fontSize: "16px", fontWeight: "700", color: textColor }}>🏆 Achievements</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {achievements.map((a, i) => (
              <div key={i} className="card-hover" style={{
                padding: "20px 16px",
                borderRadius: "16px",
                border: `1.5px solid ${a.unlocked ? a.color + "40" : dividerColor}`,
                background: a.unlocked
                  ? isDark ? `${a.color}10` : `${a.color}08`
                  : subBg,
                opacity: a.unlocked ? 1 : 0.45,
                textAlign: "center",
                transition: "all 0.3s ease",
                animation: a.unlocked ? `achievBorderPulse_${i} 3s ease-in-out infinite` : "none",
              }}>
                <div style={{
                  fontSize: "36px", margin: "0 0 10px",
                  filter: a.unlocked ? `drop-shadow(0 0 10px ${a.color}80)` : "grayscale(1)",
                  animation: a.unlocked ? "iconBounce 3s ease-in-out infinite" : "none",
                }}>
                  {a.icon}
                </div>
                <p style={{ margin: "0 0 4px", fontWeight: "700", color: a.unlocked ? a.color : mutedColor, fontSize: "13px" }}>{a.title}</p>
                <p style={{ margin: 0, color: mutedColor, fontSize: "11px" }}>{a.desc}</p>
                {a.unlocked && (
                  <p style={{ margin: "7px 0 0", fontSize: "11px", color: "#4ade80", fontWeight: "700", background: "rgba(74,222,128,0.1)", padding: "3px 10px", borderRadius: "20px", display: "inline-block" }}>
                    ✓ Unlocked!
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="fade-in-up-d2" style={{ ...card({ padding: "26px" }) }}>
          <div style={{ position: "absolute", top: 0, left: "3%", right: "3%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.5), transparent)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: textColor }}>🔔 Push Notifications</h3>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: mutedColor }}>
                Daily workout reminder + streak warning (48h window)
              </p>
            </div>
            {notifSaved && (
              <span style={{
                fontSize: "12px", color: "#4ade80", background: "rgba(74,222,128,0.12)",
                border: "1px solid rgba(74,222,128,0.3)",
                padding: "4px 12px", borderRadius: "20px", fontWeight: "600",
              }}>✓ Saved!</span>
            )}
          </div>

          {/* Permission banner */}
          {notifPermission !== "granted" && (
            <div style={{
              padding: "14px 16px", borderRadius: "12px", marginBottom: "16px",
              background: notifPermission === "denied" ? "rgba(239,68,68,0.08)" : "rgba(251,191,36,0.08)",
              border: `1px solid ${notifPermission === "denied" ? "rgba(239,68,68,0.25)" : "rgba(251,191,36,0.25)"}`,
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap",
            }}>
              <p style={{ margin: 0, fontSize: "13px", color: notifPermission === "denied" ? "#ef4444" : "#fbbf24" }}>
                {notifPermission === "denied"
                  ? "⚠️ Notifications block ho rahi hain — browser settings mein allow karo"
                  : "Notifications ke liye permission chahiye"}
              </p>
              {notifPermission !== "denied" && (
                <button onClick={requestNotifPermission} style={{
                  padding: "7px 16px", background: "rgba(251,191,36,0.15)",
                  color: "#fbbf24", border: "1px solid rgba(251,191,36,0.4)",
                  borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600",
                }}>Allow</button>
              )}
            </div>
          )}

          {/* Toggle row */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px", borderRadius: "12px", background: subBg, marginBottom: "12px",
          }}>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: textColor }}>Enable reminders</p>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: mutedColor }}>
                {notifEnabled ? "Active — tumhe daily notify karenge" : "Currently off"}
              </p>
            </div>
            <div onClick={toggleNotifications} style={{
              width: "48px", height: "26px", borderRadius: "20px",
              background: notifEnabled ? "linear-gradient(135deg, #ff6b35, #D85A30)" : dividerColor,
              position: "relative", cursor: "pointer", transition: "background 0.25s ease",
              boxShadow: notifEnabled ? "0 0 14px rgba(255,107,53,0.4)" : "none",
            }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%", background: "#fff",
                position: "absolute", top: "3px", left: notifEnabled ? "25px" : "3px",
                transition: "left 0.25s ease", boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              }} />
            </div>
          </div>

          {/* Time picker */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px", borderRadius: "12px", background: subBg, marginBottom: "12px",
            opacity: notifEnabled ? 1 : 0.5,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: textColor }}>Reminder time</p>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: mutedColor }}>Daily workout nudge at this time</p>
            </div>
            <input
              type="time"
              value={notifTime}
              disabled={!notifEnabled}
              onChange={(e) => handleTimeChange(e.target.value)}
              style={{
                ...inputStyle, width: "110px", padding: "8px 12px", fontSize: "13px",
                cursor: notifEnabled ? "pointer" : "not-allowed",
              }}
            />
          </div>

          <button onClick={sendTestNotification} style={{
            padding: "10px 20px", background: "transparent",
            color: "#60a5fa", border: "1.5px solid rgba(96,165,250,0.35)",
            borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600",
            transition: "all 0.2s ease",
          }}
            onMouseEnter={e => { e.target.style.background = "rgba(96,165,250,0.1)"; }}
            onMouseLeave={e => { e.target.style.background = "transparent"; }}
          >🧪 Send Test Notification</button>
        </div>

        {/* Recent Workouts */}
        <div className="fade-in-up-d3" style={{ ...card({ padding: "24px" }) }}>
          <div style={{ position: "absolute", top: 0, left: "3%", right: "3%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.4), transparent)" }} />
          <h3 style={{ margin: "0 0 18px", fontSize: "16px", fontWeight: "700", color: textColor }}>📋 Recent Workouts</h3>
          {workouts.length === 0 ? (
            <p style={{ color: mutedColor, textAlign: "center", padding: "24px 0" }}>No workouts yet — start your first one!</p>
          ) : (
            workouts.slice(0, 5).map((w, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "13px 0",
                borderBottom: i < Math.min(workouts.length, 5) - 1 ? `1px solid ${dividerColor}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: isDark ? "rgba(255,107,53,0.12)" : "rgba(216,90,48,0.08)",
                    border: "1px solid rgba(255,107,53,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
                  }}>
                    {wIcons[w.name] || "🔥"}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: "600", color: textColor, fontSize: "14px" }}>{w.name}</p>
                    <p style={{ margin: "3px 0 0", color: mutedColor, fontSize: "12px" }}>
                      {new Date(w.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#ff6b35", fontWeight: "700" }}>{w.duration || 0} min</p>
                  <p style={{ margin: "3px 0 0", fontSize: "11px", color: w.completed ? "#4ade80" : mutedColor, fontWeight: "600" }}>
                    {w.completed ? "✅ Done" : "⏳ Pending"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes avatarFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes iconBounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }
        .fade-in-up { animation: fadeInUp 0.5s ease both; }
        .fade-in-up-d1 { animation: fadeInUp 0.5s 0.1s ease both; }
        .fade-in-up-d2 { animation: fadeInUp 0.5s 0.2s ease both; }
        .fade-in-up-d3 { animation: fadeInUp 0.5s 0.3s ease both; }
        .card-hover { transition: transform 0.3s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-8px) scale(1.02) perspective(800px) rotateX(3deg); box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,107,53,0.2); }
        .btn-glow { position: relative; overflow: hidden; background: linear-gradient(135deg, #ff6b35, #D85A30); border: none; color: white; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.34,1.3,0.64,1); box-shadow: 0 4px 20px rgba(255,107,53,0.4); }
        .btn-glow::before { content: ''; position: absolute; top: -50%; left: -60%; width: 50%; height: 200%; background: rgba(255,255,255,0.2); transform: skewX(-20deg); transition: left 0.5s; }
        .btn-glow:hover::before { left: 130%; }
        .btn-glow:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(255,107,53,0.6); }
      `}</style>
    </div>
  );
}

export default Profile;
