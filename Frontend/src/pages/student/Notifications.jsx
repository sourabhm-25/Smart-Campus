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
    <div style={{ padding: "40px 32px", color: "#071521" }}>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 900,
          fontSize: 32,
          marginBottom: 28,
          color: "#071521"
        }}
      >
        Notifications
      </motion.h1>

      {/* Loading */}
      {loading ? (
        <div style={{ color: "#071521", fontSize: 16, fontWeight: 800 }}>
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ color: "#071521", fontSize: 16, fontWeight: 800 }}>
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
                borderColor: "#071521",
                boxShadow: "4px 4px 0px #071521",
                scale: 1.01
              }}
              onClick={() => markAsRead(notif)}
              style={{
                background: "#FFFFFF",
                border: !notif.read
                  ? "3px solid #EFA83F"
                  : "3px solid #071521",
                borderRadius: 20,
                padding: "18px 22px",
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                boxShadow: "2px 2px 0px #071521"
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.3 }}>
                {NOTIF_ICONS[notif.type] || "📬"}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 900,
                  color: !notif.read ? "#071521" : "#1C3F57",
                  marginBottom: 6,
                  fontSize: 16,
                  textTransform: "capitalize",
                }}>
                  {notif.type?.replace(/_/g, " ") || "Notification"}
                </div>

                <div style={{ fontSize: 14, color: "#1C3F57", fontWeight: 600, marginBottom: 8, lineHeight: 1.5 }}>
                  {notif.payload?.message || notif.payload?.subject || ""}
                </div>

                <div style={{ fontSize: 12, color: "#1C3F57", fontWeight: 700 }}>
                  {notif.created_at ? new Date(notif.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                </div>
              </div>

              {/* Unread dot */}
              {!notif.read && (
                <div style={{
                  width: 12, height: 12,
                  borderRadius: "50%",
                  background: "#F6B94C",
                  border: "2px solid #071521",
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