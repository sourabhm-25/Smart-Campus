import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const student = JSON.parse(localStorage.getItem("student"));
    const studentId = student?.id;

    if (!studentId) {
      setLoading(false);
      return;
    }

    fetch(`/api/student/${studentId}/notifications`)
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching notifications:", err);
        setLoading(false);
      });

  }, []);


  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, unread: false } : n
        )
      );
    } catch (err) {
      console.error("Error marking notification as read", err);
    }
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
              key={notif.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{
                y: -4,
                borderColor: "#6366f150",
                boxShadow: "0 8px 24px rgba(99,102,241,0.15)",
              }}
              onClick={() => markAsRead(notif.id)}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: notif.unread
                  ? "1px solid rgba(99,102,241,0.4)"
                  : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "18px 22px",
                cursor: "pointer",
                transition: "all 0.25s",
                position: "relative",
              }}
            >
              {notif.unread && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 16,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#6366f1",
                    boxShadow: "0 0 8px #6366f1",
                  }}
                />
              )}

              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {notif.title}
              </div>

              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>
                {notif.message}
              </div>

              <div style={{ fontSize: 11, color: "#475569" }}>
                {notif.time}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}