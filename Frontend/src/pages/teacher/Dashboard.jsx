import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/* ─── mock data (swap for API calls) ─── */
const STATS = [
    { label: "Students", value: "128", sub: "+13 this term", color: "#273c75", bg: "#d8e8f4", image: "/dashboard-elements/backpack.png" },
    { label: "Classes", value: "4", sub: "Active now", color: "#273c75", bg: "#f1d8e6", image: "/dashboard-elements/graduation-stack.png" },
    { label: "Avg Score", value: "84%", sub: "up 8% vs last", color: "#273c75", bg: "#fff0b8", image: "/dashboard-elements/report-a-plus.png" },
    { label: "Pending", value: "12", sub: "Need review", color: "#273c75", bg: "#dceeff", image: "/dashboard-elements/bell.png" },
];

const CLASSES = [
    { grade: "8A", subject: "Mathematics", students: 34, submitted: 28, avg: 82, color: "#273c75", accent: "#8bb7d8" },
    { grade: "8B", subject: "Science", students: 31, submitted: 24, avg: 79, color: "#273c75", accent: "#34d399" },
    { grade: "9A", subject: "Mathematics", students: 36, submitted: 31, avg: 88, color: "#273c75", accent: "#f6b94c" },
    { grade: "9B", subject: "English", students: 27, submitted: 20, avg: 85, color: "#273c75", accent: "#d8a0c4" },
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
const scoreColor = (s) => s >= 90 ? "#15803d" : s >= 75 ? "#b45309" : "#b91c1c";
const levelColor = { high: "#b91c1c", mid: "#b45309", low: "#15803d" };
const levelBg    = { high: "#fee2e2", mid: "#fef3c7", low: "#d1fae5" };

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
            <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 900, color: "#3F6E8F", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {title}
            </span>
            {cta && (
                <button onClick={onClick} style={{
                    background: "none", border: "2px solid #071521", cursor: "pointer",
                    fontSize: 11, color: "#071521", fontWeight: 800,
                    padding: "3px 10px", borderRadius: 8, transition: "all 0.15s",
                    fontFamily: "'DM Sans', sans-serif",
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#071521"; e.currentTarget.style.color = "#FFECA8"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#071521"; }}
                >{cta} →</button>
            )}
        </div>
    );
}

/* ─── Card wrapper ─── */
function Card({ children, style = {}, delay = 0 }) {
    return (
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
}

/* ─── Stat Card ─── */
function StatCard({ stat, delay }) {
    return (
        <motion.div {...fadeUp(delay)}
            whileHover={{ y: -2, boxShadow: "8px 8px 0 #d8a0c4" }}
            style={{
                borderRadius: 14,
                background: stat.bg,
                border: "4px solid #071521",
                boxShadow: "5px 5px 0 #071521",
                padding: "18px 18px",
                cursor: "default",
                position: "relative", overflow: "hidden",
                transition: "box-shadow 0.2s",
            }}
        >
            <img src={stat.image} alt="" aria-hidden="true" style={{ position: "absolute", right: 12, top: 12, width: 52, height: 52, objectFit: "contain", filter: "drop-shadow(2px 3px 0 rgba(39,60,117,0.18))", opacity: 0.85 }} />
            <div style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 36, fontWeight: 900,
                color: "#071521", lineHeight: 1,
                marginBottom: 8,
                paddingRight: 60,
            }}>{stat.value}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#071521", marginBottom: 3 }}>{stat.label}</div>
            <div style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 700 }}>{stat.sub}</div>
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
                borderBottom: "2px dashed rgba(7,21,33,0.1)",
                cursor: "pointer",
            }}
        >
            {/* Grade badge */}
            <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: cls.accent + "33",
                border: `3px solid #071521`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 900, color: "#071521",
            }}>
                {cls.grade}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#071521", marginBottom: 2 }}>
                    Grade {cls.grade} <span style={{ color: "#3F6E8F", fontWeight: 600 }}>· {cls.subject}</span>
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, borderRadius: 99, background: "rgba(7,21,33,0.08)", overflow: "hidden", marginTop: 5 }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: delay + 0.3, duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
                        style={{ height: "100%", borderRadius: 99, background: cls.accent }}
                    />
                </div>
                <div style={{ fontSize: 11, color: "#3F6E8F", marginTop: 4, fontWeight: 700 }}>{cls.submitted}/{cls.students} submitted</div>
            </div>

            {/* Avg score */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 900, color: "#071521" }}>{cls.avg}%</div>
                <div style={{ fontSize: 9, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 800 }}>avg</div>
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
            borderBottom: last ? "none" : "2px dashed rgba(7,21,33,0.1)",
        }}>
            {/* Avatar letter */}
            <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "#d8e8f4", border: "3px solid #071521",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 900, color: "#273c75",
                boxShadow: "2px 2px 0 #071521",
            }}>{s.name[0]}</div>

            {/* Name + subject */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#071521", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 700 }}>{s.subject} · {s.time}</div>
            </div>

            {/* Score / badge */}
            {s.status === "graded" ? (
                <span style={{
                    fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 900,
                    color: scoreColor(s.score), flexShrink: 0,
                    background: s.score >= 90 ? "#d1fae5" : s.score >= 75 ? "#fef3c7" : "#fee2e2",
                    border: `2px solid ${scoreColor(s.score)}`,
                    borderRadius: 8, padding: "2px 10px",
                }}>
                    {s.score}%
                </span>
            ) : (
                <span style={{
                    fontSize: 10, fontWeight: 900, padding: "3px 10px", borderRadius: 8, flexShrink: 0,
                    background: "#fef3c7", color: "#b45309", border: "2px solid #f59e0b",
                }}>Review</span>
            )}
        </motion.div>
    );
}

