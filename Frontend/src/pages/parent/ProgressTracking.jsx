import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

// ── Subject colour palette ──────────────────────────────────────
const SUBJECT_COLORS = {
  mathematics: "#8bb7d8", math: "#8bb7d8",
  english: "#d8a0c4",
  science: "#8ecfae",
  "social studies": "#f4a97e", "social science": "#f4a97e",
  "computer science": "#f4d98e",
  "art & design": "#c4a8e0",
};
const getSubjectColor = (name = "") =>
  SUBJECT_COLORS[name.toLowerCase()] || "#8bb7d8";

// ── Percentage → text colour & background ──────────────────────
const getGradeColor = (pct) => {
  if (pct >= 90) return "#064e3b";
  if (pct >= 75) return "#1d4ed8";
  if (pct >= 60) return "#92400e";
  if (pct >= 40) return "#9a3412";
  return "#9f1239";
};
const getGradeBg = (pct) => {
  if (pct >= 90) return "#d1fae5";
  if (pct >= 75) return "#dbeafe";
  if (pct >= 60) return "#fef3c7";
  if (pct >= 40) return "#ffedd5";
  return "#ffe4e6";
};

// ── Clean status badge helper ──────────────────────────────────
// Maps every backend status value to a human-readable label + colours.
const STATUS_MAP = {
  submitted: { label: "Graded", bg: "#d1fae5", color: "#064e3b", border: "#34d399" },
  evaluated: { label: "Graded", bg: "#d1fae5", color: "#064e3b", border: "#34d399" },
  reviewed: { label: "Graded", bg: "#d1fae5", color: "#064e3b", border: "#34d399" },
  needs_review: { label: "Pending Review", bg: "#fff0b8", color: "#92400e", border: "#fbbf24" },
  late: { label: "Late", bg: "#ffedd5", color: "#9a3412", border: "#fb923c" },
  deadline_missed: { label: "Missed", bg: "#ffe4e6", color: "#9f1239", border: "#f472b6" },
  pending: { label: "Pending", bg: "#d8e8f4", color: "#1d4ed8", border: "#8bb7d8" },
};
const getStatusInfo = (status = "") =>
  STATUS_MAP[status] || { label: status, bg: "#e8f0f8", color: "#273c75", border: "#8bb7d8" };

