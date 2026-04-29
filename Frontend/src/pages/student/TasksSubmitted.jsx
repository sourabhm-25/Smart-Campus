import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

const SUBJECT_META = {
  mathematics: { icon: "📐", color: "#60a5fa" },
  math:        { icon: "📐", color: "#60a5fa" },
  english:     { icon: "📖", color: "#a78bfa" },
  science:     { icon: "🔬", color: "#34d399" },
  "social studies": { icon: "🌍", color: "#fb923c" },
  "social science": { icon: "🌍", color: "#fb923c" },
  "computer science": { icon: "💻", color: "#f472b6" },
  "art & design": { icon: "🎨", color: "#fbbf24" },
  history:     { icon: "🏛️", color: "#f97316" },
  geography:   { icon: "🗺️", color: "#22d3ee" },
};
const getMeta = (name = "") =>
  SUBJECT_META[name.toLowerCase()] || { icon: "📚", color: "#94a3b8" };

function gradeColor(grade) {
  if (!grade) return "#94a3b8";
  if (grade.startsWith("A")) return "#34d399";
  if (grade.startsWith("B")) return "#60a5fa";
  if (grade.startsWith("C")) return "#fbbf24";
  if (grade.startsWith("D")) return "#fb923c";
  return "#f87171";
}

function ScoreRing({ pct, color, size = 56 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0, transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        strokeDashoffset={circ - dash}
      />
      <text
        x="50%" y="50%"
        textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size < 50 ? 9 : 11} fontWeight={700}
        style={{ transform: "rotate(90deg)", transformOrigin: "50% 50%", fontFamily: "inherit" }}
      >
        {pct}%
      </text>
    </svg>
  );
}

