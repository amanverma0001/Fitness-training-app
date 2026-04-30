import { useState, useEffect } from "react";
import axios from "axios";

function Nutrition({ darkMode }) {
  const [nutrition, setNutrition] = useState(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [mealType, setMealType] = useState("Lunch");
  const [water, setWater] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(null);
  const token = localStorage.getItem("token");

  const emptyItem = { name: "", quantity: 1, unit: "katori", calories: 0, protein: 0, carbs: 0, fats: 0 };
  const [foodItems, setFoodItems] = useState([{ ...emptyItem }]);

  const isDark = darkMode !== false;
  const bg = isDark ? "#030309" : "#f0f2ff";
  const cardBg = isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.85)";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)";
  const textColor = isDark ? "#fff" : "#1a1a2e";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "#777";
  const dividerColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const subBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)";
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

  const GOALS = { calories: 2000, protein: 150, carbs: 250, fats: 65, water: 8 };
  const mealIcons = { Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙", Snack: "🍎" };

  const quickFoods = [
    { name: "Dal", unit: "katori", qty: 1 },
    { name: "Roti", unit: "roti", qty: 2 },
    { name: "Chaas", unit: "glass", qty: 1 },
    { name: "Rice", unit: "katori", qty: 1 },
    { name: "Sabzi", unit: "katori", qty: 1 },
    { name: "Salad", unit: "bowl", qty: 1 },
    { name: "Egg", unit: "piece", qty: 2 },
    { name: "Milk", unit: "glass", qty: 1 },
    { name: "Paneer", unit: "g", qty: 100 },
    { name: "Dahi", unit: "katori", qty: 1 },
  ];

  useEffect(() => { fetchToday(); }, []);

  const fetchToday = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/nutrition/today", { headers: { Authorization: `Bearer ${token}` } });
      setNutrition(res.data);
      setWater(res.data.waterIntake || 0);
    } catch (err) { console.log(err); }
  };

  const fetchNutritionForItem = async (index, foodName, quantity, unit) => {
    if (!foodName.trim()) return;
    setLoadingIndex(index);
    try {
      const res = await axios.post("http://localhost:5001/api/chat", {
        messages: [{ role: "user", content: `Calculate nutrition for "${foodName}" — ${quantity} ${unit} (Indian homemade style).\nStandard references:\n- Dal = cooked lentil curry, 1 katori = 150g ≈ 120 kcal\n- Roti = whole wheat chapati, 1 piece = 40g ≈ 80 kcal  \n- Chaas = buttermilk, 1 glass = 250ml ≈ 40 kcal\n- Rice = cooked, 1 katori = 150g ≈ 180 kcal\n- Sabzi = cooked curry, 1 katori = 150g ≈ 100 kcal\n- Salad = raw veggies, 1 bowl = 100g ≈ 30 kcal\n- Egg = boiled, 1 piece = 50g ≈ 70 kcal\n- Dahi = curd, 1 katori = 150g ≈ 90 kcal\n\nReply ONLY in JSON:\n{"calories": 0, "protein": 0, "carbs": 0, "fats": 0}` }]
      }, { headers: { Authorization: `Bearer ${token}` } });
      const text = res.data.reply;
      const json = JSON.parse(text.match(/\{.*\}/s)[0]);
      setFoodItems(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], calories: Math.round(json.calories), protein: Math.round(json.protein), carbs: Math.round(json.carbs), fats: Math.round(json.fats) };
        return updated;
      });
    } catch (err) { console.log(err); }
    setLoadingIndex(null);
  };

  const addFoodRow = () => setFoodItems(prev => [...prev, { ...emptyItem }]);
  const removeFoodRow = (index) => setFoodItems(prev => prev.filter((_, i) => i !== index));
  const updateFoodItem = (index, field, value) => setFoodItems(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });
  const quickAddFood = (index, food) => {
    setFoodItems(prev => { const u = [...prev]; u[index] = { ...u[index], name: food.name, quantity: food.qty, unit: food.unit }; return u; });
    setTimeout(() => fetchNutritionForItem(index, food.name, food.qty, food.unit), 100);
  };

  const totalMacros = foodItems.reduce((acc, item) => ({
    calories: acc.calories + (item.calories || 0),
    protein: acc.protein + (item.protein || 0),
    carbs: acc.carbs + (item.carbs || 0),
    fats: acc.fats + (item.fats || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const saveMeal = async () => {
    const valid = foodItems.filter(i => i.name && i.calories > 0);
    if (valid.length === 0) return;
    setSaving(true);
    try {
      for (const item of valid) {
        await axios.post("http://localhost:5001/api/nutrition/add-meal",
          { name: `${item.name} (${item.quantity} ${item.unit})`, calories: item.calories, protein: item.protein, carbs: item.carbs, fats: item.fats, time: mealType },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await fetchToday();
      setFoodItems([{ ...emptyItem }]);
      setShowAddMeal(false);
    } catch (err) { console.log(err); }
    setSaving(false);
  };

  const updateWater = async (glasses) => {
    setWater(glasses);
    try {
      await axios.put("http://localhost:5001/api/nutrition/water", { glasses }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { console.log(err); }
  };

  const caloriesPct = Math.min(Math.round(((nutrition?.totalCalories || 0) / GOALS.calories) * 100), 100);
  const circumference = 2 * Math.PI * 52;
  const strokeOffset = circumference * (1 - caloriesPct / 100);
  const remaining = GOALS.calories - (nutrition?.totalCalories || 0);

  const macroBar = (label, value, goal, color) => {
    const pct = Math.min(Math.round((value / goal) * 100), 100);
    return (
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
          <span style={{ fontSize: "13px", color: textColor, fontWeight: "600" }}>{label}</span>
          <span style={{ fontSize: "13px", color: mutedColor }}>{value}g / {goal}g <span style={{ color, fontWeight: "700" }}>{pct}%</span></span>
        </div>
        <div style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: "20px", height: "9px", overflow: "hidden" }}>
          <div style={{
            background: `linear-gradient(90deg, ${color}, ${color}99)`,
            borderRadius: "20px", height: "9px", width: `${pct}%`,
            transition: "width 0.6s cubic-bezier(0.34,1.2,0.64,1)",
            boxShadow: `0 0 8px ${color}60`,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
              animation: "shimmer 2s infinite",
            }} />
          </div>
        </div>
      </div>
    );
  };

  const inputStyle = {
    width: "100%", padding: "9px 11px",
    border: `1.5px solid ${dividerColor}`,
    borderRadius: "10px", fontSize: "13px",
    background: inputBg,
    color: textColor, outline: "none", boxSizing: "border-box",
    fontFamily: "Inter, sans-serif",
    transition: "all 0.2s ease",
  };

  return (
    <div style={{ padding: "28px 32px", background: bg, minHeight: "100vh" }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse at 30% 80%, rgba(55,138,221,0.04) 0%, transparent 50%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ maxWidth: "1040px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div className="fade-in-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: textColor }}>
              🥗 <span style={{ background: "linear-gradient(135deg, #ff6b35, #ffb347)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Calorie & Macro Tracker</span>
            </h2>
            <p style={{ margin: "4px 0 0", color: mutedColor }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <button onClick={() => setShowAddMeal(true)} className="btn-glow" style={{ padding: "13px 26px", fontSize: "14px", fontWeight: "700", borderRadius: "14px" }}>
            + Add Meal
          </button>
        </div>

        {/* Calories + Macros */}
        <div className="fade-in-up-d1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

          {/* Calories ring */}
          <div style={{ ...card({ padding: "26px" }) }}>
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.5), transparent)" }} />
            <h3 style={{ margin: "0 0 22px", fontSize: "16px", fontWeight: "600", color: textColor }}>🔥 Calories Today</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
              <div style={{ position: "relative", width: "130px", height: "130px", flexShrink: 0 }}>
                <svg viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)", width: "130px", height: "130px", filter: "drop-shadow(0 0 12px rgba(255,107,53,0.3))" }}>
                  <circle cx="65" cy="65" r="52" fill="none" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth="12" />
                  <circle cx="65" cy="65" r="52" fill="none" stroke="url(#calorieGrad)" strokeWidth="12"
                    strokeDasharray={circumference} strokeDashoffset={strokeOffset}
                    strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34,1.2,0.64,1)" }} />
                  <defs>
                    <linearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ff6b35" />
                      <stop offset="100%" stopColor="#ffb347" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#ff6b35", textShadow: "0 0 15px rgba(255,107,53,0.5)" }}>
                    {nutrition?.totalCalories || 0}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: mutedColor, fontWeight: "600" }}>kcal</p>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 4px", color: mutedColor, fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Daily Goal</p>
                <p style={{ margin: "0 0 18px", fontSize: "24px", fontWeight: "700", color: textColor }}>{GOALS.calories} kcal</p>
                <p style={{ margin: "0 0 4px", color: mutedColor, fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Remaining</p>
                <p style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: remaining < 0 ? "#ef4444" : "#4ade80", textShadow: remaining < 0 ? "0 0 15px rgba(239,68,68,0.4)" : "0 0 15px rgba(74,222,128,0.4)" }}>
                  {remaining < 0 ? `+${Math.abs(remaining)}` : remaining} kcal
                </p>
              </div>
            </div>
          </div>

          {/* Macros */}
          <div style={{ ...card({ padding: "26px" }) }}>
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent)" }} />
            <h3 style={{ margin: "0 0 22px", fontSize: "16px", fontWeight: "600", color: textColor }}>💊 Macronutrients</h3>
            {macroBar("Protein", nutrition?.totalProtein || 0, GOALS.protein, "#378ADD")}
            {macroBar("Carbs", nutrition?.totalCarbs || 0, GOALS.carbs, "#EF9F27")}
            {macroBar("Fats", nutrition?.totalFats || 0, GOALS.fats, "#ef4444")}
          </div>
        </div>

        {/* Water */}
        <div className="fade-in-up-d2" style={{ ...card({ padding: "24px", marginBottom: "20px" }) }}>
          <div style={{ position: "absolute", top: 0, left: "3%", right: "3%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(55,138,221,0.5), transparent)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: textColor }}>💧 Water Intake</h3>
            <span style={{ fontSize: "13px", color: mutedColor, fontWeight: "600" }}>{water} / {GOALS.water} glasses</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {Array.from({ length: GOALS.water }).map((_, i) => (
              <div key={i} onClick={() => updateWater(i < water ? i : i + 1)} style={{
                width: "48px", height: "60px", borderRadius: "12px",
                background: i < water
                  ? "linear-gradient(180deg, #60a5fa, #378ADD)"
                  : subBg,
                border: `1.5px solid ${i < water ? "rgba(55,138,221,0.4)" : dividerColor}`,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
                transition: "all 0.3s cubic-bezier(0.34,1.4,0.64,1)",
                boxShadow: i < water ? "0 4px 15px rgba(55,138,221,0.35)" : "none",
                transform: i < water ? "scale(1.05)" : "scale(1)",
              }}>
                {i < water ? "💧" : "🫙"}
              </div>
            ))}
          </div>
        </div>

        {/* Meals */}
        <div className="fade-in-up-d3" style={{ ...card({ padding: "24px" }) }}>
          <div style={{ position: "absolute", top: 0, left: "3%", right: "3%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.4), transparent)" }} />
          <h3 style={{ margin: "0 0 18px", fontSize: "16px", fontWeight: "600", color: textColor }}>🍽️ Today's Meals</h3>
          {!nutrition?.meals?.length ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontSize: "44px", margin: "0 0 10px" }}>🥗</p>
              <p style={{ color: mutedColor }}>No meals logged yet — click "+ Add Meal" to get started!</p>
            </div>
          ) : (
            nutrition.meals.map((m, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 0",
                borderBottom: i < nutrition.meals.length - 1 ? `1px solid ${dividerColor}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: isDark ? "rgba(255,107,53,0.12)" : "rgba(216,90,48,0.08)",
                    border: "1px solid rgba(255,107,53,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
                  }}>
                    {mealIcons[m.time] || "🍽️"}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: "600", color: textColor, fontSize: "14px" }}>{m.name}</p>
                    <p style={{ margin: "3px 0 0", color: mutedColor, fontSize: "12px" }}>
                      {m.time} · <span style={{ color: "#378ADD" }}>P: {m.protein}g</span> · <span style={{ color: "#EF9F27" }}>C: {m.carbs}g</span> · <span style={{ color: "#ef4444" }}>F: {m.fats}g</span>
                    </p>
                  </div>
                </div>
                <p style={{ margin: 0, fontWeight: "700", color: "#ff6b35", fontSize: "15px", textShadow: "0 0 10px rgba(255,107,53,0.4)" }}>
                  {m.calories} kcal
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Meal Modal */}
      {showAddMeal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          animation: "fadeIn 0.2s ease",
        }}>
          <div style={{
            background: isDark ? "rgba(15,15,35,0.98)" : "rgba(255,255,255,0.98)",
            backdropFilter: "blur(24px)",
            border: `1px solid ${cardBorder}`,
            borderRadius: "24px", padding: "30px",
            width: "580px",
            boxShadow: isDark
              ? "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,107,53,0.1)"
              : "0 40px 80px rgba(0,0,0,0.2)",
            maxHeight: "92vh", overflowY: "auto",
            animation: "modalIn 0.3s cubic-bezier(0.34,1.3,0.64,1)",
          }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: "-20px", left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.6), transparent)" }} />
            </div>

            <h3 style={{ margin: "0 0 18px", color: textColor, fontSize: "18px", fontWeight: "700" }}>🍽️ Add Meal</h3>

            {/* Meal type */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
              {["Breakfast", "Lunch", "Dinner", "Snack"].map(t => (
                <button key={t} onClick={() => setMealType(t)} style={{
                  flex: 1, padding: "10px 4px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  background: mealType === t ? "linear-gradient(135deg, #ff6b35, #D85A30)" : subBg,
                  color: mealType === t ? "white" : mutedColor,
                  border: `1.5px solid ${mealType === t ? "rgba(255,107,53,0.4)" : dividerColor}`,
                  borderRadius: "10px", transition: "all 0.2s cubic-bezier(0.34,1.2,0.64,1)",
                  boxShadow: mealType === t ? "0 4px 12px rgba(255,107,53,0.35)" : "none",
                }}>
                  {mealIcons[t]} {t}
                </button>
              ))}
            </div>

            {/* Quick add chips */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", color: mutedColor, fontWeight: "600" }}>Quick Add:</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {quickFoods.map((f, i) => (
                  <button key={i} onClick={() => {
                    const emptyIdx = foodItems.findIndex(item => !item.name);
                    if (emptyIdx >= 0) { quickAddFood(emptyIdx, f); }
                    else { setFoodItems(prev => [...prev, { ...emptyItem, name: f.name, quantity: f.qty, unit: f.unit }]); setTimeout(() => fetchNutritionForItem(foodItems.length, f.name, f.qty, f.unit), 100); }
                  }} style={{
                    padding: "5px 12px", fontSize: "12px", cursor: "pointer", fontWeight: "500",
                    background: subBg, color: mutedColor,
                    border: `1px solid ${dividerColor}`,
                    borderRadius: "20px", transition: "all 0.2s ease",
                  }}>
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 0.7fr 1fr 0.5fr auto", gap: "6px",
              marginBottom: "8px", padding: "10px 12px",
              background: isDark ? "rgba(255,107,53,0.1)" : "rgba(216,90,48,0.07)",
              borderRadius: "10px", border: `1px solid rgba(255,107,53,0.2)`,
            }}>
              {["FOOD ITEM", "QTY", "UNIT", "KCAL", ""].map((h, i) => (
                <span key={i} style={{ fontSize: "11px", color: "#ff6b35", fontWeight: "700", letterSpacing: "0.5px" }}>{h}</span>
              ))}
            </div>

            {/* Food rows */}
            {foodItems.map((item, index) => (
              <div key={index} style={{
                marginBottom: "8px",
                background: item.calories > 0 ? (isDark ? "rgba(255,107,53,0.06)" : "rgba(255,107,53,0.04)") : "transparent",
                borderRadius: "10px", padding: item.calories > 0 ? "10px" : "4px 0",
                border: item.calories > 0 ? `1.5px solid rgba(255,107,53,0.2)` : "none",
                transition: "all 0.3s ease",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 0.7fr 1fr 0.5fr auto", gap: "6px", alignItems: "center" }}>
                  <input placeholder="e.g. Dal, Roti" value={item.name}
                    onChange={e => updateFoodItem(index, "name", e.target.value)}
                    onBlur={e => { if (e.target.value) fetchNutritionForItem(index, e.target.value, item.quantity, item.unit); }}
                    style={inputStyle} />
                  <input type="number" value={item.quantity} min="0.5" step="0.5"
                    onChange={e => updateFoodItem(index, "quantity", Number(e.target.value))}
                    onBlur={() => { if (item.name) fetchNutritionForItem(index, item.name, item.quantity, item.unit); }}
                    style={inputStyle} />
                  <select value={item.unit}
                    onChange={e => { updateFoodItem(index, "unit", e.target.value); if (item.name) setTimeout(() => fetchNutritionForItem(index, item.name, item.quantity, e.target.value), 100); }}
                    style={inputStyle}>
                    {["katori", "roti", "piece", "glass", "bowl", "plate", "g", "ml", "cup", "tbsp"].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <div style={{ textAlign: "center" }}>
                    {loadingIndex === index ? (
                      <span style={{ fontSize: "14px", color: "#ff6b35" }}>⏳</span>
                    ) : (
                      <span style={{ fontSize: "13px", fontWeight: "700", color: item.calories > 0 ? "#ff6b35" : mutedColor }}>
                        {item.calories > 0 ? item.calories : "—"}
                      </span>
                    )}
                  </div>
                  <button onClick={() => removeFoodRow(index)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px", padding: "0 4px", transition: "transform 0.2s" }}
                    onMouseEnter={e => e.target.style.transform = "scale(1.2)"}
                    onMouseLeave={e => e.target.style.transform = "scale(1)"}>✕</button>
                </div>
                {item.calories > 0 && (
                  <div style={{ display: "flex", gap: "12px", marginTop: "7px", paddingLeft: "4px" }}>
                    <span style={{ fontSize: "11px", color: "#378ADD", fontWeight: "600" }}>P: {item.protein}g</span>
                    <span style={{ fontSize: "11px", color: "#EF9F27", fontWeight: "600" }}>C: {item.carbs}g</span>
                    <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600" }}>F: {item.fats}g</span>
                  </div>
                )}
              </div>
            ))}

            <button onClick={addFoodRow} style={{
              width: "100%", padding: "9px", background: "transparent", color: "#ff6b35",
              border: `1.5px dashed rgba(255,107,53,0.4)`, borderRadius: "10px",
              cursor: "pointer", fontSize: "13px", fontWeight: "600", marginTop: "8px",
              transition: "all 0.2s ease",
            }}>
              + Add Another Food Item
            </button>

            {/* Total summary */}
            {totalMacros.calories > 0 && (
              <div style={{
                background: isDark ? "rgba(255,107,53,0.08)" : "rgba(255,107,53,0.05)",
                border: "1.5px solid rgba(255,107,53,0.25)",
                borderRadius: "14px", padding: "16px", margin: "16px 0",
              }}>
                <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "700", color: "#ff6b35" }}>
                  🍽️ Total for this {mealType}:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", textAlign: "center" }}>
                  {[
                    { label: "Calories", value: totalMacros.calories, unit: "kcal", color: "#ff6b35" },
                    { label: "Protein", value: totalMacros.protein, unit: "g", color: "#378ADD" },
                    { label: "Carbs", value: totalMacros.carbs, unit: "g", color: "#EF9F27" },
                    { label: "Fats", value: totalMacros.fats, unit: "g", color: "#ef4444" },
                  ].map((s, i) => (
                    <div key={i} style={{
                      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
                      borderRadius: "10px", padding: "10px 4px",
                      border: `1px solid ${s.color}25`,
                    }}>
                      <p style={{ margin: "0 0 2px", fontSize: "22px", fontWeight: "700", color: s.color, textShadow: `0 0 10px ${s.color}60` }}>{s.value}</p>
                      <p style={{ margin: 0, fontSize: "10px", color: mutedColor, fontWeight: "600" }}>{s.unit} {s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={saveMeal} disabled={saving || totalMacros.calories === 0} className="btn-glow" style={{
                flex: 1, padding: "14px", fontSize: "15px", fontWeight: "700", borderRadius: "12px",
                opacity: saving || totalMacros.calories === 0 ? 0.5 : 1,
                cursor: saving ? "not-allowed" : "pointer",
              }}>
                {saving ? "Saving..." : `Save ${mealType} ✅`}
              </button>
              <button onClick={() => { setShowAddMeal(false); setFoodItems([{ ...emptyItem }]); }} style={{
                padding: "14px 22px", background: "transparent", color: mutedColor,
                border: `1.5px solid ${dividerColor}`,
                borderRadius: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "500",
                transition: "all 0.2s ease",
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.5s ease both; }
        .fade-in-up-d1 { animation: fadeInUp 0.5s 0.1s ease both; }
        .fade-in-up-d2 { animation: fadeInUp 0.5s 0.2s ease both; }
        .fade-in-up-d3 { animation: fadeInUp 0.5s 0.3s ease both; }
        .btn-glow { position: relative; overflow: hidden; background: linear-gradient(135deg, #ff6b35, #D85A30); border: none; color: white; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.34,1.3,0.64,1); box-shadow: 0 4px 20px rgba(255,107,53,0.4); }
        .btn-glow::before { content: ''; position: absolute; top: -50%; left: -60%; width: 50%; height: 200%; background: rgba(255,255,255,0.2); transform: skewX(-20deg); transition: left 0.5s; }
        .btn-glow:hover::before { left: 130%; }
        .btn-glow:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 8px 30px rgba(255,107,53,0.6); }
      `}</style>
    </div>
  );
}

export default Nutrition;
