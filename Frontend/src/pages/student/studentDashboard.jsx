import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

/* ── ANIMATED COUNTER ── */
function Counter({ to, delay = 0 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const raf = (ts) => {
      if (!start) start = ts + delay * 1000;
      const elapsed = ts - start;
      if (elapsed < 0) { requestAnimationFrame(raf); return; }
      const p = Math.min(elapsed / 1400, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * to));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [to]);
  return <span>{val.toLocaleString()}</span>;
}

/* ── TILT CARD ── */
function TiltCard({ children, style = {} }) {
  const ref = useRef(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), { stiffness: 300, damping: 35 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), { stiffness: 300, damping: 35 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", ...style }}>
      {children}
    </motion.div>
  );
}

/* ── THIN PROGRESS BAR ── */
function Bar({ value, color, delay = 0 }) {
  return (
    <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: [0.25, 1, 0.5, 1], delay }}
        style={{ height: "100%", borderRadius: 99, background: color, opacity: 0.8 }}
      />
    </div>
  );
}

/* ── FLOATING ORB ── */
function Orb({ size, top, left, color, duration, delay }) {
  return (
    <motion.div
      animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
      style={{ position: "fixed", top, left, width: size, height: size, borderRadius: "50%", pointerEvents: "none", background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, filter: "blur(55px)", zIndex: 0 }}
    />
  );
}

/* ── SUBJECT COLOUR MAP ── */
const SUBJECT_META = {
  mathematics: { icon: "📐", color: "#60a5fa" },
  math: { icon: "📐", color: "#60a5fa" },
  english: { icon: "📖", color: "#a78bfa" },
  science: { icon: "🔬", color: "#34d399" },
  "social studies": { icon: "🌍", color: "#fb923c" },
  "social science": { icon: "🌍", color: "#fb923c" },
  "computer science": { icon: "💻", color: "#f472b6" },
  "art & design": { icon: "🎨", color: "#fbbf24" },
};
const getSubjectMeta = (name = "") => {
  const key = name.toLowerCase();
  return SUBJECT_META[key] || { icon: "📚", color: "#94a3b8" };
};

const NOTIF_ICONS = {
  homework_assigned: "📝",
  submission_graded: "🏆",
  enrollment_accepted: "✅",
  enrollment_rejected: "❌",
};

