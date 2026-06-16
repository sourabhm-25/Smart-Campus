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

const gradeColor = { "A+": "#064e3b", A: "#1a7a5e", "B+": "#1e3a8a", B: "#1d4ed8", C: "#92400e", D: "#9a3412", F: "#9f1239" };
const gradeBg    = { "A+": "#d1fae5", A: "#dcfce7", "B+": "#dbeafe", B: "#eff6ff", C: "#fef3c7", D: "#ffedd5", F: "#ffe4e6" };
const gradeBorder= { "A+": "#059669", A: "#34d399", "B+": "#3b82f6", B: "#60a5fa", C: "#fbbf24", D: "#fb923c", F: "#f472b6" };

function getGrade(pct) {
  return pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 40 ? "D" : "F";
}

// ── Score ring ────────────────────────────────────────────
function ScoreRing({ pct, color, size = 52 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0, transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={6} />
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
        fill={color} fontSize={size < 50 ? 9 : 10} fontWeight={900}
        style={{ transform: "rotate(90deg)", transformOrigin: "50% 50%", fontFamily: "'DM Sans', sans-serif" }}
      >
        {pct}%
      </text>
    </svg>
  );
}

// ── Submitted task card ───────────────────────────────────
function SubmittedCard({ task, color, index }) {
  const [expanded, setExpanded] = useState(false);
  let pct = task.percentage ?? Math.round(((task.submission_score ?? 0) / (task.total_marks || 1)) * 100);
  if (isNaN(pct)) pct = 0;

  let grade = task.grade;
  if (!grade || !isNaN(grade) || !/^[A-F][+-]?$/.test(String(grade).toUpperCase())) {
    grade = getGrade(pct);
  } else {
    grade = String(grade).toUpperCase();
  }

  const gc = gradeColor[grade] || "#1d4ed8";
  const gb = gradeBg[grade] || "#dbeafe";
  const gborder = gradeBorder[grade] || "#60a5fa";

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
        background: "#ffffff",
        border: "3px solid #071521",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 12,
        boxShadow: "3px 3px 0 #8bb7d8",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "stretch", minHeight: 80 }}>
        {/* Accent */}
        <div style={{ width: 6, background: `linear-gradient(180deg, ${color}, ${gborder})`, flexShrink: 0 }} />

        {/* Content */}
        <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#071521", marginBottom: 6, lineHeight: 1.4 }}>
                {task.title}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{
                  fontSize: 11, fontWeight: 800, color: "#071521",
                  background: `${color}25`, border: `2px solid ${color}`,
                  borderRadius: 6, padding: "1px 8px", textTransform: "capitalize",
                }}>
                  {task.task_type}
                </span>
                {submittedAt && (
                  <span style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 700 }}>Submitted {submittedAt}</span>
                )}
                {(task.is_late || task.submission_status === "late" || task.status === "late") && !task.deadline_missed && (
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: "#92400e",
                    background: "#fef3c7", border: "2px solid #fbbf24",
                    borderRadius: 6, padding: "1px 8px",
                  }}>⏰ Late</span>
                )}
                {(task.deadline_missed || task.status === "deadline_missed") && (
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: "#991b1b",
                    background: "#fee2e2", border: "2px solid #f87171",
                    borderRadius: 6, padding: "1px 8px",
                  }}>⛔ Missed</span>
                )}
              </div>
            </div>

            {/* Score + Grade */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <ScoreRing pct={pct} color={gborder} size={52} />
              <div style={{
                width: 44, height: 44, borderRadius: 8,
                background: gb, border: `3px solid ${gborder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 900, color: gc,
                fontFamily: "'Sora', sans-serif",
              }}>
                {grade}
              </div>
            </div>
          </div>

          {/* Score bar + expand toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, background: "#e8f0f8", borderRadius: 6, overflow: "hidden", border: "2px solid #d8e8f4" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                  style={{ height: "100%", background: gborder, borderRadius: 4 }}
                />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#3F6E8F", marginTop: 4 }}>
                {task.submission_score ?? "?"} / {task.total_marks ?? "?"} marks
              </div>
            </div>

            {task.breakdown?.length > 0 && (
              <button
                onClick={() => setExpanded(e => !e)}
                style={{
                  background: "#d8e8f4", border: "2px solid #071521",
                  borderRadius: 8, padding: "5px 14px",
                  fontSize: 11, fontWeight: 800, color: "#071521",
                  cursor: "pointer", boxShadow: "2px 2px 0 #8bb7d8",
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "'DM Sans', sans-serif",
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
              borderTop: "3px solid #071521",
              padding: "16px 20px",
              display: "flex", flexDirection: "column", gap: 10,
              background: "#f8fafc",
            }}>
              {task.breakdown.map((q, qi) => (
                <div key={qi} style={{
                  background: "#ffffff", border: "2px solid #d8e8f4",
                  borderRadius: 8, padding: "12px 14px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#071521", marginBottom: 4, lineHeight: 1.5 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 900, color: "#071521",
                          background: `${color}25`, border: `2px solid ${color}`,
                          borderRadius: 4, padding: "1px 7px", marginRight: 8,
                        }}>Q{qi + 1}</span>
                        {q.question}
                      </div>
                      {q.feedback && (
                        <div style={{
                          fontSize: 11, fontWeight: 700,
                          color: q.score === q.max_marks ? "#065f46" : q.score > 0 ? "#92400e" : "#991b1b",
                          marginTop: 4, padding: "6px 10px",
                          background: q.score === q.max_marks ? "#d1fae5" : q.score > 0 ? "#fef3c7" : "#fee2e2",
                          borderRadius: 6, lineHeight: 1.5,
                        }}>
                          {q.score === q.max_marks ? "✓" : q.score > 0 ? "◑" : "✗"} {q.feedback}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 900, flexShrink: 0,
                      color: q.score === q.max_marks ? "#065f46" : q.score > 0 ? "#92400e" : "#991b1b",
                      background: q.score === q.max_marks ? "#d1fae5" : q.score > 0 ? "#fef3c7" : "#fee2e2",
                      border: `2px solid ${q.score === q.max_marks ? "#34d399" : q.score > 0 ? "#fbbf24" : "#f87171"}`,
                      borderRadius: 8, padding: "4px 10px",
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

// ── Subject group ─────────────────────────────────────────
const PASTEL_BG = ["#d8e8f4", "#f1d8e6", "#fff0b8", "#d1fae5", "#ede9fe", "#fce7f3"];
const SHADOW_COLORS = ["#8bb7d8", "#d8a0c4", "#f4d98e", "#6ee7b7", "#c4b5fd", "#f9a8d4"];

function SubjectGroup({ subject, index }) {
  const [open, setOpen] = useState(true);
  const { color } = subject;
  const bg = PASTEL_BG[index % PASTEL_BG.length];
  const shadow = SHADOW_COLORS[index % SHADOW_COLORS.length];
  const avgPct = subject.tasks > 0
    ? Math.round(subject.homeworkList.reduce((s, h) => s + (isNaN(h.percentage) ? 0 : (h.percentage ?? 0)), 0) / subject.tasks)
    : 0;
  const avgGrade = getGrade(avgPct);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: open ? bg : "#ffffff",
        border: "4px solid #071521",
        borderRadius: 12, overflow: "hidden", marginBottom: 16,
        boxShadow: `6px 6px 0 ${shadow}`,
        transition: "background 0.2s",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 22px", cursor: "pointer", userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 10,
            background: "#ffffff", border: "3px solid #071521",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: "2px 2px 0 #071521",
          }}>
            {subject.icon}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#071521", fontFamily: "'Sora', sans-serif" }}>
              {subject.name}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1C3F57", marginTop: 2 }}>
              {subject.tasks} submitted · Avg {avgPct}%
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            background: gradeBg[avgGrade] || "#dbeafe",
            border: `3px solid ${gradeBorder[avgGrade] || "#60a5fa"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color: gradeColor[avgGrade] || "#1d4ed8",
            fontFamily: "'Sora', sans-serif",
          }}>
            {avgGrade}
          </div>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            style={{ color: "#071521", fontSize: 14 }}
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
            <div style={{ borderTop: "3px solid #071521", padding: "16px 18px", background: "#ffffff" }}>
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

// ── Old Task History Panel ────────────────────────────────
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
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: open ? "#d8e8f4" : "#ffffff",
          border: "4px solid #071521",
          borderRadius: open ? "12px 12px 0 0" : 12,
          padding: "16px 22px", cursor: "pointer",
          boxShadow: open ? "none" : "4px 4px 0 #8bb7d8",
          transition: "all 0.2s",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>📂</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#071521", fontFamily: "'Sora', sans-serif" }}>
              Old Task History
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1C3F57", marginTop: 2 }}>
              {totalOld} past task{totalOld !== 1 ? "s" : ""} · Click to {open ? "collapse" : "expand"}
            </div>
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ color: "#071521", fontSize: 16 }}
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
              background: "#f8fafc",
              border: "4px solid #071521",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              padding: "20px 18px 8px",
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

