import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/* ─── mock data (swap for API calls) ─── */
const STATS = [
    { label: "Students", value: "128", sub: "+13 this term", color: "#8bb7d8", bg: "#d8e8f4", image: "/dashboard-elements/backpack.png" },
    { label: "Classes", value: "4", sub: "Active now", color: "#d8a0c4", bg: "#f1d8e6", image: "/dashboard-elements/graduation-stack.png" },
    { label: "Avg Score", value: "84%", sub: "up 8% vs last", color: "#f4d98e", bg: "#fff0b8", image: "/dashboard-elements/report-a-plus.png" },
    { label: "Pending", value: "12", sub: "Need review", color: "#8bb7d8", bg: "#dceeff", image: "/dashboard-elements/bell.png" },
];

const CLASSES = [
    { grade: "8A", subject: "Mathematics", students: 34, submitted: 28, avg: 82, color: "#818cf8" },
    { grade: "8B", subject: "Science", students: 31, submitted: 24, avg: 79, color: "#34d399" },
    { grade: "9A", subject: "Mathematics", students: 36, submitted: 31, avg: 88, color: "#22d3ee" },
    { grade: "9B", subject: "English", students: 27, submitted: 20, avg: 85, color: "#f59e0b" },
];

const SUBMISSIONS = [
    { name: "Riya Sharma", subject: "Maths", score: 92, time: "2m ago", status: "graded" },
    { name: "Amit Patel", subject: "Science", score: 78, time: "14m ago", status: "graded" },
    { name: "Priya Nair", subject: "English", score: null, time: "31m ago", status: "pending" },
    { name: "Rohan Gupta", subject: "History", score: 88, time: "1h ago", status: "graded" },
    { name: "Sneha Joshi", subject: "Maths", score: null, time: "2h ago", status: "pending" },
];

const DEADLINES = [
    { title: "Math Ch.7 Homework", class: "Grade 8A", due: "Tomorrow", level: "high" },
    { title: "Science Test", class: "Grade 8B", due: "In 3 days", level: "mid" },
    { title: "English Essay", class: "Grade 9B", due: "In 5 days", level: "low" },
];

/* ─── tiny helpers ─── */
const scoreColor = (s) => s >= 90 ? "#34d399" : s >= 75 ? "#f59e0b" : "#f87171";
const levelColor = { high: "#f87171", mid: "#f59e0b", low: "#34d399" };

/* ─── fade-up animation preset ─── */
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.38, ease: [0.25, 1, 0.5, 1] },
});

/* ─── Section header ─── */
function SH({ title, cta, onClick }) {
    return (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: "#cbd5e1", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {title}
            </span>
            {cta && (
                <button onClick={onClick} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 11, color: "#6366f1", fontWeight: 600,
                    padding: "3px 6px", borderRadius: 6, transition: "background 0.15s",
                }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                >{cta} →</button>
            )}
        </div>
    );
}

/* ─── Card wrapper ─── */
function Card({ children, style = {}, delay = 0 }) {
    return (
        <motion.div {...fadeUp(delay)} style={{
            borderRadius: 8,
            background: "#ffffff",
            border: "4px solid #273c75",
            boxShadow: "8px 8px 0 #8bb7d8",
            padding: "22px 24px",
            ...style,
        }}>
            {children}
        </motion.div>
    );
}

/* ─── Stat Card ─── */
function StatCard({ stat, delay }) {
    return (
        <motion.div {...fadeUp(delay)}
            whileHover={{ y: -2 }}
            style={{
                borderRadius: 8,
                background: stat.bg,
                border: "4px solid #273c75",
                boxShadow: "7px 7px 0 #d8a0c4",
                padding: "18px 18px",
                cursor: "default",
                position: "relative", overflow: "hidden",
            }}
        >
            {/* top accent line */}
            <div style={{
                position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
                background: `linear-gradient(90deg, transparent, ${stat.color}55, transparent)`,
            }} />
            <img src={stat.image} alt="" aria-hidden="true" style={{ position: "absolute", right: 12, top: 12, width: 52, height: 52, objectFit: "contain", filter: "drop-shadow(3px 4px 0 rgba(39,60,117,0.16))" }} />
            <div style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 34, fontWeight: 900,
                color: "#273c75", lineHeight: 1,
                letterSpacing: "0", marginBottom: 8,
                paddingRight: 54,
            }}>{stat.value}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#273c75", marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>{stat.sub}</div>
        </motion.div>
    );
}