// ── Component ──────────────────────────────────────────────────
export default function ProgressTracking() {
  const [searchParams] = useSearchParams();
  const selectedChildId = searchParams.get("child");

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(selectedChildId || null);
  const [progress, setProgress] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Fetch children list ──────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch(`${API}/parent/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.children) {
          setChildren(d.children);
          const target = selectedChildId && d.children.find(c => c.id === selectedChildId)
            ? selectedChildId
            : d.children[0]?.id || null;
          setSelectedChild(target);
        }
      })
      .catch(err => console.error("Dashboard fetch error:", err));
  }, [selectedChildId]);

  // ── Fetch progress + submissions when child changes ──────────
  useEffect(() => {
    if (!selectedChild) return;

    setLoading(true);
    setError("");
    setProgress(null);
    setSubmissions([]);

    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/parent/child/${selectedChild}/progress`, { headers }).then(r => r.json()),
      fetch(`${API}/parent/child/${selectedChild}/submissions`, { headers }).then(r => r.json()),
    ])
      .then(([progressData, submissionsData]) => {
        if (progressData.progress_by_subject) setProgress(progressData);
        if (submissionsData.submissions)
          setSubmissions(submissionsData.submissions.slice(0, 10));
        setLoading(false);
      })
      .catch(err => {
        console.error("Progress fetch error:", err);
        setError("Failed to load progress data. Please try again.");
        setLoading(false);
      });
  }, [selectedChild]);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ padding: "40px 40px 64px", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#273c75" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        .progress-select:focus { outline: none; border-color: #273c75 !important; box-shadow: 3px 3px 0 #d8a0c4; }
        .sub-card:hover { transform: translateY(-3px); box-shadow: 9px 9px 0 #d8a0c4 !important; }
        .sub-row:hover td { background: #fffbea; }
      `}</style>

      {/* ── Child Selector ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
        <label style={{ fontSize: 12, color: "#3F6E8F", fontWeight: 800, marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Select Child
        </label>
        <select
          className="progress-select"
          value={selectedChild || ""}
          onChange={(e) => setSelectedChild(e.target.value)}
          style={{
            width: "100%", maxWidth: 360,
            padding: "12px 16px", borderRadius: 8,
            background: "#ffffff", border: "3px solid #273c75",
            color: "#273c75", fontSize: 14,
            fontFamily: "inherit", fontWeight: 700,
            boxShadow: "4px 4px 0 #8bb7d8", cursor: "pointer",
          }}>
          <option value="">Choose a child…</option>
          {children.map(child => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
        </select>
      </motion.div>

      {/* ── States ── */}
      {error && (
        <div style={{ padding: "14px 20px", borderRadius: 8, background: "#ffe4e6", border: "3px solid #f472b6", color: "#9f1239", fontWeight: 800, marginBottom: 24 }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 8, background: "linear-gradient(90deg, #e8f0f8 25%, #d8e8f4 50%, #e8f0f8 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", border: "3px solid #d8e8f4" }} />
          ))}
          <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        </div>
      ) : !selectedChild ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: 40, borderRadius: 8, background: "#ffffff", border: "4px dashed #273c75", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#334155", fontWeight: 800 }}>Select a child above to view their progress 📊</p>
        </motion.div>
      ) : !progress ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: 40, borderRadius: 8, background: "#ffffff", border: "4px dashed #273c75", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#334155", fontWeight: 800 }}>No submission data found for this child yet.</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* ── Summary stats ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 36 }}>
            {[
              { label: "Overall Score", value: `${progress.overall_percentage ?? 0}%`, bg: "#fff0b8", shadow: "#f4d98e" },
              { label: "Total Submissions", value: progress.total_submissions ?? 0, bg: "#d8e8f4", shadow: "#8bb7d8" },
              { label: "Subjects", value: progress.progress_by_subject?.length ?? 0, bg: "#f1d8e6", shadow: "#d8a0c4" },
            ].map((stat, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ padding: "22px 20px", borderRadius: 8, background: stat.bg, border: "4px solid #273c75", boxShadow: `6px 6px 0 ${stat.shadow}` }}>
                <p style={{ fontSize: 12, color: "#334155", fontWeight: 800, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: 32, fontWeight: 900, color: "#273c75" }}>{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Progress by Subject ── */}
          {progress.progress_by_subject?.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 20, color: "#273c75", marginBottom: 20 }}>
                Progress by Subject
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {progress.progress_by_subject.map((subject, i) => {
                  const barColor = getSubjectColor(subject.subject);
                  const pct = subject.percentage ?? 0;
                  return (
                    <motion.div key={i} className="sub-card"
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      style={{ padding: 22, borderRadius: 8, background: "#ffffff", border: "4px solid #273c75", boxShadow: "6px 6px 0 #8bb7d8", transition: "all 0.25s ease" }}>

                      <h4 style={{ fontSize: 16, fontWeight: 900, color: "#273c75", marginBottom: 14 }}>
                        {subject.subject}
                      </h4>

                      {/* Score bar */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#3F6E8F", marginBottom: 6, fontWeight: 800 }}>
                          <span>Score: {subject.total_scored}/{subject.total_possible}</span>
                          <span style={{ color: "#273c75", fontWeight: 900 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 10, background: "#e8f0f8", borderRadius: 6, overflow: "hidden", border: "2px solid #273c75" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + i * 0.08 }}
                            style={{ height: "100%", background: barColor, borderRadius: 4 }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 12, borderTop: "3px solid #273c75" }}>
                        <div>
                          <p style={{ fontSize: 11, color: "#3F6E8F", marginBottom: 3, fontWeight: 700 }}>Avg Score</p>
                          <p style={{ fontSize: 14, color: "#273c75", fontWeight: 900 }}>{subject.average_score}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: "#3F6E8F", marginBottom: 3, fontWeight: 700 }}>Completion</p>
                          <p style={{ fontSize: 14, color: "#273c75", fontWeight: 900 }}>{subject.completion_rate}%</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Recent Submissions Table ── */}
          {submissions.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 20, color: "#273c75", marginBottom: 20 }}>
                Recent Submissions
              </h2>
              <div style={{ borderRadius: 8, border: "4px solid #273c75", boxShadow: "6px 6px 0 #8bb7d8", overflow: "hidden", background: "#ffffff" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f4d98e", borderBottom: "3px solid #273c75" }}>
                        {["Homework", "Subject", "Score", "Percentage", "Status"].map(h => (
                          <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "#273c75", fontWeight: 900, fontFamily: "'Sora', sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub, i) => {
                        const pct = sub.percentage ?? 0;
                        const statusInfo = getStatusInfo(sub.status);
                        return (
                          <tr key={i} className="sub-row"
                            style={{ borderBottom: i < submissions.length - 1 ? "2px solid #e8f0f8" : "none" }}>
                            <td style={{ padding: "13px 16px", color: "#273c75", fontWeight: 700 }}>
                              {sub.homework_title || "—"}
                            </td>
                            <td style={{ padding: "13px 16px", color: "#3F6E8F", fontWeight: 700 }}>
                              {sub.subject || "—"}
                            </td>
                            <td style={{ padding: "13px 16px", color: "#273c75", fontWeight: 800 }}>
                              {sub.total_score ?? "—"}/{sub.max_score ?? "—"}
                            </td>
                            <td style={{ padding: "13px 16px" }}>
                              <span style={{
                                display: "inline-block",
                                padding: "4px 10px", borderRadius: 6,
                                background: getGradeBg(pct),
                                color: getGradeColor(pct),
                                fontWeight: 900, fontSize: 12,
                                border: `2px solid ${getGradeColor(pct)}`,
                              }}>
                                {pct}%
                              </span>
                            </td>
                            <td style={{ padding: "13px 16px" }}>
                              <span style={{
                                padding: "4px 12px", borderRadius: 6,
                                fontSize: 11, fontWeight: 800,
                                background: statusInfo.bg,
                                color: statusInfo.color,
                                border: `2px solid ${statusInfo.border}`,
                              }}>
                                {statusInfo.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Empty submissions */}
          {submissions.length === 0 && progress && (
            <div style={{ padding: 32, borderRadius: 8, background: "#ffffff", border: "4px dashed #273c75", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#334155", fontWeight: 800 }}>No submissions yet for this child.</p>
            </div>
          )}

        </motion.div>
      )}
    </div>
  );
}
