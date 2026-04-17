import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

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
const getMeta = (name = "") => SUBJECT_META[name.toLowerCase()] || { icon: "📚", color: "#94a3b8" };

export default function TasksAssigned() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); setError("Not logged in"); return; }

    fetch(`${API}/student/homework`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then(data => {
        // Group homework by subject
        const grouped = {};
        for (const hw of (data.homework || [])) {
          const key = hw.subject || "General";
          if (!grouped[key]) {
            const meta = getMeta(key);
            grouped[key] = {
              id: key.toLowerCase().replace(/\s+/g, "-"),
              name: key,
              icon: meta.icon,
              color: meta.color,
              tasks: 0,
              unsubmitted: 0,
            };
          }
          grouped[key].tasks += 1;
          if (!hw.submitted) grouped[key].unsubmitted += 1;
        }
        setSubjects(Object.values(grouped));
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load homework:", err);
        setError("Could not load homework. Make sure you're enrolled in a class.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "#64748b" }}>
        Loading subjects…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px" }}>
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "16px 20px", color: "#fca5a5", fontSize: 14 }}>
          ⚠️ {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          marginBottom: 28,
        }}
      >
        Tasks Assigned
      </motion.h1>

      {subjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ color: "#475569", fontSize: 15, textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
          <div>No homework assigned yet.</div>
          <div style={{ fontSize: 13, marginTop: 8, color: "#334155" }}>Check back after your teacher assigns tasks.</div>
        </motion.div>
      ) : (
        /* Grid */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 18,
          }}
        >
          {subjects.map((subject, i) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{
                y: -6,
                borderColor: `${subject.color}50`,
                boxShadow: `0 10px 30px ${subject.color}20`,
              }}
              onClick={() =>
                navigate(`/student/tasks/${subject.id}`)
              }
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18,
                padding: "24px",
                cursor: "pointer",
                transition: "all 0.25s",
                position: "relative",
              }}
            >
              {/* Unsubmitted badge */}
              {subject.unsubmitted > 0 && (
                <div style={{
                  position: "absolute", top: 14, right: 14,
                  background: "#ef4444", color: "#fff",
                  fontSize: 11, fontWeight: 700, borderRadius: 99,
                  padding: "2px 8px",
                }}>
                  {subject.unsubmitted} due
                </div>
              )}

              <div style={{ fontSize: 28, marginBottom: 16 }}>
                {subject.icon}
              </div>

              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                {subject.name}
              </div>

              <div style={{ fontSize: 12, color: "#64748b" }}>
                {subject.tasks} Task{subject.tasks !== 1 ? "s" : ""} Assigned
              </div>

              {/* Accent Line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                style={{
                  marginTop: 18,
                  height: 2,
                  background: subject.color,
                  transformOrigin: "left",
                  borderRadius: 99,
                }}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
