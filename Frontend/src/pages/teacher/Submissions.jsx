import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────── */
const CLASSES = [
  {
    id: "8A", grade: "8A", subject: "Mathematics",
    task: "Chapter 7 – Algebra Basics",
    students: 34, submitted: 28, pending: 6, avg: 82,
    color: "#818cf8", due: "Apr 22, 2025",
    students_data: [
      { name: "Riya Sharma",    roll: "01", score: 92,   submitted_at: "Apr 22, 9:14 AM",  time_taken: "38 min", status: "graded"  },
      { name: "Amit Patel",     roll: "02", score: 78,   submitted_at: "Apr 22, 9:41 AM",  time_taken: "45 min", status: "graded"  },
      { name: "Sneha Joshi",    roll: "03", score: 88,   submitted_at: "Apr 22, 10:02 AM", time_taken: "52 min", status: "graded"  },
      { name: "Dev Mehta",      roll: "04", score: 64,   submitted_at: "Apr 22, 10:20 AM", time_taken: "61 min", status: "graded"  },
      { name: "Pooja Iyer",     roll: "05", score: 95,   submitted_at: "Apr 22, 8:55 AM",  time_taken: "29 min", status: "graded"  },
      { name: "Arjun Nair",     roll: "06", score: 74,   submitted_at: "Apr 23, 11:10 AM", time_taken: "43 min", status: "graded"  },
      { name: "Meena Desai",    roll: "07", score: 87,   submitted_at: "Apr 22, 12:00 PM", time_taken: "55 min", status: "graded"  },
      { name: "Kabir Singh",    roll: "08", score: null, submitted_at: "—",                time_taken: "—",      status: "pending" },
      { name: "Tanvi Rao",      roll: "09", score: 91,   submitted_at: "Apr 22, 3:22 PM",  time_taken: "34 min", status: "graded"  },
      { name: "Vikas Kulkarni", roll: "10", score: null, submitted_at: "—",                time_taken: "—",      status: "pending" },
      { name: "Nisha Verma",    roll: "11", score: 83,   submitted_at: "Apr 23, 9:00 AM",  time_taken: "48 min", status: "graded"  },
      { name: "Rohit Chavan",   roll: "12", score: 76,   submitted_at: "Apr 23, 9:30 AM",  time_taken: "57 min", status: "graded"  },
    ],
  },
  {
    id: "8B", grade: "8B", subject: "Science",
    task: "Chapter 5 – Forces & Motion",
    students: 31, submitted: 24, pending: 7, avg: 79,
    color: "#34d399", due: "Apr 23, 2025",
    students_data: [
      { name: "Priya Nair",     roll: "01", score: null, submitted_at: "—",               time_taken: "—",      status: "pending" },
      { name: "Rohan Gupta",    roll: "02", score: 88,   submitted_at: "Apr 23, 10:05 AM", time_taken: "42 min", status: "graded"  },
      { name: "Ayesha Khan",    roll: "03", score: 73,   submitted_at: "Apr 23, 10:30 AM", time_taken: "50 min", status: "graded"  },
      { name: "Sahil Patil",    roll: "04", score: 80,   submitted_at: "Apr 23, 11:00 AM", time_taken: "38 min", status: "graded"  },
      { name: "Kavya Menon",    roll: "05", score: 91,   submitted_at: "Apr 23, 8:50 AM",  time_taken: "31 min", status: "graded"  },
      { name: "Faiz Ansari",    roll: "06", score: null, submitted_at: "—",               time_taken: "—",      status: "pending" },
      { name: "Nandini Reddy",  roll: "07", score: 68,   submitted_at: "Apr 23, 2:10 PM",  time_taken: "66 min", status: "graded"  },
      { name: "Tushar Bhosale", roll: "08", score: 85,   submitted_at: "Apr 23, 3:00 PM",  time_taken: "44 min", status: "graded"  },
    ],
  },
  {
    id: "9A", grade: "9A", subject: "Mathematics",
    task: "Chapter 3 – Coordinate Geometry",
    students: 36, submitted: 31, pending: 5, avg: 88,
    color: "#22d3ee", due: "Apr 24, 2025",
    students_data: [
      { name: "Ishaan Tiwari",  roll: "01", score: 96,   submitted_at: "Apr 24, 8:40 AM",  time_taken: "26 min", status: "graded"  },
      { name: "Simran Kaur",    roll: "02", score: 89,   submitted_at: "Apr 24, 9:12 AM",  time_taken: "38 min", status: "graded"  },
      { name: "Manav Jain",     roll: "03", score: null, submitted_at: "—",               time_taken: "—",      status: "pending" },
      { name: "Deepa Pillai",   roll: "04", score: 94,   submitted_at: "Apr 24, 9:55 AM",  time_taken: "33 min", status: "graded"  },
      { name: "Harsh Agarwal",  roll: "05", score: 77,   submitted_at: "Apr 24, 10:20 AM", time_taken: "51 min", status: "graded"  },
      { name: "Ritika Das",     roll: "06", score: 88,   submitted_at: "Apr 24, 11:00 AM", time_taken: "46 min", status: "graded"  },
      { name: "Yash Dubey",     roll: "07", score: 90,   submitted_at: "Apr 24, 11:30 AM", time_taken: "39 min", status: "graded"  },
      { name: "Shruti Bhat",    roll: "08", score: null, submitted_at: "—",               time_taken: "—",      status: "pending" },
    ],
  },
  {
    id: "9B", grade: "9B", subject: "English",
    task: "Chapter 6 – The Last Leaf (Analysis)",
    students: 27, submitted: 20, pending: 7, avg: 85,
    color: "#f59e0b", due: "Apr 25, 2025",
    students_data: [
      { name: "Anika Sharma",    roll: "01", score: 90,   submitted_at: "Apr 24, 9:00 AM",  time_taken: "40 min", status: "graded"  },
      { name: "Nikhil Joshi",    roll: "02", score: 83,   submitted_at: "Apr 24, 9:45 AM",  time_taken: "47 min", status: "graded"  },
      { name: "Pallavi Soni",    roll: "03", score: null, submitted_at: "—",               time_taken: "—",      status: "pending" },
      { name: "Abhinav Mishra",  roll: "04", score: 78,   submitted_at: "Apr 24, 10:10 AM", time_taken: "53 min", status: "graded"  },
      { name: "Jiya Fernandez",  roll: "05", score: 92,   submitted_at: "Apr 24, 8:30 AM",  time_taken: "35 min", status: "graded"  },
      { name: "Sumit Thakur",    roll: "06", score: 81,   submitted_at: "Apr 24, 11:00 AM", time_taken: "49 min", status: "graded"  },
      { name: "Divya Nambiar",   roll: "07", score: null, submitted_at: "—",               time_taken: "—",      status: "pending" },
      { name: "Pranav Kulkarni", roll: "08", score: 88,   submitted_at: "Apr 24, 12:00 PM", time_taken: "42 min", status: "graded"  },
    ],
  },
];