/* ─── Deadline row ─── */
function DeadlineRow({ d, delay, last }) {
    const c   = levelColor[d.level];
    const bg  = levelBg[d.level];
    return (
        <motion.div {...fadeUp(delay)} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 0",
            borderBottom: last ? "none" : "2px dashed rgba(7,21,33,0.1)",
        }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0, border: "2px solid #071521" }} />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#071521" }}>{d.title}</div>
                <div style={{ fontSize: 11, color: "#3F6E8F", marginTop: 2, fontWeight: 700 }}>{d.class}</div>
            </div>
            <span style={{
                fontSize: 11, fontWeight: 900, color: c, flexShrink: 0,
                background: bg, border: `2px solid ${c}`, borderRadius: 8, padding: "2px 9px",
            }}>{d.due}</span>
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=Sora:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        .teacher-dashboard-page {
          color: #071521;
        }
        .teacher-hero-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 24px 28px;
          border: 4px solid #071521;
          border-radius: 14px;
          background: linear-gradient(135deg, #ffe792, #B7DBFF);
          box-shadow: 8px 8px 0 #d8a0c4;
          margin-bottom: 28px;
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
          .teacher-hero-strip { padding: 18px; box-shadow: 5px 5px 0 #d8a0c4; }
          .teacher-hero-strip img { width: 74px !important; height: 74px !important; }
        }
      `}</style>

            {/* ── GREETING ── */}
            <motion.div {...fadeUp(0)} className="teacher-hero-strip">
                <div>
                    <p style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 900, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
                        {greeting} 👋
                    </p>
                    <h1 style={{
                        fontFamily: "'Sora', sans-serif",
                        fontSize: "clamp(22px, 3vw, 28px)",
                        fontWeight: 900, color: "#071521",
                        letterSpacing: "0", marginBottom: 6,
                    }}>
                        Your Classroom Overview
                    </h1>
                    <p style={{ fontSize: 13, color: "#273c75", fontWeight: 800 }}>
                        Term 2 • Academic Year 2025-26
                    </p>
                </div>
                <img src="/dashboard-elements/pencil-box.png" alt="" aria-hidden="true" style={{ width: 100, height: 100, objectFit: "contain", flexShrink: 0, filter: "drop-shadow(4px 6px 0 rgba(7,21,33,0.18))" }} />
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
                                { label: "Assign New Task", icon: "✦", path: "/teacher/task", color: "#273c75", bg: "#d8e8f4" },
                                { label: "Create a Test", icon: "◈", path: "/teacher/test", color: "#273c75", bg: "#f1d8e6" },
                                { label: "Open Kanban", icon: "⊞", path: "/teacher/kanban", color: "#273c75", bg: "#B7DBFF" },
                                { label: "View Submissions", icon: "◎", path: "/teacher/submissions", color: "#273c75", bg: "#FFECA8" },
                            ].map((a) => (
                                <motion.button
                                    key={a.label}
                                    whileHover={{ x: 3, boxShadow: "4px 4px 0 #071521" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(a.path)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "11px 14px", borderRadius: 10, cursor: "pointer",
                                        background: a.bg,
                                        border: "3px solid #071521",
                                        color: "#071521", fontSize: 13, fontWeight: 800,
                                        textAlign: "left",
                                        width: "100%",
                                        boxShadow: "2px 2px 0 #071521",
                                        transition: "all 0.15s",
                                        fontFamily: "'DM Sans', sans-serif",
                                    }}
                                >
                                    <span style={{
                                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                                        background: "#ffffff", border: `2px solid #071521`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 13, color: "#071521",
                                        boxShadow: "1px 1px 0 #071521",
                                    }}>{a.icon}</span>
                                    {a.label}
                                    <span style={{ marginLeft: "auto", fontSize: 14, color: "#071521", fontWeight: 900 }}>→</span>
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
                        whileHover={{ y: -2, boxShadow: "6px 6px 0 #d8a0c4" }}
                        style={{
                            borderRadius: 14, padding: "16px 20px",
                            background: "#f1d8e6",
                            border: "3px solid #071521",
                            cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 14,
                            boxShadow: "4px 4px 0 #071521",
                            transition: "all 0.2s",
                        }}
                        onClick={() => navigate("/teacher/dashboard")}
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: "#ffffff", border: "3px solid #071521",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                            boxShadow: "2px 2px 0 #071521",
                        }}>🙋</div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: "#071521" }}>3 Enrollment Requests</div>
                            <div style={{ fontSize: 11, color: "#3F6E8F", marginTop: 2, fontWeight: 700 }}>Students waiting to join your class</div>
                        </div>
                        <span style={{ marginLeft: "auto", fontSize: 14, color: "#071521", fontWeight: 900 }}>→</span>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
