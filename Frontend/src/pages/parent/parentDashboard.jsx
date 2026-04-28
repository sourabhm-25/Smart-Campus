import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

/* ── ANIMATED COUNTER ── */
function Counter({ to, delay = 0 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const raf = (ts) => {
      if (!start) start = ts + delay * 1000;
      const elapsed = ts - start;
      if (elapsed < 0) { requestAnimationFrame(raf); return; }
      const p = Math.min(elapsed / 1400, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * to));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [to]);
  return <span>{val.toLocaleString()}</span>;
}

/* ── FLOATING ORB ── */
function Orb({ size, top, left, color, duration, delay }) {
  return (
    <motion.div
      animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
      style={{ position: "fixed", top, left, width: size, height: size, borderRadius: "50%", pointerEvents: "none", background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, filter: "blur(55px)", zIndex: 0 }}
    />
  );
}

/* ── SUBJECT COLOUR MAP ── */
const SUBJECT_META = {
  mathematics: { icon: "📐", color: "#60a5fa" },
  math: { icon: "📐", color: "#60a5fa" },
  english: { icon: "📖", color: "#a78bfa" },
  science: { icon: "🔬", color: "#34d399" },
  "social studies": { icon: "🌍", color: "#fb923c" },
  "social science": { icon: "🌍", color: "#fb923c" },
  "computer science": { icon: "💻", color: "#f472b6" },
  "art & design": { icon: "🎨", color: "#fbbf24" },
};
const getSubjectMeta = (name = "") => {
  const key = name.toLowerCase();
  return SUBJECT_META[key] || { icon: "📚", color: "#94a3b8" };
};

export default function ParentDashboard() {
  const navigate = useNavigate();

  const [parentName, setParentName] = useState("Parent");
  const [children, setChildren] = useState([]);
  const [totalPendingHw, setTotalPendingHw] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get name from localStorage first
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    if (stored?.name) setParentName(stored.name.split(" ")[0]);

    const token = getToken();
    if (!token) { setLoading(false); return; }

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API}/parent/dashboard`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.message) setParentName(d.message.split(" ")[1] || "Parent");
        if (d.children) {
          setChildren(d.children);
          setTotalPendingHw(d.total_pending_homework || 0);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning ☀️";
    if (h < 17) return "Good afternoon 🌤️";
    return "Good evening 🌙";
  })();

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
      `}</style>

      <Orb size={480} top="-5%" left="15%" color="rgba(99,102,241,0.15)" duration={14} delay={0} />
      <Orb size={360} top="50%" left="55%" color="rgba(96,165,250,0.09)" duration={18} delay={4} />

      <div style={{ position: "relative", zIndex: 1, padding: "40px 40px 64px" }}>

        {/* ── GREETING ── */}
        <div style={{ marginBottom: 44 }}>
          <motion.p
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ fontSize: 13, color: "#6366f1", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            {greeting}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 1, 0.5, 1] }}
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(26px, 3.5vw, 40px)", letterSpacing: "-0.03em", color: "#fff", marginBottom: 8 }}>
            Hey {parentName} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            style={{ fontSize: 15, color: "#475569", fontWeight: 500 }}>
            You have{" "}
            <span style={{ color: "#f472b6", fontWeight: 700 }}>{totalPendingHw} pending task{totalPendingHw !== 1 ? "s" : ""}</span>
            {" "}across{" "}
            <span style={{ color: "#60a5fa", fontWeight: 700 }}>{children.length} child{children.length !== 1 ? "ren" : ""}</span>.
          </motion.p>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40 }}>
          {[
            { label: "Children", rawVal: children.length, icon: "👨‍👩‍👧‍👦", color: "#60a5fa" },
            { label: "Pending Tasks", rawVal: totalPendingHw, icon: "📝", color: "#fb923c" },
            { label: "Report Cards", rawVal: children.length, icon: "📋", color: "#34d399" },
            { label: "Overall Grade", rawVal: "A", icon: "⭐", color: "#f472b6" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + i * 0.08, ease: [0.25, 1, 0.5, 1] }}
              style={{
                padding: 24,
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>{stat.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>
                    {typeof stat.rawVal === "number" ? <Counter to={stat.rawVal} delay={0.18 + i * 0.08} /> : stat.rawVal}
                  </p>
                </div>
                <span style={{ fontSize: 28 }}>{stat.icon}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── CHILDREN CARDS ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff" }}>Your Children</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/parent/children")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: "rgba(99,102,241,0.2)",
                border: "1px solid rgba(99,102,241,0.4)",
                color: "#c7d2fe",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}>
              Manage Children +
            </motion.button>
          </div>

          {loading ? (
            <p style={{ color: "#64748b" }}>Loading children...</p>
          ) : children.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: 32,
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "2px dashed rgba(255,255,255,0.1)",
                textAlign: "center",
              }}>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}>No children linked yet</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/parent/children")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "rgba(99,102,241,0.3)",
                  border: "1px solid rgba(99,102,241,0.5)",
                  color: "#c7d2fe",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}>
                Link a Child →
              </motion.button>
            </motion.div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {children.map((child, i) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  onClick={() => navigate(`/parent/report-cards?child=${child.id}`)}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(20px)",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  }}>
                  <div style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{child.name}</h3>
                    <p style={{ fontSize: 12, color: "#64748b" }}>{child.grade} • {child.school}</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {child.subjects.slice(0, 2).map((subj, j) => {
                      const meta = getSubjectMeta(subj.subject);
                      return (
                        <div key={j} style={{ padding: 8, borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                          <p style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>{subj.subject}</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.icon}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 12, color: "#64748b" }}>
                    {child.total_pending_homework} pending tasks
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
