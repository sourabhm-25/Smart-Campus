import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

const NOTIF_META = {
  homework_assigned:    { icon: "📝", label: "Homework Assigned",    bg: "#d8e8f4",  border: "#8bb7d8"  },
  submission_graded:    { icon: "🏆", label: "Submission Graded",    bg: "#d1fae5",  border: "#34d399"  },
  enrollment_accepted:  { icon: "✅", label: "Enrollment Accepted",  bg: "#d1fae5",  border: "#34d399"  },
  enrollment_rejected:  { icon: "❌", label: "Enrollment Rejected",  bg: "#fee2e2",  border: "#f87171"  },
  enrollment_request:   { icon: "🙋", label: "Enrollment Request",   bg: "#FFECA8",  border: "#f6b94c"  },
  plan_created:         { icon: "📅", label: "Plan Created",          bg: "#f1d8e6",  border: "#d8a0c4"  },
  plan_updated:         { icon: "🔄", label: "Plan Updated",          bg: "#ede9fe",  border: "#a78bfa"  },
};

const getMeta = (type) => NOTIF_META[type] || { icon: "📬", label: "Notification", bg: "#f8fafc", border: "#071521" };

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35, ease: [0.25, 1, 0.5, 1] },
});

export default function TeacherNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "unread" | "read"

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    fetch(`${API}/notifications?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setNotifications(data.notifications || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching notifications:", err);
        setLoading(false);
      });
  }, []);

  const markAsRead = (notif) => {
    setNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
    );
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "read")   return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 760, fontFamily: "'DM Sans', sans-serif", color: "#071521" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,700;9..40,800;9..40,900&family=Sora:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Header ── */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
          Account
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: "clamp(22px, 3vw, 28px)", color: "#071521", margin: 0 }}>
              🔔 Notifications
            </h1>
            {unreadCount > 0 && (
              <p style={{ fontSize: 13, color: "#3F6E8F", fontWeight: 700, marginTop: 4 }}>
                You have <strong style={{ color: "#b45309" }}>{unreadCount} unread</strong> notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                padding: "8px 18px", fontSize: 12, fontWeight: 900,
                background: "#FFECA8", border: "3px solid #071521",
                borderRadius: 10, cursor: "pointer", color: "#071521",
                boxShadow: "3px 3px 0 #071521",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "5px 5px 0 #071521"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "3px 3px 0 #071521"}
            >
              ✓ Mark all read
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Filter tabs ── */}
      <motion.div {...fadeUp(0.06)} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { id: "all",    label: `All (${notifications.length})` },
          { id: "unread", label: `Unread (${unreadCount})` },
          { id: "read",   label: `Read (${notifications.length - unreadCount})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: "8px 16px", fontSize: 12, fontWeight: 900,
              border: "3px solid #071521", borderRadius: 10, cursor: "pointer",
              background: filter === tab.id ? "#071521" : "#ffffff",
              color: filter === tab.id ? "#FFECA8" : "#071521",
              boxShadow: filter === tab.id ? "3px 3px 0 #d8a0c4" : "2px 2px 0 #d8e8f4",
              transition: "all 0.15s",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >{tab.label}</button>
        ))}
      </motion.div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#3F6E8F" }}>Loading notifications…</div>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div {...fadeUp(0.1)} style={{
          background: "#ffffff", border: "4px solid #071521",
          borderRadius: 20, padding: "60px 40px",
          boxShadow: "6px 6px 0 #d8e8f4",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 900, color: "#071521", marginBottom: 8 }}>
            {filter === "unread" ? "No unread notifications!" : "You're all caught up!"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#3F6E8F" }}>
            New notifications will appear here
          </div>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((notif, i) => {
            const meta = getMeta(notif.type);
            return (
              <motion.div
                key={notif.id || i}
                {...fadeUp(i * 0.05)}
                whileHover={{ y: -3, boxShadow: "6px 6px 0 #071521" }}
                onClick={() => markAsRead(notif)}
                style={{
                  background: notif.read ? "#ffffff" : meta.bg,
                  border: notif.read ? "3px solid #071521" : `3px solid ${meta.border}`,
                  borderRadius: 16,
                  padding: "18px 22px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex", gap: 16, alignItems: "flex-start",
                  boxShadow: notif.read ? "4px 4px 0 #d8e8f4" : `4px 4px 0 #071521`,
                  position: "relative",
                }}
              >
                {/* Icon bubble */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: notif.read ? "#f8fafc" : "#ffffff",
                  border: "3px solid #071521",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, boxShadow: "2px 2px 0 #071521",
                }}>
                  {meta.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 900, color: "#071521",
                    marginBottom: 5, fontSize: 15,
                    fontFamily: "'Sora', sans-serif",
                  }}>
                    {meta.label}
                  </div>

                  <div style={{ fontSize: 13, color: "#1C3F57", fontWeight: 700, marginBottom: 8, lineHeight: 1.5 }}>
                    {notif.payload?.message || notif.payload?.subject || "—"}
                  </div>

                  <div style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 800 }}>
                    {notif.created_at
                      ? new Date(notif.created_at).toLocaleString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>

                {/* Unread dot */}
                {!notif.read && (
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: "#f6b94c", border: "2px solid #071521",
                    flexShrink: 0, marginTop: 4,
                  }} />
                )}

                {/* Type badge */}
                <span style={{
                  position: "absolute", top: 14, right: 52,
                  fontSize: 9, fontWeight: 900, padding: "2px 8px",
                  background: "#ffffff", border: "2px solid #071521",
                  borderRadius: 6, color: "#071521",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  {notif.type?.replace(/_/g, " ") || "notif"}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