/* ─── Class row ─── */
function ClassRow({ cls, delay }) {
    const pct = Math.round((cls.submitted / cls.students) * 100);
    return (
        <motion.div {...fadeUp(delay)}
            whileHover={{ x: 3 }}
            style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.045)",
                cursor: "pointer",
            }}
        >
            {/* Grade badge */}
            <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: `${cls.color}14`, border: `1px solid ${cls.color}28`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 800, color: cls.color,
            }}>
                {cls.grade}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>
                    Grade {cls.grade}  <span style={{ color: "#334155", fontWeight: 400 }}>·</span>  <span style={{ color: "#475569", fontWeight: 400, fontSize: 12 }}>{cls.subject}</span>
                </div>
                {/* Progress bar */}
                <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginTop: 6 }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: delay + 0.3, duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
                        style={{ height: "100%", borderRadius: 99, background: cls.color }}
                    />
                </div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>{cls.submitted}/{cls.students} submitted</div>
            </div>

            {/* Avg score */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: cls.color }}>{cls.avg}%</div>
                <div style={{ fontSize: 9, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>avg</div>
            </div>
        </motion.div>
    );
}

/* ─── Submission row ─── */
function SubmissionRow({ s, delay, last }) {
    return (
        <motion.div {...fadeUp(delay)} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 0",
            borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.045)",
        }}>
            {/* Avatar letter */}
            <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 700, color: "#818cf8",
            }}>{s.name[0]}</div>

            {/* Name + subject */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                <div style={{ fontSize: 10, color: "#334155" }}>{s.subject} · {s.time}</div>
            </div>

            {/* Score / badge */}
            {s.status === "graded" ? (
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 800, color: scoreColor(s.score), flexShrink: 0 }}>
                    {s.score}%
                </span>
            ) : (
                <span style={{
                    fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 99, flexShrink: 0,
                    background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.22)",
                }}>Review</span>
            )}
        </motion.div>
    );
}

/* ─── Deadline row ─── */
function DeadlineRow({ d, delay, last }) {
    const c = levelColor[d.level];
    return (
        <motion.div {...fadeUp(delay)} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 0",
            borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.045)",
        }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, flexShrink: 0, boxShadow: `0 0 6px ${c}` }} />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{d.title}</div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{d.class}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: c, flexShrink: 0 }}>{d.due}</span>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────── */
