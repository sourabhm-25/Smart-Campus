import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

/* ─── helpers ─── */
const scoreColor = (s) => s >= 90 ? "#34d399" : s >= 75 ? "#f59e0b" : "#f87171";
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.38, ease: [0.25, 1, 0.5, 1] },
});

const classColors = ["#818cf8", "#34d399", "#22d3ee", "#f59e0b", "#c084fc", "#fb7185"];

/* reusable glass card */
const GlassCard = ({ children, style = {}, delay = 0 }) => (
  <motion.div {...fadeUp(delay)} style={{
    borderRadius: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(8px)",
    padding: "22px 24px",
    ...style,
  }}>
    {children}
  </motion.div>
);

/* ═══════════════════════════════════════════
   LEVEL 3: HOMEWORK DETAIL (STUDENT SUBMISSIONS)
═══════════════════════════════════════════ */
function HomeworkDetail({ hw, cls, onBack }) {
  const graded  = (hw.students_data || []).filter(s => s.status === "graded" || s.status === "evaluated" || s.status === "reviewed");
  const scores  = graded.map(s => s.score).filter(s => s !== null && s !== undefined);
  const highest = scores.length ? Math.max(...scores) : 0;
  
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "—") return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch(e) {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
    >
      {/* Back button */}
      <motion.button
        {...fadeUp(0)}
        whileHover={{ x: -3 }}
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "none", border: "none", cursor: "pointer",
          color: "#475569", fontSize: 13, fontWeight: 600,
          marginBottom: 28, padding: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        ← Back to {cls.grade} Homeworks
      </motion.button>

      {/* Header */}
      <motion.div {...fadeUp(0.04)} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: `${hw.color}14`, border: `1px solid ${hw.color}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 800, color: hw.color,
        }}>HW</div>
        <div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 800,
            fontSize: "clamp(18px, 2.5vw, 22px)", color: "#fff",
            letterSpacing: "-0.03em", lineHeight: 1.2,
          }}>{hw.task}</h1>
          <p style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>
            Class: <span style={{ color: "#94a3b8" }}>{cls.grade} - {hw.subject}</span>
            &nbsp;·&nbsp;Due: <span style={{ color: "#94a3b8" }}>{hw.due}</span>
          </p>
        </div>
      </motion.div>

      {/* 4 stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Submitted",  value: `${hw.submitted} / ${hw.students}`, color: hw.color  },
          { label: "Pending",    value: hw.pending,                           color: "#f87171"  },
          { label: "Average",    value: hw.avg + "%",                         color: "#818cf8"  },
          { label: "Top Score",  value: highest + "%",                         color: "#34d399"  },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} {...fadeUp(0.08 + i * 0.04)} style={{
            borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: "18px 20px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
              background: `linear-gradient(90deg,transparent,${color}55,transparent)`,
            }} />
            <div style={{
              fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800,
              color, lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 8,
            }}>{value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Score distribution bar chart */}
      <GlassCard delay={0.16} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 16 }}>
          Score Distribution
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 60 }}>
          {[
            { range: "0–49",   count: graded.filter(s => s.score < 50).length,                   color: "#f87171" },
            { range: "50–59",  count: graded.filter(s => s.score >= 50 && s.score < 60).length,  color: "#fb923c" },
            { range: "60–69",  count: graded.filter(s => s.score >= 60 && s.score < 70).length,  color: "#f59e0b" },
            { range: "70–79",  count: graded.filter(s => s.score >= 70 && s.score < 80).length,  color: "#a3e635" },
            { range: "80–89",  count: graded.filter(s => s.score >= 80 && s.score < 90).length,  color: "#34d399" },
            { range: "90–100", count: graded.filter(s => s.score >= 90).length,                  color: "#818cf8" },
          ].map(({ range, count, color }) => (
            <div key={range} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: count === 0 ? 4 : `${Math.max(8, (count / Math.max(1, graded.length)) * 52)}px` }}
                transition={{ delay: 0.35, duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
                style={{
                  width: "100%", borderRadius: "4px 4px 0 0",
                  background: count === 0 ? "rgba(255,255,255,0.05)" : color,
                  opacity: count === 0 ? 0.3 : 1,
                }}
              />
              <span style={{ fontSize: 9, color: "#334155", textAlign: "center", lineHeight: 1.2 }}>{range}</span>
              {count > 0 && <span style={{ fontSize: 10, color, fontWeight: 700 }}>{count}</span>}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Student table */}
      <motion.div {...fadeUp(0.2)} style={{
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
      }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr 100px 155px 105px 90px",
          gap: 12, padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.02)",
        }}>
          {["#", "Student", "Score", "Submitted At", "Time Taken", "Status"].map(h => (
            <span key={h} style={{
              fontSize: 10, fontWeight: 700, color: "#334155",
              textTransform: "uppercase", letterSpacing: "0.07em",
            }}>{h}</span>
          ))}
        </div>

        {(hw.students_data || []).map((s, i) => {
          const sc = s.score;
          const isLast = i === (hw.students_data || []).length - 1;
          const statusColors = {
             graded: "#34d399", evaluated: "#34d399", reviewed: "#34d399",
             pending: "#f87171",
          };
          const statColor = statusColors[s.status] || "#f87171";
          
          return (
            <motion.div
              key={s.roll}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22 + i * 0.035, duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr 100px 155px 105px 90px",
                gap: 12, padding: "12px 20px",
                borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.045)",
                alignItems: "center",
                transition: "background 0.15s",
              }}
            >
              {/* Roll # */}
              <span style={{ fontSize: 11, color: "#334155", fontWeight: 600 }}>{s.roll}</span>

              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: sc !== null ? `${scoreColor(sc)}14` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${sc !== null ? scoreColor(sc) + "28" : "rgba(255,255,255,0.07)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: sc !== null ? scoreColor(sc) : "#334155",
                }}>{s.name.charAt(0)}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{s.name}</span>
              </div>

              {/* Score */}
              {sc !== null && sc !== undefined ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 800, color: scoreColor(sc) }}>{sc}%</span>
                  <div style={{ width: 24, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sc}%` }}
                      transition={{ delay: 0.35 + i * 0.03, duration: 0.5 }}
                      style={{ height: "100%", borderRadius: 99, background: scoreColor(sc) }}
                    />
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: 12, color: "#1e293b" }}>—</span>
              )}

              {/* Submitted at */}
              <span style={{ fontSize: 11, color: "#475569" }}>{formatDate(s.submitted_at)}</span>

              {/* Time taken */}
              <span style={{ fontSize: 11, color: s.time_taken && s.time_taken !== "—" ? "#94a3b8" : "#1e293b" }}>
                {s.time_taken && s.time_taken !== "—" ? "⏱ " : ""}{s.time_taken || "—"}
              </span>

              {/* Status badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 99, width: "fit-content",
                background: s.status === "pending" ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)",
                border: `1px solid ${s.status === "pending" ? "rgba(248,113,113,0.22)" : "rgba(52,211,153,0.22)"}`,
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: statColor,
                }} />
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                  color: statColor,
                }}>{s.status === "reviewed" || s.status === "evaluated" ? "graded" : s.status}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   LEVEL 2: HOMEWORKS FOR SELECTED CLASS
═══════════════════════════════════════════ */
function HomeworksOverview({ cls, homeworks, onSelect, onBack }) {
  if (!homeworks || homeworks.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, justifyContent: "center", alignItems: "center", height: "60vh", color: "#64748b" }}>
        <div>No homework assignments found for {cls.grade}.</div>
        <button onClick={onBack} style={{ padding: "8px 16px", background: "#334155", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>Back to Classes</button>
      </div>
    );
  }

  const [showHistory, setShowHistory] = useState(false);

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const activeHomeworks = homeworks.filter(hw => !hw.raw_due || hw.raw_due > now);
  const recentPastHomeworks = homeworks.filter(hw => hw.raw_due && hw.raw_due <= now && hw.raw_due >= sevenDaysAgo);
  const historyHomeworks = homeworks.filter(hw => hw.raw_due && hw.raw_due < sevenDaysAgo);

  const renderGrid = (list) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
      {list.map((hw, i) => {
        const pct = hw.students > 0 ? Math.round((hw.submitted / hw.students) * 100) : 0;
        return (
          <motion.div
            key={hw.id}
            {...fadeUp(0.1 + i * 0.06)}
            whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.13)" }}
            onClick={() => onSelect(hw)}
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "22px 24px",
              cursor: "pointer",
              transition: "border-color 0.2s, transform 0.18s",
              position: "relative", overflow: "hidden",
            }}
          >
            {/* top color accent */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg,transparent,${hw.color}55,transparent)`,
            }} />

            {/* Title & Subject */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 11, color: hw.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{hw.subject}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3 }}>{hw.task}</div>
              </div>
            </div>

            {/* Avg Score Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{
                padding: "4px 8px", borderRadius: 6,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                fontSize: 12, color: "#e2e8f0", fontWeight: 600,
              }}>
                Avg Score: <span style={{ color: hw.color }}>{hw.avg}%</span>
              </div>
            </div>

            {/* Submission progress */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Submissions</span>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{hw.submitted} / {hw.students}</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                  style={{ height: "100%", borderRadius: 99, background: hw.color }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                <span style={{ fontSize: 10, color: "#334155" }}>{pct}% submitted</span>
                <span style={{ fontSize: 10, color: "#f87171" }}>{hw.pending} pending</span>
              </div>
            </div>

            {/* Card footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "#475569" }}>Due {hw.due}</span>
              <span style={{ fontSize: 11, color: hw.color, fontWeight: 600 }}>View Submissions →</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
      {/* Back button */}
      <motion.button
        {...fadeUp(0)}
        whileHover={{ x: -3 }}
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "none", border: "none", cursor: "pointer",
          color: "#475569", fontSize: 13, fontWeight: 600,
          marginBottom: 28, padding: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        ← Back to Classes
      </motion.button>

      {/* Page heading */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 36, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 54, height: 54, borderRadius: 14, flexShrink: 0,
          background: `${cls.color}14`, border: `1px solid ${cls.color}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 800, color: cls.color,
        }}>{cls.grade || "C"}</div>
        <div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 800,
            fontSize: "clamp(20px, 3vw, 26px)", color: "#fff",
            letterSpacing: "-0.03em", marginBottom: 4,
          }}>Grade {cls.grade} Assignments</h1>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            {homeworks.length} assigned task{homeworks.length !== 1 ? 's' : ''} for {cls.subjects.join(", ") || "this class"}
          </p>
        </div>
      </motion.div>

      {/* Active Homeworks */}
      {activeHomeworks.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            Active / Upcoming
          </h2>
          {renderGrid(activeHomeworks)}
        </div>
      )}

      {/* Recent Past Homeworks */}
      {recentPastHomeworks.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            Past Due (Last 7 Days)
          </h2>
          {renderGrid(recentPastHomeworks)}
        </div>
      )}

      {/* History (Older than 7 days) */}
      {historyHomeworks.length > 0 && (
        <div>
          <div 
            onClick={() => setShowHistory(!showHistory)}
            style={{ 
              display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 16,
              fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" 
            }}
          >
            Past Activities (Older than 7 Days)
            <span style={{ fontSize: 10, marginTop: 2 }}>{showHistory ? "▼" : "▶"}</span>
          </div>
          {showHistory && renderGrid(historyHomeworks)}
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   LEVEL 1: CLASSES OVERVIEW
═══════════════════════════════════════════ */
function ClassesOverview({ classes, onSelect, loading }) {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#64748b" }}>
        Loading classes...
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#64748b" }}>
        No classes found.
      </div>
    );
  }

  const totalStudents  = classes.reduce((a, c) => a + c.student_count, 0);
  const totalHomeworks = classes.reduce((a, c) => a + c.totalAssigned, 0);
  const totalPending   = classes.reduce((a, c) => a + c.totalPending, 0);
  
  // Calc overall average from all homeworks across all classes
  let overallSum = 0;
  let hwCount = 0;
  classes.forEach(c => {
    c.homeworks.forEach(hw => {
      overallSum += hw.avg;
      hwCount++;
    });
  });
  const overallAvg = hwCount > 0 ? Math.round(overallSum / hwCount) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

      {/* Page heading */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
          Class Management
        </p>
        <h1 style={{
          fontFamily: "'Sora', sans-serif", fontWeight: 800,
          fontSize: "clamp(20px, 3vw, 26px)", color: "#fff",
          letterSpacing: "-0.03em", marginBottom: 6,
        }}>Classes</h1>
        <p style={{ fontSize: 13, color: "#334155" }}>
          {classes.length} assigned class{classes.length !== 1 ? 'es' : ''}
        </p>
      </motion.div>

      {/* Summary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Students", value: totalStudents,    color: "#818cf8" },
          { label: "Total Tasks",    value: totalHomeworks,   color: "#34d399" },
          { label: "Pending Tasks",  value: totalPending,     color: "#f87171" },
          { label: "Overall Avg",    value: overallAvg + "%", color: "#22d3ee" },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} {...fadeUp(0.04 + i * 0.04)} style={{
            borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: "20px 22px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
              background: `linear-gradient(90deg,transparent,${color}55,transparent)`,
            }} />
            <div style={{
              fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800,
              color, lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 8,
            }}>{value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Class cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {classes.map((cls, i) => {
          return (
            <motion.div
              key={cls.id}
              {...fadeUp(0.1 + i * 0.06)}
              whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.13)" }}
              onClick={() => onSelect(cls)}
              style={{
                borderRadius: 18,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                padding: "22px 24px",
                cursor: "pointer",
                transition: "border-color 0.2s, transform 0.18s",
                position: "relative", overflow: "hidden",
              }}
            >
              {/* top color accent */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg,transparent,${cls.color}55,transparent)`,
              }} />

              {/* Grade badge + class info */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                  background: `${cls.color}14`, border: `1px solid ${cls.color}28`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 800, color: cls.color,
                }}>{cls.grade || "C"}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{cls.grade ? `Grade ${cls.grade}` : 'Class'}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{cls.subjects.join(", ") || "No subjects"}</div>
                </div>
              </div>

              {/* Quick stats for class */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Students</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{cls.student_count}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Avg Score</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: cls.color }}>{cls.avgScore}%</div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: "#475569", display: "flex", justifyContent: "space-between" }}>
                <span>{cls.totalAssigned} Tasks Assigned</span>
                <span style={{ color: cls.color, fontWeight: 600 }}>View Homeworks →</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   ROOT
═══════════════════════════════════════════ */
export default function Submissions() {
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedHomework, setSelectedHomework] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch both classes and homeworks in parallel
        const [classesRes, hwRes] = await Promise.all([
          axios.get(`${API_BASE}/teacher/my-classes`, { headers }),
          axios.get(`${API_BASE}/teacher/homework`, { headers })
        ]);
        
        const rawClasses = classesRes.data.classes || [];
        const rawHomeworks = hwRes.data.homework || [];
        
        // Map homeworks
        const mappedHomeworks = rawHomeworks.map((hw, idx) => ({
          id: hw.id,
          class_id: hw.class_id,
          grade: hw.grade,
          subject: hw.subject,
          task: hw.title,
          students: hw.student_count,
          submitted: hw.submission_count,
          pending: hw.student_count - hw.submission_count,
          avg: hw.avg_score || 0,
          color: classColors[idx % classColors.length],
          due: hw.deadline ? new Date(hw.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No deadline",
          raw_due: hw.deadline ? new Date(hw.deadline).getTime() : null,
          students_data: [] // Fetched later
        }));

        // Map classes & enrich with homework stats
        const enrichedClasses = rawClasses.map((cls, idx) => {
          const clsHws = mappedHomeworks.filter(h => h.class_id === cls.id);
          const totalAssigned = clsHws.length;
          const totalPending = clsHws.reduce((a, c) => a + c.pending, 0);
          const totalSubmitted = clsHws.reduce((a, c) => a + c.submitted, 0);
          const avgScore = clsHws.length > 0 ? Math.round(clsHws.reduce((a, c) => a + c.avg, 0) / clsHws.length) : 0;
          
          return {
            id: cls.id,
            grade: cls.grade,
            subjects: cls.my_subjects || [],
            student_count: cls.student_count || 0,
            color: classColors[idx % classColors.length],
            totalAssigned,
            totalPending,
            totalSubmitted,
            avgScore,
            homeworks: clsHws
          };
        });
        
        setClassesData(enrichedClasses);
      } catch (err) {
        console.error("Failed to fetch classes/homeworks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleHomeworkSelect = async (hw) => {
    // Fetch detailed submissions for the selected homework
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_BASE}/teacher/homework/${hw.id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const mappedStudents = res.data.submissions.map((sub, idx) => ({
        name: sub.student_name,
        roll: (idx + 1).toString().padStart(2, '0'),
        score: sub.percentage !== null ? sub.percentage : null,
        submitted_at: sub.submitted_at ? sub.submitted_at : "—",
        time_taken: "—",
        status: sub.status,
      }));
      
      const updatedHw = { ...hw, students_data: mappedStudents };
      setSelectedHomework(updatedHw);
      
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      setSelectedHomework(hw);
    }
  };

  return (
    <div style={{
      padding: "36px 40px 60px",
      maxWidth: 1200,
      fontFamily: "'DM Sans', sans-serif",
      color: "#e2e8f0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <AnimatePresence mode="wait">
        {selectedHomework ? (
          <HomeworkDetail 
            key="detail" 
            hw={selectedHomework} 
            cls={selectedClass} 
            onBack={() => setSelectedHomework(null)} 
          />
        ) : selectedClass ? (
          <HomeworksOverview 
            key="homeworks" 
            cls={selectedClass} 
            homeworks={selectedClass.homeworks} 
            onSelect={handleHomeworkSelect} 
            onBack={() => setSelectedClass(null)} 
          />
        ) : (
          <ClassesOverview 
            key="classes" 
            classes={classesData} 
            onSelect={setSelectedClass} 
            loading={loading} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}