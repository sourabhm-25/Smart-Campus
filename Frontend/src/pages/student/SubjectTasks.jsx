import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

const STATUS_STYLE = {
  submitted:  { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)",  text: "#6ee7b7", label: "Submitted" },
  late:       { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",  text: "#fde68a", label: "Late" },
  evaluated:  { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)",  text: "#a5b4fc", label: "Graded" },
  pending:    { bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.25)",  text: "#fca5a5", label: "Due" },
};

function formatDeadline(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.round((d - now) / 86400000);
  if (diff < 0) return { text: "Overdue", color: "#ef4444" };
  if (diff === 0) return { text: "Due today", color: "#fb923c" };
  if (diff === 1) return { text: "Due tomorrow", color: "#fbbf24" };
  return { text: `Due ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`, color: "#64748b" };
}

export default function SubjectTasks() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Convert URL slug back to display name (mathematics → Mathematics)
  const formattedTitle =
    subjectId
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); setError("Not logged in"); return; }

    // Use the subject name derived from the URL slug
    const subject = subjectId?.replace(/-/g, " ");

    fetch(`${API}/student/homework/${encodeURIComponent(subject)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then(data => {
        setTasks(data.homework || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load homework:", err);
        setError("Could not load homework for this subject.");
        setLoading(false);
      });
  }, [subjectId]);

  return (
    <div style={{ padding: "40px 32px" }}>

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
        {formattedTitle} Homework
      </motion.h1>

      {loading ? (
        <div style={{ color: "#64748b", fontSize: 14 }}>Loading tasks…</div>
      ) : error ? (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "16px 20px", color: "#fca5a5", fontSize: 14 }}>
          ⚠️ {error}
        </div>
      ) : tasks.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ color: "#475569", fontSize: 15, textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          No homework assigned for {formattedTitle} yet.
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {tasks.map((task, i) => {
            const submissionStatus = task.submission_status || (task.submitted ? "submitted" : "pending");
            const style = STATUS_STYLE[submissionStatus] || STATUS_STYLE.pending;
            const deadline = formatDeadline(task.deadline);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{
                  borderColor: "#6366f150",
                  boxShadow: "0 8px 24px rgba(99,102,241,0.15)",
                  y: -4,
                }}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  padding: "18px 22px",
                  transition: "all 0.25s",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                {/* Left: task info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {task.description}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    {task.teacher_name && (
                      <span style={{ fontSize: 11, color: "#475569" }}>👤 {task.teacher_name}</span>
                    )}
                    {deadline && (
                      <span style={{ fontSize: 11, color: deadline.color, fontWeight: 600 }}>
                        🕒 {deadline.text}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "#475569", textTransform: "capitalize" }}>
                      📋 {task.task_type || "homework"}
                    </span>
                  </div>
                </div>

                {/* Right: status badge */}
                <div style={{
                  padding: "5px 12px",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  color: style.text,
                  flexShrink: 0,
                }}>
                  {style.label}
                  {submissionStatus === "evaluated" && task.submission_score != null
                    ? ` · ${task.submission_score}`
                    : ""}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
