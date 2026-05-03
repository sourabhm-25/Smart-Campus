import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

const STATUS_STYLE = {
  submitted:  { bg: "#B7DBFF", border: "#071521", text: "#071521", label: "Submitted" },
  late:       { bg: "#F6B94C", border: "#071521", text: "#071521", label: "Late" },
  evaluated:  { bg: "#6FA8DC", border: "#071521", text: "#071521", label: "Graded" },
  pending:    { bg: "#EFA83F", border: "#071521", text: "#071521", label: "Due" },
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
    <div style={{ padding: "40px 32px", color: "#071521" }}>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 900,
          fontSize: 32,
          marginBottom: 28,
          color: "#071521"
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
                  borderColor: "#071521",
                  boxShadow: "4px 4px 0px #071521",
                  y: -4,
                  scale: 1.01
                }}
                style={{
                  background: "#FFFFFF",
                  border: "3px solid #071521",
                  borderRadius: 20,
                  padding: "20px 24px",
                  transition: "all 0.2s",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                {/* Left: task info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 18, color: "#071521" }}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: 14, color: "#1C3F57", fontWeight: 600, marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {task.description}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    {task.teacher_name && (
                      <span style={{ fontSize: 12, color: "#1C3F57", fontWeight: 700 }}>👤 {task.teacher_name}</span>
                    )}
                    {deadline && (
                      <span style={{ fontSize: 12, color: deadline.color, fontWeight: 800 }}>
                        🕒 {deadline.text}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: "#1C3F57", fontWeight: 700, textTransform: "capitalize" }}>
                      📋 {task.task_type || "homework"}
                    </span>
                  </div>
                </div>

                {/* Right: status badge */}
                <div style={{
                  padding: "6px 14px",
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 900,
                  background: style.bg,
                  border: `2px solid ${style.border}`,
                  color: style.text,
                  flexShrink: 0,
                  boxShadow: "2px 2px 0px #071521"
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