/* ── MAIN ── */
export default function StudentDashboard() {
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState("Student");
  const [subjects, setSubjects] = useState([]);
  const [totalHomework, setTotalHomework] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get name from localStorage first (instant)
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    if (stored?.name) setStudentName(stored.name.split(" ")[0]);

    const token = getToken();
    if (!token) { setLoading(false); return; }

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch dashboard + notifications in parallel
    Promise.allSettled([
      fetch(`${API}/student/dashboard`, { headers }).then(r => r.json()),
      fetch(`${API}/notifications?limit=4`, { headers }).then(r => r.json()),
    ]).then(([dashResult, notifResult]) => {
      // Process dashboard
      if (dashResult.status === "fulfilled" && dashResult.value?.subjects) {
        const d = dashResult.value;
        if (d.student?.name) setStudentName(d.student.name.split(" ")[0]);
        setTotalHomework(d.total_pending_homework ?? 0);

        // Map subjects from backend to display format
        const mappedSubjects = (d.subjects || []).map(s => {
          const meta = getSubjectMeta(s.subject);
          return {
            name: s.subject,
            icon: meta.icon,
            color: meta.color,
            pending_homework: s.pending_homework ?? 0,
            teacher_name: s.teacher_name ?? "",
            class_id: s.class_id,
          };
        });
        setSubjects(mappedSubjects);
      }

      // Process notifications
      if (notifResult.status === "fulfilled" && notifResult.value?.notifications) {
        const notifs = notifResult.value.notifications;
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      }

      setLoading(false);
    });
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning ☀️";
    if (h < 17) return "Good afternoon 🌤️";
    return "Good evening 🌙";
  })();

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
      `}</style>

      <Orb size={480} top="-5%" left="15%" color="rgba(99,102,241,0.15)" duration={14} delay={0} />
      <Orb size={360} top="50%" left="55%" color="rgba(96,165,250,0.09)" duration={18} delay={4} />

      <div style={{ position: "relative", zIndex: 1, padding: "40px 40px 64px" }}>

        {/* ── GREETING ── */}
        <div style={{ marginBottom: 44 }}>
          <motion.p
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ fontSize: 13, color: "#6366f1", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            {greeting}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 1, 0.5, 1] }}
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(26px, 3.5vw, 40px)", letterSpacing: "-0.03em", color: "#fff", marginBottom: 8 }}>
            Hey {studentName} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            style={{ fontSize: 15, color: "#475569", fontWeight: 500 }}>
            You have{" "}
            <span style={{ color: "#f472b6", fontWeight: 700 }}>{totalHomework} task{totalHomework !== 1 ? "s" : ""} pending</span>
            {" "}across{" "}
            <span style={{ color: "#60a5fa", fontWeight: 700 }}>{subjects.length} subject{subjects.length !== 1 ? "s" : ""}</span>.
          </motion.p>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40 }}>
          {[
            { label: "Subjects", rawVal: subjects.length, icon: "📚", color: "#60a5fa" },
            { label: "Tasks Pending", rawVal: totalHomework, icon: "📝", color: "#fb923c" },
            { label: "Notifications", rawVal: unreadCount, icon: "🔔", color: "#34d399" },
            { label: "Submitted", rawVal: 0, icon: "✅", color: "#fbbf24" },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.12 + i * 0.08, type: "spring", stiffness: 260, damping: 22 }}>
              <TiltCard>
                <motion.div
                  whileHover={{ borderColor: `${s.color}50`, boxShadow: `0 10px 36px ${s.color}15` }}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "20px 22px", position: "relative", overflow: "hidden", transition: "border-color 0.25s, box-shadow 0.25s" }}>
                  <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.3 }}
                    style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: "50%", background: `${s.color}20`, filter: "blur(28px)", pointerEvents: "none" }} />
                  <motion.span
                    animate={{ rotate: [0, -6, 6, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 + i * 1.5 }}
                    style={{ fontSize: 22, display: "block", marginBottom: 12 }}>{s.icon}</motion.span>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 28, color: "#fff", letterSpacing: "-0.02em", marginBottom: 4 }}>
                    <Counter to={s.rawVal} delay={0.16 + i * 0.08} />
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{s.label}</div>
                  <motion.div
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.09, ease: [0.25, 1, 0.5, 1] }}
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}80, transparent)`, transformOrigin: "left", borderRadius: "0 0 18px 18px" }} />
                </motion.div>
              </TiltCard>
            </motion.div>
          ))}
        </div>

        {/* ── BOTTOM GRID: Subjects + Right column ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

          {/* Subject Overview */}
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.45 }}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "24px 26px" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>
                My Subjects
              </h2>
              <motion.button
                whileHover={{ color: "#818cf8" }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/student/tasks")}
                style={{ background: "none", border: "none", color: "#6366f1", fontSize: 12, fontWeight: 600, transition: "color 0.2s" }}>
                View all tasks →
              </motion.button>
            </div>

            {loading ? (
              <div style={{ color: "#475569", fontSize: 14, textAlign: "center", padding: "32px 0" }}>Loading your subjects…</div>
            ) : subjects.length === 0 ? (
              <div style={{ color: "#475569", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏫</div>
                No subjects yet. Ask your teacher to enroll you in a class.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {subjects.map((s, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.42 + i * 0.07 }}
                    whileHover={{ x: 4 }}
                    onClick={() => navigate(`/student/tasks/${s.name.toLowerCase().replace(/\s+/g, "-")}`)}
                    style={{ display: "grid", gridTemplateColumns: "26px 1fr 120px 36px", alignItems: "center", gap: 14, cursor: "pointer", transition: "all 0.2s" }}>

                    <span style={{ fontSize: 18 }}>{s.icon}</span>

                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>{s.name}</div>
                      <Bar value={s.pending_homework > 0 ? 60 : 100} color={s.color} delay={0.48 + i * 0.07} />
                    </div>

                    <div style={{ textAlign: "right", fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                      {s.teacher_name || ""}
                    </div>

                    <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 11, color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}28`, borderRadius: 7, padding: "3px 0", textAlign: "center" }}>
                      {s.pending_homework > 0 ? `${s.pending_homework} due` : "✓"}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column" }}>

            {/* Notifications preview */}
            <motion.div
              initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.42, duration: 0.45 }}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "20px 22px" }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14 }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span style={{ background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "2px 7px" }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <motion.button
                  whileHover={{ color: "#818cf8" }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/student/notifications")}
                  style={{ background: "none", border: "none", color: "#6366f1", fontSize: 12, fontWeight: 600, transition: "color 0.2s" }}>
                  See all →
                </motion.button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {notifications.length === 0 ? (
                  <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "16px 0" }}>All caught up! 🎉</div>
                ) : (
                  notifications.map((n, i) => (
                    <motion.div key={n.id || i}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 + i * 0.07 }}
                      whileHover={{ background: "rgba(255,255,255,0.04)", x: 3 }}
                      style={{ display: "flex", gap: 11, padding: "10px 8px", borderRadius: 10, borderLeft: !n.read ? "2px solid #6366f1" : "2px solid transparent", cursor: "pointer", transition: "all 0.18s" }}>
                      <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1.3 }}>
                        {NOTIF_ICONS[n.type] || "📬"}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: !n.read ? 700 : 500, color: !n.read ? "#e2e8f0" : "#94a3b8", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {n.payload?.message || n.type}
                        </div>
                        <div style={{ fontSize: 11, color: "#475569" }}>
                          {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                        </div>
                      </div>
                      {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", flexShrink: 0, alignSelf: "center", marginLeft: "auto", boxShadow: "0 0 8px #6366f1" }} />}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