// ── Submitted task card ──────────────────────────────────
function SubmittedCard({ task, color, index }) {
  const [expanded, setExpanded] = useState(false);
  const pct = task.percentage ?? Math.round(((task.submission_score ?? 0) / (task.total_marks || 1)) * 100);
  const grade = task.grade || "";
  const gColor = gradeColor(grade);

  const submittedAt = task.submitted_at
    ? new Date(task.submitted_at).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "stretch", minHeight: 88 }}>
        {/* Accent */}
        <div style={{ width: 4, background: `linear-gradient(180deg, ${color}, ${gColor})`, flexShrink: 0 }} />

        {/* Content */}
        <div style={{ flex: 1, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 6, lineHeight: 1.4 }}>
                {task.title}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{
                  fontSize: 11, color, background: `${color}15`,
                  borderRadius: 6, padding: "2px 9px", fontWeight: 600, textTransform: "capitalize",
                }}>
                  {task.task_type}
                </span>
                {submittedAt && (
                  <span style={{ fontSize: 11, color: "#475569" }}>Submitted {submittedAt}</span>
                )}
                {(task.is_late || task.submission_status === "late" || task.status === "late") && !task.deadline_missed && (
                  <span style={{
                    fontSize: 11, color: "#fb923c", background: "rgba(251,146,60,0.12)",
                    borderRadius: 6, padding: "2px 9px", fontWeight: 700,
                    border: "1px solid rgba(251,146,60,0.25)",
                  }}>⏰ Late Submission</span>
                )}
                {(task.deadline_missed || task.status === "deadline_missed") && (
                  <span style={{
                    fontSize: 11, color: "#f87171", background: "rgba(248,113,113,0.10)",
                    borderRadius: 6, padding: "2px 9px", fontWeight: 700,
                    border: "1px solid rgba(248,113,113,0.25)",
                  }}>⛔ Missed — 0 / F</span>
                )}
              </div>
            </div>

            {/* Score + Grade */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
              <ScoreRing pct={pct} color={gColor} size={56} />
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 22, fontWeight: 800, color: gColor,
                  lineHeight: 1, fontFamily: "'Sora', sans-serif",
                }}>
                  {grade || "—"}
                </div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>Grade</div>
              </div>
            </div>
          </div>

          {/* Score bar + expand toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden",
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                  style={{ height: "100%", background: `linear-gradient(90deg, ${color}88, ${gColor})`, borderRadius: 99 }}
                />
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                {task.submission_score ?? "?"} / {task.total_marks ?? "?"} marks
              </div>
            </div>

            {task.breakdown?.length > 0 && (
              <button
                onClick={() => setExpanded(e => !e)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "5px 14px",
                  fontSize: 11, color: "#64748b", cursor: "pointer",
                  fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {expanded ? "Hide" : "Details"}
                <motion.span
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "inline-block" }}
                >▼</motion.span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable breakdown */}
      <AnimatePresence initial={false}>
        {expanded && task.breakdown?.length > 0 && (
          <motion.div
            key="breakdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              padding: "16px 24px",
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              {task.breakdown.map((q, qi) => (
                <div key={qi} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10, padding: "12px 16px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4, lineHeight: 1.5 }}>
                        <span style={{
                          fontSize: 10, color, background: `${color}18`,
                          borderRadius: 4, padding: "1px 7px", fontWeight: 700,
                          marginRight: 8,
                        }}>Q{qi + 1}</span>
                        {q.question}
                      </div>
                      {q.feedback && (
                        <div style={{
                          fontSize: 11, color: q.score === q.max_marks ? "#34d399" : q.score > 0 ? "#fbbf24" : "#f87171",
                          marginTop: 4, padding: "6px 10px",
                          background: "rgba(255,255,255,0.02)", borderRadius: 6,
                          lineHeight: 1.5,
                        }}>
                          {q.score === q.max_marks ? "✓" : q.score > 0 ? "◑" : "✗"} {q.feedback}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                      color: q.score === q.max_marks ? "#34d399" : q.score > 0 ? "#fbbf24" : "#f87171",
                    }}>
                      {q.score}/{q.max_marks}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Subject group ────────────────────────────────────────
function SubjectGroup({ subject, index }) {
  const [open, setOpen] = useState(true);
  const { color } = subject;
  const avgPct = subject.tasks > 0
    ? Math.round(subject.homeworkList.reduce((s, h) => s + (h.percentage ?? 0), 0) / subject.tasks)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20, overflow: "hidden", marginBottom: 16,
      }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px", cursor: "pointer",
          position: "relative", userSelect: "none",
        }}
      >
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: 4, background: color, borderRadius: "20px 0 0 20px",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${color}18`, border: `1px solid ${color}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>
            {subject.icon}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{subject.name}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
              {subject.tasks} submitted · Avg {avgPct}%
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            fontSize: 14, fontWeight: 800, color: gradeColor(
              avgPct >= 90 ? "A+" : avgPct >= 80 ? "A" : avgPct >= 70 ? "B+" :
              avgPct >= 60 ? "B" : avgPct >= 50 ? "C" : avgPct >= 40 ? "D" : "F"
            ),
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "4px 14px",
          }}>
            {avgPct}%
          </div>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            style={{ color, fontSize: 14, opacity: 0.7 }}
          >▼</motion.span>
        </div>
      </div>

      {/* Task list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="tasks"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "16px 20px" }}>
              {subject.homeworkList.map((task, i) => (
                <SubmittedCard key={task.id} task={task} color={color} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Old Task History Panel ───────────────────────────────
function OldTaskHistory({ subjects }) {
  const [open, setOpen] = useState(false);

  const totalOld = subjects.reduce((s, sub) => s + sub.tasks, 0);
  if (totalOld === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ marginTop: 32 }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: open ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: open ? "16px 16px 0 0" : 16,
          padding: "16px 24px",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>📂</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>
              Old Task History
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
              {totalOld} past task{totalOld !== 1 ? "s" : ""} · Click to {open ? "collapse" : "expand"}
            </div>
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ color: "#64748b", fontSize: 16 }}
        >▼</motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="history"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderTop: "none",
              borderRadius: "0 0 16px 16px",
              padding: "20px 20px 8px",
            }}>
              {subjects.map((subject, i) => (
                <SubjectGroup key={subject.id} subject={subject} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────
// "Recent" = submitted within the last 30 days & not overdue
// "Old"     = everything else that was submitted
const RECENT_DAYS = 30;

export default function TasksSubmitted() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSubmitted = useCallback(() => {
    const token = getToken();
    if (!token) { setLoading(false); setError("Not logged in"); return; }

    fetch(`${API}/student/homework`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json(); })
      .then(async data => {
        // Filter to submitted tasks only
        const submittedHw = (data.homework || []).filter(hw => hw.submitted);

        // Enrich with submission result (score/grade/breakdown) if available
        const enriched = await Promise.all(
          submittedHw.map(async hw => {
            try {
              const res = await fetch(`${API}/student/homework/${hw._id || hw.id}/result`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                const result = await res.json();
                return { ...hw, ...result };
              }
            } catch (_) {}
            return hw;
          })
        );

        // Group by subject
        const grouped = {};
        for (const hw of enriched) {
          const key = (hw.subject || "General").trim();
          if (!grouped[key]) {
            const meta = getMeta(key);
            grouped[key] = { id: key.toLowerCase().replace(/\s+/g, "-"), name: key, icon: meta.icon, color: meta.color, tasks: 0, homeworkList: [] };
          }
          grouped[key].tasks += 1;
          grouped[key].homeworkList.push({
            id: hw._id || hw.id || hw.submission_id,
            title: hw.title || hw.topic || `${key} Task`,
            subject: key,
            task_type: hw.task_type || "homework",
            deadline: hw.deadline,
            submitted_at: hw.submitted_at,
            submission_status: hw.submission_status,
            status: hw.status,
            is_late: hw.is_late || hw.submission_status === "late" || hw.status === "late",
            deadline_missed: hw.deadline_missed || hw.status === "deadline_missed",
            submission_score: hw.total_score ?? hw.submission_score,
            total_marks: hw.total_marks,
            percentage: hw.percentage,
            grade: hw.grade,
            breakdown: hw.breakdown || [],
          });
        }

        setSubjects(Object.values(grouped));
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load submitted tasks.");
        setLoading(false);
      });
  }, []);

  useEffect(() => { loadSubmitted(); }, [loadSubmitted]);

  // Split subjects into "recent" (submitted within RECENT_DAYS) and "old"
  const now = new Date();
  const cutoff = new Date(now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000);

  const recentSubjects = [];
  const oldSubjects = [];

  for (const subject of subjects) {
    const recentTasks = subject.homeworkList.filter(h => {
      if (!h.submitted_at) return true; // no date → treat as recent
      return new Date(h.submitted_at) >= cutoff;
    });
    const oldTasks = subject.homeworkList.filter(h => {
      if (!h.submitted_at) return false;
      return new Date(h.submitted_at) < cutoff;
    });

    if (recentTasks.length > 0) {
      recentSubjects.push({ ...subject, tasks: recentTasks.length, homeworkList: recentTasks });
    }
    if (oldTasks.length > 0) {
      oldSubjects.push({ ...subject, tasks: oldTasks.length, homeworkList: oldTasks });
    }
  }

  const totalSubmitted = subjects.reduce((s, sub) => s + sub.tasks, 0);
  const overallPct = totalSubmitted > 0
    ? Math.round(subjects.reduce((s, sub) => s + sub.homeworkList.reduce((a, h) => a + (h.percentage ?? 0), 0), 0) / totalSubmitted)
    : 0;

  if (loading) return (
    <div style={{ padding: "48px 40px", color: "#64748b", display: "flex", alignItems: "center", gap: 14 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 20, height: 20, border: "2.5px solid #1e293b", borderTopColor: "#60a5fa", borderRadius: "50%" }}
      />
      Loading submitted tasks…
    </div>
  );

  if (error) return (
    <div style={{ padding: "40px" }}>
      <div style={{
        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: 14, padding: "18px 24px", color: "#fca5a5", fontSize: 14, maxWidth: 480,
      }}>
        ⚠️ {error}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "40px 40px 60px", maxWidth: 800 }}>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 32 }}
      >
        <h1 style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 800, fontSize: 24,
          color: "#f1f5f9", margin: "0 0 8px",
        }}>
          Tasks Submitted
        </h1>
        {totalSubmitted > 0 && (
          <div style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#34d399", fontWeight: 600 }}>{totalSubmitted} task{totalSubmitted !== 1 ? "s" : ""} completed</span>
            <span>·</span>
            <span>Overall avg
              <span style={{ color: gradeColor(overallPct >= 90 ? "A+" : overallPct >= 80 ? "A" : overallPct >= 70 ? "B+" : overallPct >= 60 ? "B" : overallPct >= 50 ? "C" : "D"), fontWeight: 600, marginLeft: 4 }}>
                {overallPct}%
              </span>
            </span>
          </div>
        )}
      </motion.div>

      {/* ── RECENT SUBMISSIONS ── */}
      {recentSubjects.length === 0 && oldSubjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ color: "#475569", textAlign: "center", padding: "80px 0" }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#334155" }}>No submitted tasks yet.</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>
            Complete tasks from <strong style={{ color: "#60a5fa" }}>Tasks Assigned</strong> to see them here.
          </div>
        </motion.div>
      ) : (
        <>
          {recentSubjects.length > 0 ? (
            <>
              {/* Section label */}
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#475569",
                textTransform: "uppercase", letterSpacing: "0.1em",
                marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#34d399", display: "inline-block",
                }} />
                Recent — Last {RECENT_DAYS} days
              </div>
              {recentSubjects.map((subject, i) => (
                <SubjectGroup key={subject.id} subject={subject} index={i} />
              ))}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: "center", padding: "40px 0 20px",
                color: "#475569", fontSize: 14,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
              <div>No recent submissions in the last {RECENT_DAYS} days.</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Your older submissions are in the history below.</div>
            </motion.div>
          )}

          {/* ── OLD TASK HISTORY ── */}
          <OldTaskHistory subjects={oldSubjects} />
        </>
      )}
    </div>
  );
}
