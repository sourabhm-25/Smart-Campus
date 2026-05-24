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
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#273c75", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        .parent-dashboard-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 12% 10%, rgba(244,217,142,0.34), transparent 26%),
            radial-gradient(circle at 88% 18%, rgba(216,160,196,0.24), transparent 28%);
        }
        .parent-hero-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 24px;
          border: 4px solid #273c75;
          border-radius: 8px;
          background: linear-gradient(135deg, #f1d8e6, #fff0b8);
          box-shadow: 10px 10px 0 #8bb7d8;
          margin-bottom: 36px;
        }
        .parent-stat-grid { grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)) !important; }
        .parent-children-grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)) !important; }
        @media (max-width: 920px) {
          .parent-dashboard-page { padding: 24px 18px 44px !important; }
        }
        @media (max-width: 620px) {
          .parent-dashboard-page { padding: 18px 14px 36px !important; }
          .parent-hero-strip { padding: 18px; box-shadow: 6px 6px 0 #8bb7d8; align-items: flex-start; }
          .parent-hero-strip img { width: 74px !important; height: 74px !important; }
        }
      `}</style>

      <div className="parent-dashboard-page" style={{ position: "relative", zIndex: 1, padding: "40px 40px 64px" }}>

        {/* ── GREETING ── */}
        <div className="parent-hero-strip">
          <div>
          <motion.p
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ fontSize: 13, color: "#3F6E8F", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            {greeting}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 1, 0.5, 1] }}
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: "clamp(26px, 3.5vw, 40px)", letterSpacing: "0", color: "#273c75", marginBottom: 8 }}>
            Hey {parentName} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            style={{ fontSize: 15, color: "#334155", fontWeight: 800 }}>
            You have{" "}
            <span style={{ color: "#c94fab", fontWeight: 900 }}>{totalPendingHw} pending task{totalPendingHw !== 1 ? "s" : ""}</span>
            {" "}across{" "}
            <span style={{ color: "#3F6E8F", fontWeight: 900 }}>{children.length} child{children.length !== 1 ? "ren" : ""}</span>.
          </motion.p>
          </div>
          <img src="/dashboard-elements/pencil-flower.png" alt="" aria-hidden="true" style={{ width: 104, height: 104, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(6px 8px 0 rgba(39,60,117,0.14))" }} />
        </div>

        {/* ── STAT CARDS ── */}
        <div className="parent-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40 }}>
          {[
            { label: "Children", rawVal: children.length, icon: "/dashboard-elements/backpack.png", color: "#8bb7d8", bg: "#d8e8f4" },
            { label: "Pending Tasks", rawVal: totalPendingHw, icon: "/dashboard-elements/pencil-box.png", color: "#f4d98e", bg: "#fff0b8" },
            { label: "Report Cards", rawVal: children.length, icon: "/dashboard-elements/report-a-plus.png", color: "#d8a0c4", bg: "#f1d8e6" },
            { label: "Overall Grade", rawVal: "A", icon: "/dashboard-elements/idea-bulb.png", color: "#8bb7d8", bg: "#dceeff" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + i * 0.08, ease: [0.25, 1, 0.5, 1] }}
              style={{
                padding: 22,
                borderRadius: 8,
                background: stat.bg,
                border: "4px solid #273c75",
                boxShadow: "7px 7px 0 #d8a0c4",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: "#334155", fontWeight: 900, marginBottom: 8 }}>{stat.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: "#273c75" }}>
                    {typeof stat.rawVal === "number" ? <Counter to={stat.rawVal} delay={0.18 + i * 0.08} /> : stat.rawVal}
                  </p>
                </div>
                <img src={stat.icon} alt="" aria-hidden="true" style={{ width: 48, height: 48, objectFit: "contain", filter: "drop-shadow(3px 4px 0 rgba(39,60,117,0.14))" }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── CHILDREN CARDS ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 20, color: "#273c75" }}>Your Children</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/parent/children")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: "#f4d98e",
                border: "3px solid #273c75",
                color: "#273c75",
                fontSize: 13,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "4px 4px 0 #d8a0c4",
              }}>
              Manage Children +
            </motion.button>
          </div>

          {loading ? (
            <p style={{ color: "#334155", fontWeight: 800 }}>Loading children...</p>
          ) : children.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: 32,
                borderRadius: 8,
                background: "#ffffff",
                border: "4px dashed #273c75",
                textAlign: "center",
              }}>
              <p style={{ fontSize: 14, color: "#334155", fontWeight: 800, marginBottom: 12 }}>No children linked yet</p>
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
            <div className="parent-children-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {children.map((child, i) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  onClick={() => navigate(`/parent/report-cards?child=${child.id}`)}
                  style={{
                    padding: 20,
                    borderRadius: 8,
                    background: "#ffffff",
                    border: "4px solid #273c75",
                    boxShadow: "6px 6px 0 #8bb7d8",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "9px 9px 0 #d8a0c4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "6px 6px 0 #8bb7d8";
                  }}>
                  <div style={{ marginBottom: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: "#273c75", marginBottom: 4 }}>{child.name}</h3>
                    <p style={{ fontSize: 12, color: "#334155", fontWeight: 800 }}>{child.grade} • {child.school}</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {child.subjects.slice(0, 2).map((subj, j) => {
                      const meta = getSubjectMeta(subj.subject);
                      return (
                        <div key={j} style={{ padding: 8, borderRadius: 8, background: "#d8e8f4", border: "2px solid #273c75" }}>
                          <p style={{ fontSize: 11, color: "#334155", fontWeight: 800, marginBottom: 2 }}>{subj.subject}</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.icon}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ paddingTop: 12, borderTop: "3px solid #273c75", fontSize: 12, color: "#334155", fontWeight: 900 }}>
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
