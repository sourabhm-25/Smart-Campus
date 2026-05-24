import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Home, ClipboardList, CheckCircle, Kanban, Bell, User } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: <Home size={22} strokeWidth={3} />, path: "/student" },
  { label: "Tasks Assigned", icon: <ClipboardList size={22} strokeWidth={3} />, path: "/student/tasks" },
  { label: "Tasks Submitted", icon: <CheckCircle size={22} strokeWidth={3} />, path: "/student/submitted" },
  { label: "Kanban Board", icon: <Kanban size={22} strokeWidth={3} />, path: "/student/kanban" },
  { label: "Notifications", icon: <Bell size={22} strokeWidth={3} />, path: "/student/notifications" },
  { label: "Profile", icon: <User size={22} strokeWidth={3} />, path: "/student/profile" },
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
    <div className="sc-dashboard-skin student-layout" style={{
      display: "flex",
      height: "100vh",
      background: "#FFF5D6",
      fontFamily: "'DM Sans', sans-serif",
      color: "#071521",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #F6B94C; border-radius: 99px; border: 2px solid #FFF5D6; }
        ::-webkit-scrollbar-track { background: transparent; }
        a { text-decoration: none; }
        .student-layout .student-topbar {
          background: rgba(255,245,214,0.88) !important;
        }
        @media (max-width: 640px) {
          .student-shell { min-width: 0; }
          .student-sidebar { width: 76px !important; border-radius: 0 24px 24px 0 !important; }
          .student-sidebar-logo-text,
          .student-sidebar-label,
          .student-collapse-label { display: none !important; }
          .student-sidebar nav { padding: 12px 8px !important; }
          .student-topbar { padding: 14px 16px !important; gap: 12px; }
          .student-topbar-date { display: none !important; }
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <motion.aside
        className="student-sidebar"
        animate={{ width: collapsed ? 68 : 224 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          height: "100vh",
          background: "#FFECA8",
          borderRight: "4px solid #071521",
          borderRadius: "0 40px 40px 0",
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
          borderBottom: "4px solid #071521",
          justifyContent: collapsed ? "center" : "flex-start",
          flexShrink: 0,
        }}>
          <motion.img
            src="/logo.png"
            alt="Logo"
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 8 }}
            style={{ width: 28, height: 28, flexShrink: 0, display: "block", objectFit: "contain" }}
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="student-sidebar-logo-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 18, color: "#071521", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
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
                    borderRadius: 24,
                    justifyContent: collapsed ? "center" : "flex-start",
                    position: "relative",
                    cursor: "pointer",
                    background: "transparent",
                    transition: "all 0.2s",
                  }}>

                  {/* Sliding active pill */}
                  {active && (
                    <motion.div
                      layoutId="activeBar"
                      style={{
                        position: "absolute", inset: 0,
                        borderRadius: 24,
                        background: "#F6B94C",
                        border: "3px solid #071521",
                        boxShadow: "4px 4px 0px #0B1E2D",
                        zIndex: 0,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
                        className="student-sidebar-label"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          fontSize: 16,
                          fontWeight: active ? 800 : 600,
                          color: active ? "#071521" : "#102A3C",
                          whiteSpace: "nowrap",
                          transition: "color 0.2s",
                          zIndex: 1,
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
        <div style={{ padding: "16px", borderTop: "4px solid #071521", flexShrink: 0 }}>
          <motion.button
            whileHover={{ y: -2, boxShadow: "4px 4px 0px #071521" }}
            whileTap={{ scale: 0.94, y: 0, boxShadow: "0px 0px 0px #071521" }}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: "100%", padding: "12px",
              borderRadius: 24,
              background: "#6FA8DC",
              border: "3px solid #071521",
              color: "#071521", fontSize: 14, fontWeight: 800,
              cursor: "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}>
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              style={{ display: "inline-block", fontSize: 14 }}>←</motion.span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  className="student-collapse-label"
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
      <div className="student-shell" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Top bar */}
        <div className="student-topbar" style={{
          flexShrink: 0,
          backdropFilter: "blur(16px)",
          borderBottom: "4px solid #071521",
          padding: "16px 32px",
          background: "rgba(255,245,214,0.85)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{currentPage?.icon}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#071521", fontFamily: "'Sora', sans-serif" }}>
              {currentPage?.label ?? "SmartCampus"}
            </span>
          </div>
          <span className="student-topbar-date" style={{ fontSize: 14, color: "#1C3F57", fontWeight: 700 }}>Thu, Feb 19 · 2026</span>
        </div>

        {/* Page — animated on route change */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <motion.div
            className="sc-page-frame"
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
