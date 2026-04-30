import { useState, useRef, useEffect } from "react";
import api from "../api";

function FitnessBot({ darkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Namaste! 💪 Main Ignite AI Fitness Coach hun!\n\nMujhse poochho:\n• Exercise tips 🏋️\n• Muscle pain solutions 💊\n• Diet & nutrition 🥗\n• Supplements 💉\n• Workout plans 📋\n• Weight loss/gain ⚖️\n\nKya jaanna chahte ho?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const isDark = darkMode !== false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    try {
      const res = await api.post("/chat", {
        messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: userMessage }]
      });
      setMessages(prev => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Oops! Kuch error aa gaya. Dobara try karo! 🙏" }]);
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const quickQuestions = [
    "Chest pain after workout?",
    "Best protein diet?",
    "Beginner workout plan?",
    "Whey protein lena chahiye?",
    "Weight loss tips?",
    "Muscle gain kaise kare?",
  ];

  const botBg = isDark ? "rgba(6,6,14,0.98)" : "rgba(255,255,255,0.97)";
  const botBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const textColor = isDark ? "#fff" : "#1a1a2e";
  const mutedColor = isDark ? "rgba(255,255,255,0.4)" : "#888";
  const msgBotBg = isDark ? "rgba(255,255,255,0.07)" : "#f0f2ff";
  const dividerColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";

  return (
    <>
      {/* FAB Button */}
      <div onClick={() => setIsOpen(!isOpen)} style={{
        position: "fixed", bottom: "28px", right: "28px",
        width: "60px", height: "60px", borderRadius: "20px",
        background: isOpen
          ? isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
          : "linear-gradient(135deg, #ff6b35, #D85A30)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: isOpen ? "none" : "0 8px 30px rgba(255,107,53,0.55), 0 0 0 2px rgba(255,107,53,0.2)",
        zIndex: 1000, fontSize: "24px",
        transition: "all 0.35s cubic-bezier(0.34,1.3,0.64,1)",
        border: `1px solid ${botBorder}`,
        transform: isOpen ? "rotate(45deg) scale(0.9)" : "rotate(0deg) scale(1)",
        backdropFilter: "blur(10px)",
      }}>
        {isOpen ? "✕" : "🤖"}
      </div>

      {/* Pulse ring when closed */}
      {!isOpen && (
        <div style={{
          position: "fixed", bottom: "28px", right: "28px",
          width: "60px", height: "60px", borderRadius: "20px",
          border: "2px solid rgba(255,107,53,0.4)",
          animation: "botRipple 2s ease-out infinite",
          pointerEvents: "none", zIndex: 999,
        }} />
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: "102px", right: "28px",
          width: "390px", height: "580px",
          background: botBg,
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: `1px solid ${botBorder}`,
          borderRadius: "24px",
          boxShadow: isDark
            ? "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)"
            : "0 40px 80px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          zIndex: 999, overflow: "hidden",
          animation: "chatSlideIn 0.4s cubic-bezier(0.34,1.3,0.64,1)",
        }}>

          {/* Top glow */}
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.6), transparent)",
          }} />

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #ff6b35, #D85A30)",
            padding: "16px 20px",
            display: "flex", alignItems: "center", gap: "12px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 100%)", pointerEvents: "none" }} />
            <div style={{
              width: "44px", height: "44px", borderRadius: "14px",
              background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "22px", border: "1px solid rgba(255,255,255,0.3)",
              animation: "botBounce 3s ease-in-out infinite",
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: "700", color: "white", fontSize: "15px", letterSpacing: "-0.3px" }}>Ignite AI Coach</p>
              <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 6px #4ade80" }}></span>
                Online — Fitness Expert
              </p>
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", textAlign: "right" }}>
              <p style={{ margin: 0 }}>Powered by</p>
              <p style={{ margin: 0, fontWeight: "700", color: "white" }}>Groq AI</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-end", gap: "8px",
                animation: "msgIn 0.3s ease",
              }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: "30px", height: "30px", borderRadius: "10px",
                    background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "15px", flexShrink: 0,
                  }}>🤖</div>
                )}
                <div style={{
                  maxWidth: "76%", padding: "11px 15px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #ff6b35, #D85A30)"
                    : msgBotBg,
                  color: msg.role === "user" ? "white" : textColor,
                  fontSize: "13px", lineHeight: "1.65", whiteSpace: "pre-wrap",
                  boxShadow: msg.role === "user"
                    ? "0 4px 15px rgba(255,107,53,0.35)"
                    : isDark ? "0 2px 10px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.07)",
                  border: msg.role !== "user" ? `1px solid ${botBorder}` : "none",
                }}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div style={{
                    width: "30px", height: "30px", borderRadius: "10px",
                    background: "linear-gradient(135deg, #ff6b35, #D85A30)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: "700", color: "white", flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(255,107,53,0.4)",
                  }}>
                    {JSON.parse(localStorage.getItem("user"))?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "10px",
                  background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px",
                }}>🤖</div>
                <div style={{
                  background: msgBotBg, padding: "13px 17px",
                  borderRadius: "16px 16px 16px 4px",
                  border: `1px solid ${botBorder}`,
                }}>
                  <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: "7px", height: "7px", borderRadius: "50%",
                        background: "#ff6b35",
                        animation: "typingBounce 1.2s infinite",
                        animationDelay: `${i * 0.15}s`,
                      }}></div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div style={{ padding: "0 12px 10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {quickQuestions.map((q, i) => (
                <button key={i} onClick={() => setInput(q)} style={{
                  padding: "5px 11px",
                  background: isDark ? "rgba(255,107,53,0.1)" : "rgba(216,90,48,0.08)",
                  border: "1px solid rgba(255,107,53,0.2)",
                  color: "#ff6b35", borderRadius: "20px", fontSize: "11px",
                  cursor: "pointer", fontWeight: "600",
                  transition: "all 0.2s ease",
                }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: "12px 16px",
            borderTop: `1px solid ${dividerColor}`,
            display: "flex", gap: "8px", alignItems: "center",
            background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Fitness question poochho..."
              style={{
                flex: 1, padding: "11px 16px",
                border: `1.5px solid ${input.trim() ? "rgba(255,107,53,0.4)" : botBorder}`,
                borderRadius: "14px", fontSize: "13px",
                outline: "none", color: textColor,
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
                fontFamily: "Inter, sans-serif",
                transition: "all 0.2s ease",
              }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
              width: "42px", height: "42px", borderRadius: "13px",
              background: loading || !input.trim()
                ? isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                : "linear-gradient(135deg, #ff6b35, #D85A30)",
              color: loading || !input.trim() ? mutedColor : "white",
              border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.3s cubic-bezier(0.34,1.3,0.64,1)",
              boxShadow: !loading && input.trim() ? "0 4px 15px rgba(255,107,53,0.4)" : "none",
              transform: !loading && input.trim() ? "scale(1)" : "scale(0.95)",
            }}>➤</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes botRipple {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes botBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(10deg); }
        }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

export default FitnessBot;
