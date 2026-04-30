import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import WorkoutSession from "./pages/WorkoutSession";
import Navbar from "./components/Navbar";
import FitnessBot from "./components/FitnessBot";
import Profile from "./pages/Profile";
import Nutrition from "./pages/Nutrition";
import PushNotification from "./components/PushNotification";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") !== "false"
  );

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    if (darkMode) {
      document.body.style.background = "#030309";
      document.body.style.color = "#ffffff";
      document.body.classList.remove("light-mode");
    } else {
      document.body.style.background = "#f0f2ff";
      document.body.style.color = "#1a1a2e";
      document.body.classList.add("light-mode");
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      {token && <Navbar darkMode={darkMode} setDarkMode={setDarkMode} setToken={setToken} />}
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Login darkMode={darkMode} setToken={setToken} />} />
        <Route path="/signup" element={<Signup darkMode={darkMode} setToken={setToken} />} />
        <Route path="/dashboard" element={token ? <Dashboard darkMode={darkMode} /> : <Navigate to="/" />} />
        <Route path="/workout" element={token ? <WorkoutSession darkMode={darkMode} /> : <Navigate to="/" />} />
        <Route path="/profile" element={token ? <Profile darkMode={darkMode} /> : <Navigate to="/" />} />
        <Route path="/nutrition" element={token ? <Nutrition darkMode={darkMode} /> : <Navigate to="/" />} />
      </Routes>
      {token && <FitnessBot darkMode={darkMode} />}
      {token && <PushNotification />}
    </BrowserRouter>
  );
}

export default App;
