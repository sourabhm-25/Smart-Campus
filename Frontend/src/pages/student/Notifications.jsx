import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const NOTIF_ICONS = {
  homework_assigned: "📝",
  submission_graded: "🏆",
  enrollment_accepted: "✅",
  enrollment_rejected: "❌",
  plan_created: "📅",
  plan_updated: "🔄",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = "http://localhost:8000";
  const getToken = () => localStorage.getItem("access_token");

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    fetch(`${API}/notifications?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching notifications:", err);
        setLoading(false);
      });
  }, []);


  const markAsRead = async (notif) => {
    // Mark as read locally (backend endpoint if available)
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notif.id ? { ...n, read: true } : n
      )
    );
  };

  return (
    <div style={{ padding: "40px 32px" }}>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          marginBottom: 28,
        }}
      >
        Notifications
      </motion.h1>

      {/* Loading */}
      {loading ? (
        <div style={{ color: "#64748b", fontSize: 14 }}>
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ color: "#64748b", fontSize: 14 }}>
          You're all caught up 🎉
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id || i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{
                y: -4,
                borderColor: "#6366f150",
                boxShadow: "0 8px 24px rgba(99,102,241,0.15)",
              }}
              onClick={() => markAsRead(notif)}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: !notif.read
                  ? "1px solid rgba(99,102,241,0.4)"
                  : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "18px 22px",
                cursor: "pointer",
                transition: "all 0.25s",
                position: "relative",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.3 }}>
                {NOTIF_ICONS[notif.type] || "📬"}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: !notif.read ? 700 : 500,
                  color: !notif.read ? "#e2e8f0" : "#94a3b8",
                  marginBottom: 4,
                  fontSize: 14,
                  textTransform: "capitalize",
                }}>
                  {notif.type?.replace(/_/g, " ") || "Notification"}
                </div>

                <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6, lineHeight: 1.5 }}>
                  {notif.payload?.message || notif.payload?.subject || ""}
                </div>

                <div style={{ fontSize: 11, color: "#475569" }}>
                  {notif.created_at ? new Date(notif.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                </div>
              </div>

              {/* Unread dot */}
              {!notif.read && (
                <div style={{
                  width: 8, height: 8,
                  borderRadius: "50%",
                  background: "#6366f1",
                  boxShadow: "0 0 8px #6366f1",
                  flexShrink: 0,
                  marginTop: 6,
                }} />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}