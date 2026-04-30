import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const navBg = darkMode
    ? "rgba(3,3,9,0.92)"
    : "rgba(255,255,255,0.85)";
  const borderColor = darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const textMuted = darkMode ? "rgba(255,255,255,0.5)" : "#666";

  const navLink = (path, label) => {
    const active = location.pathname === path;
    return (
      <Link to={path} style={{
        textDecoration: "none",
        color: active ? "#ff6b35" : textMuted,
        fontWeight: active ? "600" : "500",
        fontSize: "14px",
        padding: "8px 16px",
        borderRadius: "12px",
        background: active
          ? darkMode ? "rgba(255,107,53,0.15)" : "rgba(216,90,48,0.1)"
          : "transparent",
        border: active ? "1px solid rgba(255,107,53,0.25)" : "1px solid transparent",
        transition: "all 0.25s ease",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        position: "relative",
        overflow: "hidden",
      }}>
        {label}
        {active && (
          <span style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "30%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #ff6b35, transparent)",
            borderRadius: "2px",
          }} />
        )}
      </Link>
    );
  };

  return (
    <nav style={{
      background: navBg,
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      padding: "12px 32px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `1px solid ${borderColor}`,
      boxShadow: darkMode
        ? "0 1px 40px rgba(0,0,0,0.6), 0 0 60px rgba(255,107,53,0.03)"
        : "0 1px 20px rgba(0,0,0,0.08)",
      position: "sticky",
      top: 0,
      zIndex: 200,
    }}>

      {/* Logo */}
      <Link to="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #ff6b35, #D85A30)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          boxShadow: "0 4px 15px rgba(255,107,53,0.4)",
          animation: "pulseGlowMild 3s ease-in-out infinite",
        }}>⚡</div>
        <span style={{
          fontSize: "20px",
          fontWeight: "800",
          background: "linear-gradient(135deg, #ff6b35, #ffb347)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.5px",
        }}>Tejas</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {navLink("/dashboard", "🏠 Dashboard")}
        {navLink("/workout", "💪 Workout")}
        {navLink("/nutrition", "🥗 Nutrition")}
        {navLink("/profile", "👤 Profile")}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>

        {/* Dark mode toggle */}
        <div onClick={() => setDarkMode(!darkMode)} style={{
          width: "58px",
          height: "30px",
          borderRadius: "20px",
          background: darkMode
            ? "linear-gradient(135deg, #ff6b35, #D85A30)"
            : "rgba(0,0,0,0.12)",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.4s cubic-bezier(0.34,1.3,0.64,1)",
          boxShadow: darkMode ? "0 2px 12px rgba(255,107,53,0.4)" : "none",
          border: `1px solid ${darkMode ? "rgba(255,107,53,0.3)" : "rgba(0,0,0,0.1)"}`,
        }}>
          <div style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "white",
            position: "absolute",
            top: "4px",
            left: darkMode ? "32px" : "4px",
            transition: "left 0.4s cubic-bezier(0.34,1.3,0.64,1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          }}>
            {darkMode ? "🌙" : "☀️"}
          </div>
        </div>

        {/* User avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff6b35, #D85A30)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
            color: "white",
            fontSize: "13px",
            boxShadow: "0 0 12px rgba(255,107,53,0.35)",
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span style={{ color: textMuted, fontSize: "13px", fontWeight: "500" }}>
            {user?.name?.split(" ")[0]}
          </span>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="btn-glow" style={{
          padding: "8px 18px",
          fontSize: "13px",
          fontWeight: "600",
          borderRadius: "10px",
        }}>
          Logout
        </button>
      </div>

      <style>{`
        @keyframes pulseGlowMild {
          0%, 100% { box-shadow: 0 4px 15px rgba(255,107,53,0.3); }
          50% { box-shadow: 0 4px 25px rgba(255,107,53,0.6); }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;