export default function TeacherDashboard() {
    const navigate = useNavigate();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <div className="teacher-dashboard-page" style={{
            padding: "36px 40px 60px",
            maxWidth: 1200,
            fontFamily: "'DM Sans', sans-serif",
            margin: "0 auto",
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        .teacher-dashboard-page {
          color: #273c75;
          background:
            radial-gradient(circle at 10% 12%, rgba(216,160,196,0.24), transparent 28%),
            radial-gradient(circle at 88% 20%, rgba(244,217,142,0.28), transparent 30%);
        }
        .teacher-hero-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 24px;
          border: 4px solid #273c75;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(255,236,168,0.92), rgba(216,232,244,0.92));
          box-shadow: 10px 10px 0 #d8a0c4;
          margin-bottom: 32px;
        }
        .teacher-stat-grid { grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)) !important; }
        .teacher-main-grid { grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr) !important; }
        @media (max-width: 920px) {
          .teacher-dashboard-page { padding: 24px 18px 44px !important; }
          .teacher-main-grid { grid-template-columns: 1fr !important; }
          .teacher-hero-strip { align-items: flex-start; }
        }
        @media (max-width: 620px) {
          .teacher-dashboard-page { padding: 18px 14px 36px !important; }
          .teacher-hero-strip { padding: 18px; box-shadow: 6px 6px 0 #d8a0c4; }
          .teacher-hero-strip img { width: 74px !important; height: 74px !important; }
        }
      `}</style>

            {/* ── GREETING ── */}
            <motion.div {...fadeUp(0)} className="teacher-hero-strip">
                <div>
                <p style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
                    {greeting}
                </p>
                <h1 style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: "clamp(22px, 3vw, 28px)",
                    fontWeight: 900, color: "#273c75",
                    letterSpacing: "0", marginBottom: 6,
                }}>
                    Your Classroom Overview
                </h1>
                <p style={{ fontSize: 13, color: "#334155", fontWeight: 800 }}>
                    Term 2 • Academic Year 2025-26
                </p>
                </div>
                <img src="/dashboard-elements/pencil-box.png" alt="" aria-hidden="true" style={{ width: 100, height: 100, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(6px 8px 0 rgba(39,60,117,0.16))" }} />
            </motion.div>

            {/* ── 4 STAT CARDS ── */}
            <div className="teacher-stat-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 14,
                marginBottom: 28,
            }}>
                {STATS.map((s, i) => <StatCard key={s.label} stat={s} delay={0.05 * i} />)}
            </div>

            {/* ── MAIN GRID: 2 cols ── */}
            <div className="teacher-main-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, alignItems: "start" }}>

                {/* LEFT COL */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* My Classes */}
                    <Card delay={0.18}>
                        <SH title="My Classes" cta="View all" onClick={() => navigate("/teacher/students")} />
                        {CLASSES.map((cls, i) => (
                            <ClassRow key={cls.grade} cls={cls} delay={0.22 + i * 0.06} />
                        ))}
                    </Card>

                    {/* Recent Submissions */}
                    <Card delay={0.3}>
                        <SH title="Recent Submissions" cta="All submissions" onClick={() => navigate("/teacher/submissions")} />
                        {SUBMISSIONS.map((s, i) => (
                            <SubmissionRow key={s.name} s={s} delay={0.34 + i * 0.05} last={i === SUBMISSIONS.length - 1} />
                        ))}
                    </Card>
                </div>

                {/* RIGHT COL */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Quick Actions */}
                    <Card delay={0.2}>
                        <SH title="Quick Actions" />
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {[
                                { label: "Assign New Task", icon: "✦", path: "/teacher/task", color: "#6366f1" },
                                { label: "Create a Test", icon: "◈", path: "/teacher/test", color: "#8b5cf6" },
                                { label: "Open Kanban", icon: "⊞", path: "/teacher/kanban", color: "#22d3ee" },
                                { label: "View Submissions", icon: "◎", path: "/teacher/submissions", color: "#34d399" },
                            ].map((a) => (
                                <motion.button
                                    key={a.label}
                                    whileHover={{ x: 3, borderColor: `${a.color}40` }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(a.path)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "11px 14px", borderRadius: 10, cursor: "pointer",
                                        background: "rgba(255,255,255,0.025)",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                        color: "#94a3b8", fontSize: 13, fontWeight: 500,
                                        textAlign: "left", transition: "border-color 0.2s, color 0.2s",
                                        width: "100%",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = "#e2e8f0"; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; }}
                                >
                                    <span style={{
                                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                                        background: `${a.color}18`, border: `1px solid ${a.color}30`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 13, color: a.color,
                                    }}>{a.icon}</span>
                                    {a.label}
                                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#1e293b" }}>→</span>
                                </motion.button>
                            ))}
                        </div>
                    </Card>

                    {/* Upcoming Deadlines */}
                    <Card delay={0.28}>
                        <SH title="Upcoming Deadlines" />
                        {DEADLINES.map((d, i) => (
                            <DeadlineRow key={d.title} d={d} delay={0.32 + i * 0.05} last={i === DEADLINES.length - 1} />
                        ))}
                    </Card>

                    {/* Enrollment requests nudge */}
                    <motion.div {...fadeUp(0.38)}
                        whileHover={{ borderColor: "rgba(99,102,241,0.3)" }}
                        style={{
                            borderRadius: 14, padding: "16px 20px",
                            background: "rgba(99,102,241,0.07)",
                            border: "1px solid rgba(99,102,241,0.18)",
                            cursor: "pointer", transition: "border-color 0.2s",
                            display: "flex", alignItems: "center", gap: 14,
                        }}
                        onClick={() => navigate("/teacher/dashboard")}
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                        }}>🙋</div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#c7d2fe" }}>3 Enrollment Requests</div>
                            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Students waiting to join your class</div>
                        </div>
                        <span style={{ marginLeft: "auto", fontSize: 13, color: "#6366f1" }}>→</span>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
