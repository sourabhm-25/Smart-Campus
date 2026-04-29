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
        if (d.notifications) {
          setNotifications(d.notifications);
        }
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
    <div style={{ padding: "40px 40px 64px", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
      `}</style>

      <div style={{ maxWidth: 600 }}>
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: 40,
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              border: "2px dashed rgba(255,255,255,0.1)",
              textAlign: "center",
            }}>
            <p style={{ fontSize: 16, color: "#64748b" }}>No notifications yet</p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: notif.read ? "rgba(255,255,255,0.02)" : "rgba(99,102,241,0.1)",
                  border: notif.read ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(99,102,241,0.3)",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>
                  {notificationIcons[notif.type] || "📢"}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                    {notif.title}
                  </h4>
                  <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>
                    {notif.message}
                  </p>
                  <p style={{ fontSize: 11, color: "#64748b" }}>
                    {formatTime(notif.created_at)}
                  </p>
                </div>
                {!notif.read && (
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#6366f1",
                    flexShrink: 0,
                    marginTop: 6,
                  }} />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
