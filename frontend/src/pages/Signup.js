import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${(i * 6.5) % 100}%`,
  size: `${(i % 3) + 2}px`,
  duration: `${10 + (i % 5) * 2}s`,
  delay: `${(i * 1.3) % 8}s`,
}));

function Signup({ darkMode }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await axios.post("http://localhost:5001/api/auth/signup", { name, email, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Connection failed! Check if backend is running.");
    }
    setLoading(false);
  };

  const isDark = darkMode !== false;
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.88)";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "#777";
  const cardShadow = isDark
    ? "0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 40px 80px rgba(0,0,0,0.14), 0 0 0 1px rgba(255,255,255,0.7), inset 0 1px 0 rgba(255,255,255,0.9)";

  return (
    <div style={{
      minHeight: "100vh",
      background: isDark
        ? "radial-gradient(ellipse at 50% 0%, #0a1228 0%, #030309 70%)"
        : "linear-gradient(135deg, #f0f2ff 0%, #e8eaff 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>

      {PARTICLES.map(p => (
        <div key={p.id} style={{
          position: "fixed", left: p.left, bottom: "-10px",
          width: p.size, height: p.size, borderRadius: "50%",
          background: "rgba(255,107,53,0.5)",
          animation: `ptRise ${p.duration} ${p.delay} linear infinite`,
          pointerEvents: "none", zIndex: 0,
        }} />
      ))}

      <div style={{
        position: "fixed", top: "20%", right: "8%",
        width: "450px", height: "450px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 70%)",
        animation: "orbFloat 10s ease-in-out infinite",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "15%", left: "8%",
        width: "380px", height: "380px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(80,60,220,0.06) 0%, transparent 70%)",
        animation: "orbFloat 14s 3s ease-in-out infinite reverse",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{
        background: cardBg,
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: `1px solid ${cardBorder}`,
        borderRadius: "28px",
        padding: "48px 44px",
        width: "420px",
        boxShadow: cardShadow,
        position: "relative",
        zIndex: 1,
        animation: "cardFloat 7s ease-in-out infinite",
      }}>
        <div style={{
          position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.7), transparent)",
        }} />

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "20px",
            background: "linear-gradient(135deg, #ff6b35, #D85A30)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "34px", margin: "0 auto 14px",
            boxShadow: "0 10px 35px rgba(255,107,53,0.55), 0 0 0 1px rgba(255,107,53,0.25)",
            animation: "iconFloat 4s ease-in-out infinite",
          }}>🔥</div>
          <h1 style={{
            fontSize: "34px", fontWeight: "800", margin: "0 0 6px",
            background: "linear-gradient(135deg, #ff6b35, #ffb347)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            letterSpacing: "-1.5px",
          }}>Join Tejas</h1>
          <p style={{ color: mutedColor, fontSize: "14px", margin: 0 }}>
            Start your fitness journey today! 💪
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(234,67,67,0.12)", border: "1px solid rgba(234,67,67,0.28)",
            borderRadius: "12px", padding: "12px 16px", marginBottom: "16px",
            color: "#ff6b6b", fontSize: "13px", textAlign: "center",
          }}>⚠️ {error}</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            className={isDark ? "input-glass" : "input-glass-light"}
            placeholder="👤 Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className={isDark ? "input-glass" : "input-glass-light"}
            placeholder="📧 Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className={isDark ? "input-glass" : "input-glass-light"}
            placeholder="🔒 Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSignup()}
          />
        </div>

        <button onClick={handleSignup} disabled={loading} className="btn-glow" style={{
          width: "100%", padding: "16px", fontSize: "16px", fontWeight: "700",
          marginTop: "20px", borderRadius: "16px",
          opacity: loading ? 0.75 : 1, cursor: loading ? "wait" : "pointer",
        }}>
          {loading ? "⏳ Creating account..." : "⚡ Create Account"}
        </button>

        <p style={{ textAlign: "center", marginTop: "20px", color: mutedColor, fontSize: "13px" }}>
          Already have account?{" "}
          <Link to="/" style={{ color: "#ff6b35", fontWeight: "600", textDecoration: "none" }}>
            Login →
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes ptRise {
          0% { transform: translateY(0); opacity: 0; }
          8% { opacity: 0.5; }
          92% { opacity: 0.5; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 20px) scale(1.04); }
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}

export default Signup;