/* ─── helpers ─── */
const scoreColor = (s) => s >= 90 ? "#34d399" : s >= 75 ? "#f59e0b" : "#f87171";
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.38, ease: [0.25, 1, 0.5, 1] },
});

/* reusable glass card — identical to Dashboard.jsx Card component */
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
   DETAIL VIEW — individual class
═══════════════════════════════════════════ */
function ClassDetail({ cls, onBack }) {
  const graded  = cls.students_data.filter(s => s.status === "graded");
  const scores  = graded.map(s => s.score);
  const highest = scores.length ? Math.max(...scores) : 0;

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
        ← Back to Submissions
      </motion.button>

      {/* Header */}
      <motion.div {...fadeUp(0.04)} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: `${cls.color}14`, border: `1px solid ${cls.color}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 800, color: cls.color,
        }}>{cls.grade}</div>
        <div>
          <h1 style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 800,
            fontSize: "clamp(18px, 2.5vw, 22px)", color: "#fff",
            letterSpacing: "-0.03em", lineHeight: 1.2,
          }}>Grade {cls.grade} · {cls.subject}</h1>
          <p style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>
            Task: <span style={{ color: "#94a3b8" }}>{cls.task}</span>
            &nbsp;·&nbsp;Due: <span style={{ color: "#94a3b8" }}>{cls.due}</span>
          </p>
        </div>
      </motion.div>

      {/* 4 stat tiles — same pattern as Dashboard StatCard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Submitted",  value: `${cls.submitted} / ${cls.students}`, color: cls.color  },
          { label: "Pending",    value: cls.pending,                           color: "#f87171"  },
          { label: "Class Avg",  value: cls.avg + "%",                         color: "#818cf8"  },
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

        {cls.students_data.map((s, i) => {
          const sc = s.score;
          const isLast = i === cls.students_data.length - 1;
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
                  background: sc ? `${scoreColor(sc)}14` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${sc ? scoreColor(sc) + "28" : "rgba(255,255,255,0.07)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: sc ? scoreColor(sc) : "#334155",
                }}>{s.name.charAt(0)}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{s.name}</span>
              </div>

              {/* Score */}
              {sc !== null ? (
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
              <span style={{ fontSize: 11, color: "#475569" }}>{s.submitted_at}</span>

              {/* Time taken */}
              <span style={{ fontSize: 11, color: s.time_taken !== "—" ? "#94a3b8" : "#1e293b" }}>
                {s.time_taken !== "—" ? "⏱ " : ""}{s.time_taken}
              </span>

              {/* Status badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 99, width: "fit-content",
                background: s.status === "graded" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                border: `1px solid ${s.status === "graded" ? "rgba(52,211,153,0.22)" : "rgba(248,113,113,0.22)"}`,
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: s.status === "graded" ? "#34d399" : "#f87171",
                }} />
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                  color: s.status === "graded" ? "#34d399" : "#f87171",
                }}>{s.status}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   OVERVIEW — all classes
═══════════════════════════════════════════ */
function ClassOverview({ onSelect }) {
  const totalStudents  = CLASSES.reduce((a, c) => a + c.students, 0);
  const totalSubmitted = CLASSES.reduce((a, c) => a + c.submitted, 0);
  const totalPending   = CLASSES.reduce((a, c) => a + c.pending, 0);
  const overallAvg     = Math.round(CLASSES.reduce((a, c) => a + c.avg, 0) / CLASSES.length);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

      {/* Page heading — mirrors Dashboard greeting style */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
          Class Management
        </p>
        <h1 style={{
          fontFamily: "'Sora', sans-serif", fontWeight: 800,
          fontSize: "clamp(20px, 3vw, 26px)", color: "#fff",
          letterSpacing: "-0.03em", marginBottom: 6,
        }}>Submissions</h1>
        <p style={{ fontSize: 13, color: "#334155" }}>
          {CLASSES.length} classes assigned · Term 2, Academic Year 2025–26
        </p>
      </motion.div>

      {/* Summary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Students", value: totalStudents,    color: "#818cf8" },
          { label: "Submitted",      value: totalSubmitted,   color: "#34d399" },
          { label: "Pending",        value: totalPending,     color: "#f87171" },
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {CLASSES.map((cls, i) => {
          const pct = Math.round((cls.submitted / cls.students) * 100);
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

              {/* Grade badge + avg score */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                    background: `${cls.color}14`, border: `1px solid ${cls.color}28`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 800, color: cls.color,
                  }}>{cls.grade}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>Grade {cls.grade}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{cls.subject}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: 22, fontWeight: 800, color: cls.color, letterSpacing: "-0.04em", lineHeight: 1,
                  }}>{cls.avg}%</div>
                  <div style={{ fontSize: 9, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>avg</div>
                </div>
              </div>

              {/* Task name */}
              <div style={{
                fontSize: 11, color: "#475569", marginBottom: 16,
                padding: "6px 10px", borderRadius: 8,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.05)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>📋 {cls.task}</div>

              {/* Submission progress */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Submissions</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{cls.submitted} / {cls.students}</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                    style={{ height: "100%", borderRadius: 99, background: cls.color }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                  <span style={{ fontSize: 10, color: "#334155" }}>{pct}% submitted</span>
                  <span style={{ fontSize: 10, color: "#f87171" }}>{cls.pending} pending</span>
                </div>
              </div>

              {/* Card footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "#334155" }}>Due {cls.due}</span>
                <span style={{ fontSize: 11, color: cls.color, fontWeight: 600 }}>View Reports →</span>
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
  const [selected, setSelected] = useState(null);

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
        {selected
          ? <ClassDetail   key="detail"   cls={selected} onBack={() => setSelected(null)} />
          : <ClassOverview key="overview" onSelect={setSelected} />
        }
      </AnimatePresence>
    </div>
  );
}