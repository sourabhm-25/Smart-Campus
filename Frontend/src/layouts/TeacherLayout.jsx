import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";


/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard", icon: "⬡", emoji: "🏠", path: "/teacher", badge: null },
  { label: "Assign Task", icon: "✦", emoji: "✏️", path: "/teacher/task", badge: null },
  { label: "Test", icon: "◈", emoji: "🧪", path: "/teacher/test", badge: null },
  { label: "Kanban", icon: "⊞", emoji: "📌", path: "/teacher/kanban", badge: null },
  { label: "Submissions", icon: "◎", emoji: "📋", path: "/teacher/submissions", badge: "3" },
  { label: "Students", icon: "◉", emoji: "👥", path: "/teacher/students", badge: null },
  { label: "Analytics", icon: "◈", emoji: "📊", path: "/teacher/analytics", badge: null },
];

const BOTTOM_ITEMS = [
  { label: "Notifications", icon: "🔔", path: "/teacher/notifications", badge: "5" },
  { label: "Profile", icon: "👤", path: "/teacher/profile", badge: null },
  { label: "Settings", icon: "⚙️", path: "/teacher/settings", badge: null },
];

/* ─────────────────────────────────────────
   MICRO: LIVE CLOCK
───────────────────────────────────────── */
function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const h = t.getHours(), m = t.getMinutes(), ampm = h >= 12 ? "PM" : "AM";
  const hh = String(h % 12 || 12).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: "'Sora', monospace", fontSize: 13, fontWeight: 700, color: "#c7d2fe", letterSpacing: "0.05em" }}>
        {hh}:{mm} <span style={{ fontSize: 10, color: "#6366f1" }}>{ampm}</span>
      </div>
      <div style={{ fontSize: 10, color: "#334155", fontWeight: 500, letterSpacing: "0.04em", marginTop: 1 }}>
        {t.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MICRO: NOTIFICATION BELL
───────────────────────────────────────── */
function NotifBell({ count = 5 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const notifs = [
    { id: 1, text: "Riya submitted Math homework", time: "2m ago", type: "submit" },
    { id: 2, text: "3 new enrollment requests", time: "10m ago", type: "enroll" },
    { id: 3, text: "Amit's test auto-graded: 87%", time: "1h ago", type: "grade" },
    { id: 4, text: "Homework deadline in 2 hours", time: "1h ago", type: "deadline" },
    { id: 5, text: "Class 8A average improved by 12%", time: "3h ago", type: "stat" },
  ];

  const typeColor = { submit: "#34d399", enroll: "#f59e0b", grade: "#818cf8", deadline: "#f87171", stat: "#22d3ee" };
  const typeIcon = { submit: "📥", enroll: "🙋", grade: "✅", deadline: "⏰", stat: "📈" };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        style={{
          position: "relative", width: 38, height: 38, borderRadius: 10,
          background: open ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s",
        }}>
        <span style={{ fontSize: 15 }}>🔔</span>
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: "absolute", top: -4, right: -4,
              width: 17, height: 17, borderRadius: "50%",
              background: "linear-gradient(135deg, #f87171, #ef4444)",
              fontSize: 9, fontWeight: 800, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid #080714",
            }}>{count}</motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
            style={{
              position: "absolute", right: 0, top: 46, zIndex: 100,
              width: 320, borderRadius: 16,
              background: "rgba(15,14,35,0.98)",
              border: "1px solid rgba(99,102,241,0.25)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)",
              overflow: "hidden",
            }}>
            <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Sora', sans-serif" }}>Notifications</span>
              <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, cursor: "pointer" }}>Mark all read</span>
            </div>
            {notifs.map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                style={{
                  display: "flex", gap: 12, padding: "12px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.07)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: `${typeColor[n.type]}18`,
                  border: `1px solid ${typeColor[n.type]}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>{typeIcon[n.type]}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 500, lineHeight: 1.5 }}>{n.text}</p>
                  <p style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>{n.time}</p>
                </div>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: typeColor[n.type], flexShrink: 0, marginTop: 5 }} />
              </motion.div>
            ))}
            <div style={{ padding: "10px 18px", textAlign: "center" }}>
              <span style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, cursor: "pointer" }}>View all notifications →</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────
   MICRO: QUICK ACTIONS PALETTE
───────────────────────────────────────── */
function QuickActions() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    // Keyboard shortcut: Cmd+K
    const kb = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o); } };
    document.addEventListener("keydown", kb);
    return () => { document.removeEventListener("mousedown", fn); document.removeEventListener("keydown", kb); };
  }, []);

  const actions = [
    { label: "Assign New Task", icon: "✏️", path: "/teacher/task", color: "#6366f1" },
    { label: "Create a Test", icon: "🧪", path: "/teacher/test", color: "#8b5cf6" },
    { label: "View Kanban Board", icon: "📌", path: "/teacher/kanban", color: "#22d3ee" },
    { label: "Check Submissions", icon: "📋", path: "/teacher/submissions", color: "#34d399" },
    { label: "Student List", icon: "👥", path: "/teacher/students", color: "#f59e0b" },
    { label: "View Analytics", icon: "📊", path: "/teacher/analytics", color: "#f87171" },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <motion.button
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 14px", borderRadius: 10,
          background: "rgba(99,102,241,0.15)",
          border: "1px solid rgba(99,102,241,0.3)",
          color: "#a5b4fc", fontSize: 12, fontWeight: 700,
          cursor: "pointer", letterSpacing: "0.02em",
          fontFamily: "'Sora', sans-serif",
          transition: "all 0.2s",
        }}>
        <span style={{ fontSize: 14 }}>⚡</span>
        Quick Actions
        <kbd style={{ fontSize: 9, padding: "2px 5px", borderRadius: 4, background: "rgba(255,255,255,0.08)", color: "#475569", border: "1px solid rgba(255,255,255,0.1)" }}>⌘K</kbd>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute", left: 0, top: 46, zIndex: 100,
              width: 260, borderRadius: 16,
              background: "rgba(15,14,35,0.98)",
              border: "1px solid rgba(99,102,241,0.25)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              padding: "8px",
            }}>
            {actions.map((a, i) => (
              <motion.div key={a.label}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => { navigate(a.path); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: `${a.color}20`, border: `1px solid ${a.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>{a.icon}</div>
                <span style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>{a.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#334155" }}>→</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────
   MICRO: MINI PROGRESS RING
───────────────────────────────────────── */
function ProgressRing({ pct = 72, size = 36, stroke = 3, color = "#6366f1" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }} />
    </svg>
  );
}

/* ─────────────────────────────────────────
   MICRO: TOP HEADER STATS BAR
───────────────────────────────────────── */
function HeaderStats({ data }) {
  const stats = [
    { label: "Classes", value: data.classes.toString(), icon: "🏫", color: "#818cf8" },
    { label: "Students", value: data.students.toString(), icon: "👥", color: "#34d399" },
    { label: "Pending", value: data.pending.toString(), icon: "⏳", color: "#f59e0b" },
    { label: "Avg Score", value: data.avg + "%", icon: "🎯", color: "#22d3ee" },
  ];
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {stats.map((s) => (
        <div key={s.label} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "6px 12px", borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{ fontSize: 13 }}>{s.icon}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: "'Sora', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 9, color: "#475569", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   MICRO: BREADCRUMB
───────────────────────────────────────── */
function Breadcrumb({ current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "#334155", fontWeight: 500 }}>SmartCampus</span>
      <span style={{ fontSize: 11, color: "#1e293b" }}>›</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8" }}>{current?.label ?? "Dashboard"}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   MICRO: TEACHER AVATAR + STATUS
───────────────────────────────────────── */
function TeacherAvatar({ collapsed }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: collapsed ? "14px 0" : "14px 14px",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      justifyContent: collapsed ? "center" : "flex-start",
      flexShrink: 0, cursor: "pointer",
      transition: "background 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 700, color: "#fff",
          fontFamily: "'Sora', sans-serif",
          boxShadow: "0 0 0 2px rgba(99,102,241,0.35)",
        }}>S</div>
        <div style={{
          position: "absolute", bottom: 0, right: 0,
          width: 9, height: 9, borderRadius: "50%",
          background: "#34d399", border: "2px solid #080714",
        }} />
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap" }}>Sourabh</div>
            <div style={{ fontSize: 10, color: "#34d399", fontWeight: 600, letterSpacing: "0.04em" }}>● Online</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────
   MICRO: NAV ITEM
───────────────────────────────────────── */
function NavItem({ item, active, collapsed }) {
  return (
    <NavLink to={item.path}>
      <motion.div
        whileHover={{ x: collapsed ? 0 : 4, background: active ? undefined : "rgba(255,255,255,0.04)" }}
        whileTap={{ scale: 0.96 }}
        title={collapsed ? item.label : undefined}
        style={{
          display: "flex", alignItems: "center",
          gap: collapsed ? 0 : 11,
          padding: collapsed ? "11px 0" : "10px 12px",
          borderRadius: 11,
          justifyContent: collapsed ? "center" : "flex-start",
          position: "relative", cursor: "pointer",
          background: active ? "rgba(99,102,241,0.15)" : "transparent",
          border: active ? "1px solid rgba(99,102,241,0.28)" : "1px solid transparent",
          transition: "background 0.18s, border-color 0.18s",
          overflow: "hidden",
        }}>

        {/* Active glow bar */}
        {active && (
          <motion.div layoutId="sidebarActiveBar"
            style={{
              position: "absolute", left: 0, top: "15%", bottom: "15%",
              width: 3, borderRadius: 99, background: "#6366f1",
              boxShadow: "0 0 12px rgba(99,102,241,0.8)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }} />
        )}

        {/* Active shimmer */}
        {active && (
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent)",
              pointerEvents: "none",
            }} />
        )}

        {/* Emoji icon */}
        <motion.span
          animate={active ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.4 }}
          style={{ fontSize: 16, flexShrink: 0, lineHeight: 1 }}>
          {item.emoji}
        </motion.span>

        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.14 }}
              style={{
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? "#c7d2fe" : "#4b5563",
                whiteSpace: "nowrap", flex: 1,
                transition: "color 0.18s",
              }}>
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        <AnimatePresence>
          {!collapsed && item.badge && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
              style={{
                fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 99,
                background: item.badge === "New"
                  ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                  : "linear-gradient(135deg, #f87171, #ef4444)",
                color: "#fff", letterSpacing: "0.04em",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}>
              {item.badge}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </NavLink>
  );
}

/* ─────────────────────────────────────────
   SIDEBAR SECTION LABEL
───────────────────────────────────────── */
function SectionLabel({ label, collapsed }) {
  if (collapsed) return <div style={{ height: 14, borderBottom: "1px solid rgba(255,255,255,0.04)", margin: "6px 0" }} />;
  return (
    <div style={{ padding: "6px 12px 4px", fontSize: 9, fontWeight: 800, color: "#1e293b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
      {label}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN LAYOUT
───────────────────────────────────────── */
const TeacherLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [statsData, setStatsData] = useState({ classes: 0, students: 0, pending: 0, avg: 0, pendingTasksCount: 0 });

  useEffect(() => { setPageReady(true); }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        
        const [classesRes, hwRes] = await Promise.all([
          fetch("http://localhost:8000/teacher/my-classes", { headers }).then(r => r.json()),
          fetch("http://localhost:8000/teacher/homework", { headers }).then(r => r.json())
        ]);
        
        const rawClasses = classesRes.classes || [];
        const rawHomeworks = hwRes.homework || [];
        
        const totalClasses = rawClasses.length;
        const totalStudents = rawClasses.reduce((acc, c) => acc + (c.student_count || 0), 0);
        
        let totalPending = 0;
        let overallSum = 0;
        let hwCount = 0;
        let pTasks = 0;
        
        rawHomeworks.forEach(hw => {
           const st = hw.student_count || 0;
           const sub = hw.submission_count || 0;
           totalPending += Math.max(0, st - sub);
           overallSum += (hw.avg_score || 0);
           if (st - sub > 0) pTasks++;
           hwCount++;
        });
        
        const avgScore = hwCount > 0 ? Math.round(overallSum / hwCount) : 0;
        
        setStatsData({
          classes: totalClasses,
          students: totalStudents,
          pending: totalPending,
          avg: avgScore,
          pendingTasksCount: pTasks
        });
      } catch (err) {
        console.error("Failed to fetch layout stats", err);
      }
    };
    fetchStats();
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === "/teacher/dashboard") return location.pathname === "/teacher/dashboard";
    return location.pathname.startsWith(path);
  };

  const currentPage = [...NAV_ITEMS, ...BOTTOM_ITEMS].find((n) => isActive(n.path));

  return (
    <div style={{
      display: "flex", height: "100vh",
      background: "radial-gradient(ellipse 80% 60% at 50% 0%, #1e1b4b 0%, #0f0e23 55%, #080714 100%)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e2e8f0",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        a { text-decoration: none; }
        ::selection { background: rgba(99,102,241,0.3); }
      `}</style>

      {/* ── SIDEBAR ── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        style={{
          height: "100vh",
          background: "rgba(8,7,20,0.7)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)",
          display: "flex", flexDirection: "column",
          flexShrink: 0, overflow: "hidden",
          position: "relative", zIndex: 20,
          boxShadow: "4px 0 32px rgba(0,0,0,0.3)",
        }}>

        {/* Logo */}
        <div style={{
          padding: collapsed ? "20px 0" : "20px 16px",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          justifyContent: collapsed ? "center" : "flex-start",
          flexShrink: 0,
        }}>
          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 8 }}
            style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
            }}>
            🎓
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  SmartCampus
                </div>
                <div style={{ fontSize: 9, color: "#6366f1", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Teacher Portal
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── QUICK STATS PILL (expanded only) ── */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
              <div style={{ padding: "12px 16px" }}>
                <div style={{
                  borderRadius: 12, padding: "10px 14px",
                  background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}>
                  <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Today</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {[{ v: statsData.classes.toString(), l: "Classes" }, { v: statsData.pending.toString(), l: "Pending" }, { v: statsData.avg + "%", l: "Avg" }].map(s => (
                      <div key={s.l} style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 800, color: "#c7d2fe" }}>{s.v}</div>
                        <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>

          <SectionLabel label="Main" collapsed={collapsed} />
          {NAV_ITEMS.slice(0, 4).map(item => (
            <NavItem key={item.path} item={item} active={isActive(item.path)} collapsed={collapsed} />
          ))}

          <SectionLabel label="Class Management" collapsed={collapsed} />
          {NAV_ITEMS.slice(4).map(item => {
            const dynamicItem = { ...item };
            if (item.label === "Submissions") {
              dynamicItem.badge = statsData.pendingTasksCount > 0 ? statsData.pendingTasksCount.toString() : null;
            }
            return <NavItem key={dynamicItem.path} item={dynamicItem} active={isActive(dynamicItem.path)} collapsed={collapsed} />;
          })}

          <SectionLabel label="Account" collapsed={collapsed} />
          {BOTTOM_ITEMS.map(item => (
            <NavItem key={item.path} item={item} active={isActive(item.path)} collapsed={collapsed} />
          ))}
        </nav>

        {/* Teacher Avatar */}
        <TeacherAvatar collapsed={collapsed} />

        {/* Collapse toggle */}
        <div style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <motion.button
            whileHover={{ background: "rgba(255,255,255,0.06)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: "100%", padding: "9px", borderRadius: 10,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#334155", fontSize: 12, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 7, transition: "background 0.2s",
            }}>
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              style={{ display: "inline-block", fontSize: 13, color: "#6366f1" }}>
              ←
            </motion.span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ── TOP BAR ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: pageReady ? 1 : 0, y: pageReady ? 0 : -12 }}
          transition={{ duration: 0.4 }}
          style={{
            flexShrink: 0,
            background: "rgba(8,7,20,0.6)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "0 28px",
            height: 60,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 16,
          }}>

          {/* Left: Breadcrumb + Page */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
            <Breadcrumb current={currentPage} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{currentPage?.emoji ?? "🏠"}</span>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.01em" }}>
                {currentPage?.label ?? "Dashboard"}
              </span>
            </div>
          </div>

          {/* Center: Stats */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <HeaderStats data={statsData} />
          </div>

          {/* Right: Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <QuickActions />
            <NotifBell count={5} />
            <LiveClock />
          </div>
        </motion.div>

        {/* ── PROGRESS STRIP ── */}
        <div style={{ flexShrink: 0, height: 2, background: "rgba(255,255,255,0.03)", position: "relative", overflow: "hidden" }}>
          <motion.div
            key={location.pathname}
            initial={{ width: "0%", opacity: 1 }}
            animate={{ width: "100%", opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #6366f1, #8b5cf6, #22d3ee)",
              position: "absolute", left: 0, top: 0,
            }} />
        </div>

        {/* ── PAGE CONTENT ── */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              style={{ minHeight: "100%" }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── BOTTOM STATUS BAR ── */}
        <div style={{
          flexShrink: 0, height: 28,
          background: "rgba(4,4,14,0.7)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
              <span style={{ fontSize: 10, color: "#1e293b", fontWeight: 500 }}>API Connected</span>
            </div>
            <div style={{ fontSize: 10, color: "#1e293b" }}>MongoDB ● FastAPI v0.4.2</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 10, color: "#1e293b" }}>Term 2 · 2025–26</span>
            <span style={{ fontSize: 10, color: "#334155" }}>SmartCampus © 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherLayout;