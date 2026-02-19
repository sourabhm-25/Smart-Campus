import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", icon: "🏠", path: "/student" },
  { label: "Tasks Assigned", icon: "📋", path: "/student/tasks" },
  { label: "Tasks Submitted", icon: "✅", path: "/student/submitted" },
  { label: "Kanban Board", icon: "📌", path: "/student/kanban" },
  { label: "Notifications", icon: "🔔", path: "/student/notifications" },
  { label: "Profile", icon: "👤", path: "/student/profile" },
];

const StudentLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Match active: exact for dashboard index, startsWith for rest
  const isActive = (path) => {
    if (path === "/student") return location.pathname === "/student";
    return location.pathname.startsWith(path);
  };

  const currentPage = navItems.find((n) => isActive(n.path));

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "radial-gradient(ellipse 80% 60% at 50% 0%, #1e1b4b 0%, #0f0e23 55%, #080714 100%)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e2e8f0",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        a { text-decoration: none; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 224 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          height: "100vh",
          background: "rgba(255,255,255,0.025)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflow: "hidden",
          position: "relative",
          zIndex: 10,
        }}>

        {/* Logo */}
        <div style={{
          padding: collapsed ? "22px 0" : "22px 18px",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          justifyContent: collapsed ? "center" : "flex-start",
          flexShrink: 0,
        }}>
          <motion.span
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 8 }}
            style={{ fontSize: 22, flexShrink: 0, display: "block" }}>
            🎓
          </motion.span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                SmartCampus
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <NavLink key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: collapsed ? 0 : 3 }}
                  whileTap={{ scale: 0.96 }}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: collapsed ? "11px 0" : "11px 13px",
                    borderRadius: 11,
                    justifyContent: collapsed ? "center" : "flex-start",
                    position: "relative",
                    cursor: "pointer",
                    background: active ? "rgba(99,102,241,0.18)" : "transparent",
                    border: active ? "1px solid rgba(99,102,241,0.32)" : "1px solid transparent",
                    transition: "background 0.2s, border-color 0.2s",
                  }}>

                  {/* Sliding active bar */}
                  {active && (
                    <motion.div
                      layoutId="activeBar"
                      style={{
                        position: "absolute", left: 0, top: "18%", bottom: "18%",
                        width: 3, borderRadius: 99,
                        background: "#6366f1",
                        boxShadow: "0 0 10px #6366f1",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <motion.span
                    animate={active ? { scale: [1, 1.25, 1] } : {}}
                    transition={{ duration: 0.35 }}
                    style={{ fontSize: 18, flexShrink: 0 }}>
                    {item.icon}
                  </motion.span>

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          fontSize: 14,
                          fontWeight: active ? 700 : 500,
                          color: active ? "#c7d2fe" : "#64748b",
                          whiteSpace: "nowrap",
                          transition: "color 0.2s",
                        }}>
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <motion.button
            whileHover={{ background: "rgba(255,255,255,0.07)" }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: "100%", padding: "9px",
              borderRadius: 11,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#475569", fontSize: 13, fontWeight: 600,
              cursor: "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
              transition: "background 0.2s",
            }}>
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              style={{ display: "inline-block", fontSize: 14 }}>←</motion.span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}>
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{
          flexShrink: 0,
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "14px 32px",
          background: "rgba(8,7,20,0.55)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{currentPage?.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>
              {currentPage?.label ?? "SmartCampus"}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>Thu, Feb 19 · 2026</span>
        </div>

        {/* Page — animated on route change */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}>
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;