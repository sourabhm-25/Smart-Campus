import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", icon: "🏠", path: "/parent" },
  { label: "Children", icon: "👨‍👩‍👧‍👦", path: "/parent/children" },
  { label: "Report Cards", icon: "📋", path: "/parent/report-cards" },
  { label: "Progress", icon: "📊", path: "/parent/progress" },
  { label: "Notifications", icon: "🔔", path: "/parent/notifications" },
  { label: "Profile", icon: "👤", path: "/parent/profile" },
];

const ParentLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Match active: exact for dashboard index, startsWith for rest
  const isActive = (path) => {
    if (path === "/parent") return location.pathname === "/parent";
    return location.pathname.startsWith(path);
  };

  const currentPage = navItems.find((n) => isActive(n.path));

  return (
    <div className="sc-dashboard-skin parent-layout" style={{
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
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        a { text-decoration: none; }
        .parent-layout .parent-sidebar {
          background: #FFECA8 !important;
          border-right: 4px solid #071521 !important;
          border-radius: 0 34px 34px 0 !important;
        }
        .parent-layout .parent-topbar {
          background: rgba(255,245,214,0.88) !important;
          border-bottom: 4px solid #071521 !important;
        }
        .parent-layout .parent-sidebar [style*="color: #fff"],
        .parent-layout .parent-sidebar [style*="color: #64748b"],
        .parent-layout .parent-sidebar [style*="color: #475569"] {
          color: #071521 !important;
        }
        .parent-layout .parent-sidebar [style*="rgba(99,102,241,0.18)"] {
          background: #f6b94c !important;
          border: 3px solid #071521 !important;
          box-shadow: 4px 4px 0 #071521 !important;
        }
        @media (max-width: 640px) {
          .parent-shell { min-width: 0; }
          .parent-sidebar { width: 76px !important; }
          .parent-sidebar-logo-text,
          .parent-sidebar-label,
          .parent-collapse-label { display: none !important; }
          .parent-sidebar nav { padding: 12px 8px !important; }
          .parent-topbar { padding: 14px 16px !important; }
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <motion.aside
        className="parent-sidebar"
        animate={{ width: collapsed ? 68 : 224 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          height: "100vh",
          background: "#FFECA8",
          borderRight: "4px solid #071521",
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
                className="parent-sidebar-logo-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 16, color: "#071521", letterSpacing: "0", whiteSpace: "nowrap" }}>
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
                    background: active ? "#f6b94c" : "transparent",
                    border: active ? "3px solid #071521" : "1px solid transparent",
                    boxShadow: active ? "4px 4px 0 #071521" : "none",
                    transition: "background 0.2s, border-color 0.2s",
                  }}>

                  {/* Sliding active bar */}
                  {active && (
                    <motion.div
                      layoutId="activeBar"
                      style={{
                        position: "absolute", left: 0, top: "18%", bottom: "18%",
                        width: 4, borderRadius: 99,
                        background: "#273c75",
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
                        className="parent-sidebar-label"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          fontSize: 14,
                          fontWeight: active ? 900 : 600,
                          color: active ? "#071521" : "#3F5A6E",
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
            whileHover={{ background: "#f6b94c" }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: "100%", padding: "9px",
              borderRadius: 8,
              background: "rgba(39,60,117,0.08)",
              border: "2px solid #071521",
              color: "#071521", fontSize: 13, fontWeight: 800,
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
                  className="parent-collapse-label"
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
      <div className="parent-shell" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Top bar */}
        <div className="parent-topbar" style={{
          flexShrink: 0,
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "14px 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#071521" }}>
            {currentPage?.label || "Parent Dashboard"}
          </h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={() => { localStorage.removeItem("access_token"); localStorage.removeItem("user"); window.location.href = "/login"; }}
              style={{
              padding: "8px 18px",
              borderRadius: 8,
              background: "#f4d98e",
              border: "3px solid #071521",
              color: "#071521",
              fontSize: 13,
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "3px 3px 0 #d8a0c4",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }} onMouseEnter={(e) => {
              e.currentTarget.style.background = "#d8a0c4";
            }} onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f4d98e";
            }}>
              Logout
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="sc-page-frame" style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ParentLayout;
