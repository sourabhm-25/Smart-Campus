import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

/* ─── helpers ─── */
const scoreColor  = (s) => s >= 90 ? "#15803d" : s >= 75 ? "#b45309" : "#b91c1c";
const scoreBg     = (s) => s >= 90 ? "#d1fae5" : s >= 75 ? "#fef3c7" : "#fee2e2";
const scoreBorder = (s) => s >= 90 ? "#34d399" : s >= 75 ? "#f59e0b" : "#f87171";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.38, ease: [0.25, 1, 0.5, 1] },
});

const classColors = ["#8bb7d8", "#34d399", "#f6b94c", "#d8a0c4", "#a78bfa", "#fb7185"];
const classBgs    = ["#d8e8f4", "#d1fae5", "#FFECA8", "#f1d8e6", "#ede9fe", "#fee2e2"];

/* ─── Shared Card ─── */
const NeoCard = ({ children, style = {}, delay = 0 }) => (
  <motion.div {...fadeUp(delay)} style={{
    borderRadius: 16,
    background: "#ffffff",
    border: "4px solid #071521",
    boxShadow: "6px 6px 0 #8bb7d8",
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
    } catch(e) { return dateStr; }
  };

  const statTiles = [
    { label: "Submitted",  value: `${hw.submitted} / ${hw.students}`, bg: "#d8e8f4",  border: "#8bb7d8"  },
    { label: "Pending",    value: hw.pending,                          bg: "#fee2e2",  border: "#f87171"  },
    { label: "Average",    value: hw.avg + "%",                        bg: "#FFECA8",  border: "#f6b94c"  },
    { label: "Top Score",  value: highest + "%",                       bg: "#d1fae5",  border: "#34d399"  },
  ];

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
          background: "#FFECA8", border: "3px solid #071521", borderRadius: 10,
          cursor: "pointer", color: "#071521", fontSize: 13, fontWeight: 800,
          marginBottom: 28, padding: "8px 16px",
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: "3px 3px 0 #071521",
        }}
      >
        ← Back to {cls.grade} Homeworks
      </motion.button>

      {/* Header */}
      <motion.div {...fadeUp(0.04)} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{
          width: 50, height: 50, borderRadius: 12, flexShrink: 0,
          background: "#d8e8f4", border: "3px solid #071521",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 900, color: "#273c75",
          boxShadow: "3px 3px 0 #071521",
        }}>HW</div>
        <div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 900,
            fontSize: "clamp(18px, 2.5vw, 22px)", color: "#071521",
            letterSpacing: "-0.02em", lineHeight: 1.2,
          }}>{hw.task}</h1>
          <p style={{ fontSize: 12, color: "#3F6E8F", marginTop: 4, fontWeight: 700 }}>
            Class: <strong>{cls.grade}</strong> · Subject: <strong>{hw.subject}</strong> · Due: <strong>{hw.due}</strong>
          </p>
        </div>
      </motion.div>

      {/* 4 stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {statTiles.map(({ label, value, bg, border }, i) => (
          <motion.div key={label} {...fadeUp(0.08 + i * 0.04)} style={{
            borderRadius: 14, background: bg,
            border: `4px solid #071521`,
            boxShadow: "4px 4px 0 #071521",
            padding: "18px 20px",
          }}>
            <div style={{
              fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 900,
              color: "#071521", lineHeight: 1, marginBottom: 8,
            }}>{value}</div>
            <div style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Score distribution bar chart */}
      <NeoCard delay={0.16} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
          Score Distribution
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 68 }}>
          {[
            { range: "0–49",   count: graded.filter(s => s.score < 50).length,                   color: "#b91c1c", bg: "#fee2e2" },
            { range: "50–59",  count: graded.filter(s => s.score >= 50 && s.score < 60).length,  color: "#c2410c", bg: "#ffedd5" },
            { range: "60–69",  count: graded.filter(s => s.score >= 60 && s.score < 70).length,  color: "#b45309", bg: "#fef3c7" },
            { range: "70–79",  count: graded.filter(s => s.score >= 70 && s.score < 80).length,  color: "#4d7c0f", bg: "#ecfccb" },
            { range: "80–89",  count: graded.filter(s => s.score >= 80 && s.score < 90).length,  color: "#15803d", bg: "#d1fae5" },
            { range: "90–100", count: graded.filter(s => s.score >= 90).length,                  color: "#1e40af", bg: "#dbeafe" },
          ].map(({ range, count, color, bg }) => (
            <div key={range} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: count === 0 ? 4 : `${Math.max(8, (count / Math.max(1, graded.length)) * 52)}px` }}
                transition={{ delay: 0.35, duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
                style={{
                  width: "100%", borderRadius: "4px 4px 0 0",
                  background: count === 0 ? "rgba(7,21,33,0.06)" : color,
                  border: count > 0 ? `2px solid #071521` : "2px solid rgba(7,21,33,0.1)",
                  opacity: count === 0 ? 0.4 : 1,
                }}
              />
              <span style={{ fontSize: 9, color: "#3F6E8F", textAlign: "center", lineHeight: 1.2, fontWeight: 800 }}>{range}</span>
              {count > 0 && <span style={{ fontSize: 10, color, fontWeight: 900 }}>{count}</span>}
            </div>
          ))}
        </div>
      </NeoCard>

      {/* Student table */}
      <NeoCard delay={0.2} style={{ padding: 0, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr 100px 155px 105px 90px",
          gap: 12, padding: "12px 20px",
          borderBottom: "3px solid #071521",
          background: "#FFECA8",
        }}>
          {["#", "Student", "Score", "Submitted At", "Time Taken", "Status"].map(h => (
            <span key={h} style={{
              fontSize: 10, fontWeight: 900, color: "#071521",
              textTransform: "uppercase", letterSpacing: "0.07em",
            }}>{h}</span>
          ))}
        </div>

        {(hw.students_data || []).map((s, i) => {
          const sc = s.score;
          const isLast = i === (hw.students_data || []).length - 1;
          const isGraded = s.status === "graded" || s.status === "evaluated" || s.status === "reviewed";

          return (
            <motion.div
              key={s.roll}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22 + i * 0.035, duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(246,185,76,0.15)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr 100px 155px 105px 90px",
                gap: 12, padding: "13px 20px",
                borderBottom: isLast ? "none" : "2px dashed rgba(7,21,33,0.1)",
                alignItems: "center",
                transition: "background 0.15s",
              }}
            >
              {/* Roll # */}
              <span style={{ fontSize: 12, color: "#3F6E8F", fontWeight: 800 }}>{s.roll}</span>

              {/* Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: sc !== null ? scoreBg(sc) : "#f1f5f9",
                  border: `2px solid ${sc !== null ? scoreBorder(sc) : "#071521"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 900, color: sc !== null ? scoreColor(sc) : "#071521",
                  boxShadow: "1px 1px 0 #071521",
                }}>{s.name.charAt(0)}</div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#071521" }}>{s.name}</span>
              </div>

              {/* Score */}
              {sc !== null && sc !== undefined ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 900,
                    color: scoreColor(sc), background: scoreBg(sc),
                    border: `2px solid ${scoreBorder(sc)}`, borderRadius: 8,
                    padding: "2px 8px",
                  }}>{sc}%</span>
                </div>
              ) : (
                <span style={{ fontSize: 12, color: "#3F6E8F", fontWeight: 700 }}>—</span>
              )}

              {/* Submitted at */}
              <span style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 700 }}>{formatDate(s.submitted_at)}</span>

              {/* Time taken */}
              <span style={{ fontSize: 11, color: s.time_taken && s.time_taken !== "—" ? "#273c75" : "#3F6E8F", fontWeight: 700 }}>
                {s.time_taken && s.time_taken !== "—" ? "⏱ " : ""}{s.time_taken || "—"}
              </span>

              {/* Status badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 8, width: "fit-content",
                background: isGraded ? "#d1fae5" : "#fee2e2",
                border: `2px solid ${isGraded ? "#34d399" : "#f87171"}`,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: isGraded ? "#15803d" : "#b91c1c" }} />
                <span style={{
                  fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em",
                  color: isGraded ? "#15803d" : "#b91c1c",
                }}>{isGraded ? "graded" : s.status}</span>
              </div>
            </motion.div>
          );
        })}
      </NeoCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   LEVEL 2: HOMEWORKS FOR SELECTED CLASS
═══════════════════════════════════════════ */
function HomeworksOverview({ cls, homeworks, onSelect, onBack }) {
  const [showHistory, setShowHistory] = useState(false);

  if (!homeworks || homeworks.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, justifyContent: "center", alignItems: "center", height: "60vh", color: "#3F6E8F" }}>
        <div style={{ fontSize: 40 }}>📭</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#071521" }}>No homework assignments found for {cls.grade}.</div>
        <button onClick={onBack} style={{
          padding: "10px 22px", background: "#FFECA8", color: "#071521",
          border: "3px solid #071521", borderRadius: 10, cursor: "pointer",
          fontWeight: 900, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          boxShadow: "3px 3px 0 #071521",
        }}>← Back to Classes</button>
      </div>
    );
  }

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const activeHomeworks      = homeworks.filter(hw => !hw.raw_due || hw.raw_due > now);
  const recentPastHomeworks  = homeworks.filter(hw => hw.raw_due && hw.raw_due <= now && hw.raw_due >= sevenDaysAgo);
  const historyHomeworks     = homeworks.filter(hw => hw.raw_due && hw.raw_due < sevenDaysAgo);

  const renderGrid = (list) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
      {list.map((hw, i) => {
        const pct = hw.students > 0 ? Math.round((hw.submitted / hw.students) * 100) : 0;
        return (
          <motion.div
            key={hw.id}
            {...fadeUp(0.1 + i * 0.06)}
            whileHover={{ y: -3, boxShadow: "8px 8px 0 #d8a0c4" }}
            onClick={() => onSelect(hw)}
            style={{
              borderRadius: 18,
              background: "#ffffff",
              border: "4px solid #071521",
              boxShadow: "6px 6px 0 #071521",
              padding: "22px 24px",
              cursor: "pointer",
              transition: "all 0.18s",
              position: "relative", overflow: "hidden",
            }}
          >
            {/* top color accent */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 4,
              background: hw.color,
            }} />

            {/* Title & Subject */}
            <div style={{ marginBottom: 18, marginTop: 6 }}>
              <div style={{ fontSize: 11, color: hw.color === "#8bb7d8" ? "#1e40af" : "#273c75", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{hw.subject}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#071521", lineHeight: 1.3 }}>{hw.task}</div>
            </div>

            {/* Avg Score Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{
                padding: "4px 12px", borderRadius: 8,
                background: "#FFECA8", border: "2px solid #071521",
                fontSize: 12, color: "#071521", fontWeight: 900,
                boxShadow: "2px 2px 0 #071521",
              }}>
                Avg: <span style={{ color: "#273c75" }}>{hw.avg}%</span>
              </div>
            </div>

            {/* Submission progress */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 11, color: "#071521", fontWeight: 800 }}>Submissions</span>
                <span style={{ fontSize: 11, color: "#273c75", fontWeight: 900 }}>{hw.submitted} / {hw.students}</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(7,21,33,0.08)", overflow: "hidden", border: "1px solid rgba(7,21,33,0.1)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                  style={{ height: "100%", borderRadius: 99, background: hw.color }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: "#3F6E8F", fontWeight: 800 }}>{pct}% submitted</span>
                <span style={{ fontSize: 10, color: "#b91c1c", fontWeight: 900 }}>{hw.pending} pending</span>
              </div>
            </div>

            {/* Card footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "#3F6E8F", fontWeight: 800 }}>Due {hw.due}</span>
              <span style={{ fontSize: 11, color: "#071521", fontWeight: 900, background: "#FFECA8", border: "2px solid #071521", borderRadius: 8, padding: "3px 10px" }}>View →</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const sectionLabel = (text) => (
    <h2 style={{ fontSize: 11, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, padding: "6px 12px", background: "#FFECA8", border: "2px solid #071521", borderRadius: 8, display: "inline-block" }}>
      {text}
    </h2>
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
          background: "#FFECA8", border: "3px solid #071521", borderRadius: 10,
          cursor: "pointer", color: "#071521", fontSize: 13, fontWeight: 800,
          marginBottom: 28, padding: "8px 16px",
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: "3px 3px 0 #071521",
        }}
      >
        ← Back to Classes
      </motion.button>

      {/* Page heading */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 36, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 54, height: 54, borderRadius: 14, flexShrink: 0,
          background: "#d8e8f4", border: "4px solid #071521",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 900, color: "#273c75",
          boxShadow: "4px 4px 0 #071521",
        }}>{cls.grade || "C"}</div>
        <div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 900,
            fontSize: "clamp(20px, 3vw, 26px)", color: "#071521",
            marginBottom: 4,
          }}>Grade {cls.grade} Assignments</h1>
          <p style={{ fontSize: 13, color: "#3F6E8F", fontWeight: 700 }}>
            {homeworks.length} assigned task{homeworks.length !== 1 ? "s" : ""} for {cls.subjects.join(", ") || "this class"}
          </p>
        </div>
      </motion.div>

      {activeHomeworks.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          {sectionLabel("Active / Upcoming")}
          {renderGrid(activeHomeworks)}
        </div>
      )}

      {recentPastHomeworks.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          {sectionLabel("Past Due (Last 7 Days)")}
          {renderGrid(recentPastHomeworks)}
        </div>
      )}

      {historyHomeworks.length > 0 && (
        <div>
          <div
            onClick={() => setShowHistory(!showHistory)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 16,
              fontSize: 11, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.08em",
              padding: "6px 12px", background: "#f1d8e6", border: "2px solid #071521", borderRadius: 8,
            }}
          >
            Past Activities (Older than 7 Days)
            <span style={{ fontSize: 10 }}>{showHistory ? "▼" : "▶"}</span>
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
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "60vh", gap: 12 }}>
        <div style={{ fontSize: 32 }}>⏳</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#3F6E8F" }}>Loading classes...</div>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "60vh", gap: 12 }}>
        <div style={{ fontSize: 40 }}>📭</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#071521" }}>No classes found.</div>
      </div>
    );
  }

  const totalStudents  = classes.reduce((a, c) => a + c.student_count, 0);
  const totalHomeworks = classes.reduce((a, c) => a + c.totalAssigned, 0);
  const totalPending   = classes.reduce((a, c) => a + c.totalPending, 0);

  let overallSum = 0, hwCount = 0;
  classes.forEach(c => { c.homeworks.forEach(hw => { overallSum += hw.avg; hwCount++; }); });
  const overallAvg = hwCount > 0 ? Math.round(overallSum / hwCount) : 0;

  const summaryTiles = [
    { label: "Total Students", value: totalStudents,     bg: "#d8e8f4", border: "#8bb7d8" },
    { label: "Total Tasks",    value: totalHomeworks,    bg: "#d1fae5", border: "#34d399" },
    { label: "Pending Tasks",  value: totalPending,      bg: "#fee2e2", border: "#f87171" },
    { label: "Overall Avg",    value: overallAvg + "%",  bg: "#FFECA8", border: "#f6b94c" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

      {/* Page heading */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 900, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
          Class Management
        </p>
        <h1 style={{
          fontFamily: "'Sora', sans-serif", fontWeight: 900,
          fontSize: "clamp(20px, 3vw, 26px)", color: "#071521", marginBottom: 4,
        }}>Classes</h1>
        <p style={{ fontSize: 13, color: "#3F6E8F", fontWeight: 700 }}>
          {classes.length} assigned class{classes.length !== 1 ? "es" : ""}
        </p>
      </motion.div>

      {/* Summary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {summaryTiles.map(({ label, value, bg, border }, i) => (
          <motion.div key={label} {...fadeUp(0.04 + i * 0.04)} style={{
            borderRadius: 14, background: bg,
            border: "4px solid #071521",
            boxShadow: "4px 4px 0 #071521",
            padding: "20px 22px",
          }}>
            <div style={{
              fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 900,
              color: "#071521", lineHeight: 1, marginBottom: 8,
            }}>{value}</div>
            <div style={{ fontSize: 10, color: "#3F6E8F", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Class cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {classes.map((cls, i) => {
          const accentColor = classColors[i % classColors.length];
          const accentBg    = classBgs[i % classBgs.length];
          return (
            <motion.div
              key={cls.id}
              {...fadeUp(0.1 + i * 0.06)}
              whileHover={{ y: -3, boxShadow: "8px 8px 0 #d8a0c4" }}
              onClick={() => onSelect(cls)}
              style={{
                borderRadius: 18,
                background: "#ffffff",
                border: "4px solid #071521",
                boxShadow: "6px 6px 0 #071521",
                padding: "22px 24px",
                cursor: "pointer",
                transition: "all 0.18s",
                position: "relative", overflow: "hidden",
              }}
            >
              {/* top color accent bar */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: accentColor }} />

              {/* Grade badge + class info */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, marginTop: 6 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                  background: accentBg, border: "3px solid #071521",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 900, color: "#071521",
                  boxShadow: "3px 3px 0 #071521",
                }}>{cls.grade || "C"}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#071521" }}>{cls.grade ? `Grade ${cls.grade}` : "Class"}</div>
                  <div style={{ fontSize: 12, color: "#3F6E8F", marginTop: 3, fontWeight: 700 }}>{cls.subjects.join(", ") || "No subjects"}</div>
                </div>
              </div>

              {/* Quick stats for class */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "#FFF5D6", padding: "10px", borderRadius: 10, border: "2px solid #071521" }}>
                  <div style={{ fontSize: 10, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontWeight: 800 }}>Students</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#071521" }}>{cls.student_count}</div>
                </div>
                <div style={{ background: accentBg, padding: "10px", borderRadius: 10, border: "2px solid #071521" }}>
                  <div style={{ fontSize: 10, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontWeight: 800 }}>Avg Score</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#071521" }}>{cls.avgScore}%</div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: "#071521", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800 }}>{cls.totalAssigned} Tasks Assigned</span>
                <span style={{ color: "#071521", fontWeight: 900, background: "#FFECA8", border: "2px solid #071521", borderRadius: 8, padding: "3px 10px", fontSize: 11 }}>
                  View Homeworks →
                </span>
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
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedHomework, setSelectedHomework] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = { Authorization: `Bearer ${token}` };

        const [classesRes, hwRes] = await Promise.all([
          axios.get(`${API_BASE}/teacher/my-classes`, { headers }),
          axios.get(`${API_BASE}/teacher/homework`, { headers })
        ]);

        const rawClasses   = classesRes.data.classes || [];
        const rawHomeworks = hwRes.data.homework || [];

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
          students_data: [],
        }));

        const enrichedClasses = rawClasses.map((cls, idx) => {
          const clsHws        = mappedHomeworks.filter(h => h.class_id === cls.id);
          const totalAssigned  = clsHws.length;
          const totalPending   = clsHws.reduce((a, c) => a + c.pending, 0);
          const totalSubmitted = clsHws.reduce((a, c) => a + c.submitted, 0);
          const avgScore       = clsHws.length > 0 ? Math.round(clsHws.reduce((a, c) => a + c.avg, 0) / clsHws.length) : 0;
          return {
            id: cls.id,
            grade: cls.grade,
            subjects: cls.my_subjects || [],
            student_count: cls.student_count || 0,
            color: classColors[idx % classColors.length],
            totalAssigned, totalPending, totalSubmitted, avgScore,
            homeworks: clsHws,
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
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API_BASE}/teacher/homework/${hw.id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mappedStudents = res.data.submissions.map((sub, idx) => ({
        name: sub.student_name,
        roll: (idx + 1).toString().padStart(2, "0"),
        score: sub.percentage !== null ? sub.percentage : null,
        submitted_at: sub.submitted_at ? sub.submitted_at : "—",
        time_taken: "—",
        status: sub.status,
      }));
      setSelectedHomework({ ...hw, students_data: mappedStudents });
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
      color: "#071521",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=Sora:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        button { font-family: 'DM Sans', sans-serif; }
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