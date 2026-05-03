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
  const [totalSubmitted, setTotalSubmitted] = useState(0);
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
        setTotalSubmitted(d.total_submitted_homework ?? 0);

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
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#071521", position: "relative" }}>
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
            style={{ fontSize: 13, color: "#3F6E8F", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            {greeting}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, type: "spring", stiffness: 300, damping: 20 }}
            style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em", color: "#071521", marginBottom: 8 }}>
            Hey {studentName} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            style={{ fontSize: 16, color: "#1C3F57", fontWeight: 700 }}>
            You have{" "}
            <span style={{ color: "#EFA83F", fontWeight: 900 }}>{totalHomework} task{totalHomework !== 1 ? "s" : ""} pending</span>
            {" "}across{" "}
            <span style={{ color: "#3F6E8F", fontWeight: 900 }}>{subjects.length} subject{subjects.length !== 1 ? "s" : ""}</span>.
          </motion.p>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40 }}>
          {[
            { label: "Subjects", rawVal: subjects.length, icon: "📚", color: "#6FA8DC" },
            { label: "Tasks Pending", rawVal: totalHomework, icon: "📝", color: "#EFA83F" },
            { label: "Notifications", rawVal: unreadCount, icon: "🔔", color: "#F6B94C" },
            { label: "Submitted", rawVal: totalSubmitted, icon: "✅", color: "#F4C542" },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.12 + i * 0.08, type: "spring", stiffness: 260, damping: 22 }}>
              <TiltCard>
                <motion.div
                  whileHover={{ y: -4, boxShadow: `8px 8px 0px #071521` }}
                  style={{ background: "#FFFFFF", border: "4px solid #071521", borderRadius: 32, padding: "24px 22px", position: "relative", overflow: "hidden", transition: "all 0.25s", boxShadow: "4px 4px 0px #071521", cursor: "pointer" }}>
                  <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.3 }}
                    style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: "50%", background: `${s.color}20`, filter: "blur(28px)", pointerEvents: "none" }} />
                  <motion.span
                    animate={{ rotate: [0, -6, 6, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 + i * 1.5 }}
                    style={{ fontSize: 26, display: "block", marginBottom: 12 }}>{s.icon}</motion.span>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 32, color: "#071521", letterSpacing: "-0.02em", marginBottom: 4 }}>
                    <Counter to={s.rawVal} delay={0.16 + i * 0.08} />
                  </div>
                  <div style={{ fontSize: 13, color: "#1C3F57", fontWeight: 800 }}>{s.label}</div>
                  <motion.div
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.09, ease: [0.25, 1, 0.5, 1] }}
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, ${s.color}, transparent)`, transformOrigin: "left", borderRadius: "0 0 32px 32px" }} />
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
            style={{ background: "#FFECA8", border: "4px solid #071521", borderRadius: 32, padding: "28px 26px", boxShadow: "6px 6px 0px #071521" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 18, color: "#071521", letterSpacing: "-0.02em" }}>
                My Subjects
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/student/tasks")}
                style={{ background: "#071521", border: "none", color: "#FFECA8", fontSize: 12, fontWeight: 800, padding: "8px 16px", borderRadius: 16, transition: "all 0.2s" }}>
                View all tasks →
              </motion.button>
            </div>

            {loading ? (
              <div style={{ color: "#071521", fontSize: 16, fontWeight: 800, textAlign: "center", padding: "32px 0" }}>Loading your subjects…</div>
            ) : subjects.length === 0 ? (
              <div style={{ color: "#071521", fontSize: 16, fontWeight: 800, textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏫</div>
                No subjects yet. Ask your teacher to enroll you in a class.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {subjects.map((s, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.42 + i * 0.07 }}
                    whileHover={{ x: 6, scale: 1.01 }}
                    onClick={() => navigate("/student/tasks")}
                    style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 48px", alignItems: "center", gap: 14, cursor: "pointer", transition: "all 0.2s", background: "#FFFFFF", padding: "12px 16px", borderRadius: 20, border: "3px solid #071521", boxShadow: "4px 4px 0px #071521" }}>

                    <span style={{ fontSize: 24 }}>{s.icon}</span>

                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#071521", marginBottom: 6 }}>{s.name}</div>
                      <Bar value={s.pending_homework > 0 ? 60 : 100} color={s.color} delay={0.48 + i * 0.07} />
                    </div>

                    <div style={{ textAlign: "right", fontSize: 13, color: "#1C3F57", fontWeight: 700 }}>
                      {s.teacher_name || ""}
                    </div>

                    <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 12, color: "#071521", background: s.color, border: `2px solid #071521`, borderRadius: 10, padding: "4px 0", textAlign: "center" }}>
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
              style={{ background: "#B7DBFF", border: "4px solid #071521", borderRadius: 32, padding: "24px", boxShadow: "6px 6px 0px #071521" }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 16, color: "#071521" }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span style={{ background: "#EFA83F", border: "2px solid #071521", color: "#071521", fontSize: 12, fontWeight: 900, borderRadius: 99, padding: "2px 8px" }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/student/notifications")}
                  style={{ background: "#071521", border: "none", color: "#B7DBFF", fontSize: 12, fontWeight: 800, padding: "8px 12px", borderRadius: 16, transition: "all 0.2s" }}>
                  See all →
                </motion.button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {notifications.length === 0 ? (
                  <div style={{ color: "#071521", fontSize: 14, fontWeight: 700, textAlign: "center", padding: "16px 0" }}>All caught up! 🎉</div>
                ) : (
                  notifications.map((n, i) => (
                    <motion.div key={n.id || i}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 + i * 0.07 }}
                      whileHover={{ scale: 1.02, x: 4, boxShadow: "3px 3px 0px #071521" }}
                      style={{ display: "flex", gap: 11, padding: "12px", background: "#FFFFFF", borderRadius: 16, border: "3px solid #071521", cursor: "pointer", transition: "all 0.18s" }}>
                      <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.3 }}>
                        {NOTIF_ICONS[n.type] || "📬"}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#071521", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {n.payload?.message || n.type}
                        </div>
                        <div style={{ fontSize: 12, color: "#1C3F57", fontWeight: 700 }}>
                          {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                        </div>
                      </div>
                      {!n.read && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F6B94C", border: "2px solid #071521", flexShrink: 0, alignSelf: "center", marginLeft: "auto" }} />}
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
