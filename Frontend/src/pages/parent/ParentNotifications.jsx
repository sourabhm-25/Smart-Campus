import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

const notificationIcons = {
  homework_assigned: "📝",
  submission_graded: "🏆",
  child_enrolled: "✅",
  assignment_due: "⏰",
  test_scheduled: "📋",
};

const notifColors = {
  homework_assigned: { bg: "#fff0b8", border: "#f4d98e", dot: "#f4a97e" },
  submission_graded: { bg: "#d1fae5", border: "#34d399", dot: "#1a7a5e" },
  child_enrolled:   { bg: "#d8e8f4", border: "#8bb7d8", dot: "#1d4ed8" },
  assignment_due:   { bg: "#ffe4e6", border: "#f472b6", dot: "#9f1239" },
  test_scheduled:   { bg: "#f1d8e6", border: "#d8a0c4", dot: "#9f1239" },
};

export default function ParentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API}/parent/notifications?limit=20`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.notifications) setNotifications(d.notifications);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ padding: "40px 40px 64px", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#273c75" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        .notif-card:hover { transform: translateX(4px); }
      `}</style>

      <div style={{ maxWidth: 640 }}>
        {loading ? (
          <p style={{ color: "#3F6E8F", fontWeight: 800 }}>Loading notifications…</p>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: 48,
              borderRadius: 8,
              background: "#ffffff",
              border: "4px dashed #273c75",
              textAlign: "center",
            }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <p style={{ fontSize: 16, color: "#334155", fontWeight: 800 }}>No notifications yet</p>
            <p style={{ fontSize: 13, color: "#3F6E8F", fontWeight: 700, marginTop: 6 }}>
              You'll be notified about your children's activity here
            </p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notifications.map((notif, i) => {
              const palette = notifColors[notif.type] || { bg: "#fff0b8", border: "#f4d98e", dot: "#f4a97e" };
              return (
                <motion.div
                  key={notif.id}
                  className="notif-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: 18,
                    borderRadius: 8,
                    background: notif.read ? "#ffffff" : palette.bg,
                    border: notif.read ? "3px solid #d8e8f4" : `3px solid ${palette.border}`,
                    boxShadow: notif.read ? "4px 4px 0 #e8f0f8" : `4px 4px 0 ${palette.border}`,
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    transition: "all 0.2s ease",
                    cursor: "default",
                  }}>
                  {/* Icon */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 8,
                    background: notif.read ? "#e8f0f8" : palette.border,
                    border: `2px solid #273c75`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {notificationIcons[notif.type] || "📢"}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 900, color: "#273c75", marginBottom: 4 }}>
                      {notif.title}
                    </h4>
                    <p style={{ fontSize: 13, color: "#334155", fontWeight: 700, marginBottom: 6, lineHeight: 1.5 }}>
                      {notif.message}
                    </p>
                    <p style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 700 }}>
                      🕐 {formatTime(notif.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <div style={{
                      width: 10, height: 10,
                      borderRadius: "50%",
                      background: palette.dot,
                      border: "2px solid #273c75",
                      flexShrink: 0,
                      marginTop: 4,
                    }} />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