// ── Main Page ─────────────────────────────────────────────
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
        const submittedHw = (data.homework || []).filter(hw => hw.submitted);

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

        const grouped = {};
        for (const hw of enriched) {
          const key = (hw.subject ? String(hw.subject) : "General").trim();
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

  const now = new Date();
  const cutoff = new Date(now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000);

  const recentSubjects = [];
  const oldSubjects = [];

  for (const subject of subjects) {
    const recentTasks = subject.homeworkList.filter(h => {
      if (!h.submitted_at) return true;
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
    ? Math.round(subjects.reduce((s, sub) => s + sub.homeworkList.reduce((a, h) => a + (isNaN(h.percentage) ? 0 : (h.percentage ?? 0)), 0), 0) / totalSubmitted)
    : 0;
  const overallGrade = getGrade(overallPct);

  if (loading) return (
    <div style={{ padding: "48px 40px", color: "#3F6E8F", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 14, fontWeight: 800 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 20, height: 20, border: "3px solid #d8e8f4", borderTopColor: "#3F6E8F", borderRadius: "50%" }}
      />
      Loading submitted tasks…
    </div>
  );

  if (error) return (
    <div style={{ padding: "40px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{
        background: "#fee2e2", border: "4px solid #f87171",
        borderRadius: 12, padding: "18px 24px", color: "#991b1b",
        fontSize: 14, fontWeight: 800, maxWidth: 480,
        boxShadow: "4px 4px 0 #fca5a5",
      }}>
        ⚠️ {error}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "36px 36px 60px", maxWidth: 820, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=Sora:wght@600;700;800;900&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px",
          background: "linear-gradient(135deg, #f1d8e6, #d8e8f4)",
          border: "4px solid #071521",
          borderRadius: 12,
          boxShadow: "6px 6px 0 #8bb7d8",
          marginBottom: 24,
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 900, fontSize: 22,
              color: "#071521", margin: "0 0 6px",
            }}>
              ✅ Tasks Submitted
            </h1>
            {totalSubmitted > 0 && (
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1C3F57", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#15803d", fontWeight: 900 }}>{totalSubmitted} task{totalSubmitted !== 1 ? "s" : ""} completed</span>
                <span>·</span>
                <span>Overall avg <span style={{ color: gradeColor[overallGrade] || "#1d4ed8", fontWeight: 900 }}>{overallPct}%</span></span>
              </div>
            )}
          </div>
          {totalSubmitted > 0 && (
            <div style={{
              width: 52, height: 52, borderRadius: 8,
              background: gradeBg[overallGrade] || "#dbeafe",
              border: `4px solid ${gradeBorder[overallGrade] || "#60a5fa"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 900, color: gradeColor[overallGrade] || "#1d4ed8",
              fontFamily: "'Sora', sans-serif",
              boxShadow: "3px 3px 0 #071521",
            }}>
              {overallGrade}
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      {recentSubjects.length === 0 && oldSubjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: "center", padding: "60px 0",
            background: "#ffffff",
            border: "4px dashed #071521",
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#071521", fontFamily: "'Sora', sans-serif" }}>No submitted tasks yet.</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8, color: "#3F6E8F" }}>
            Complete tasks from <strong style={{ color: "#1d4ed8" }}>Tasks Assigned</strong> to see them here.
          </div>
        </motion.div>
      ) : (
        <>
          {recentSubjects.length > 0 ? (
            <>
              {/* Section label */}
              <div style={{
                fontSize: 11, fontWeight: 900, color: "#1C3F57",
                textTransform: "uppercase", letterSpacing: "0.1em",
                marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#34d399", border: "2px solid #071521", display: "inline-block",
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
                background: "#ffffff", border: "4px dashed #071521",
                borderRadius: 12, marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#071521" }}>No recent submissions in the last {RECENT_DAYS} days.</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: "#3F6E8F" }}>Your older submissions are in the history below.</div>
            </motion.div>
          )}

          {/* Old Task History */}
          <OldTaskHistory subjects={oldSubjects} />
        </>
      )}
    </div>
  );
}
