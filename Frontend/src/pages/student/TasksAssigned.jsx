import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function TasksAssigned() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // 🔹 Simulating backend API call
    const timer = setTimeout(() => {
      setSubjects([
        {
          id: "mathematics",
          name: "Mathematics",
          icon: "📐",
          tasks: 4,
          color: "#60a5fa",
        },
        {
          id: "science",
          name: "Science",
          icon: "🔬",
          tasks: 3,
          color: "#34d399",
        },
        {
          id: "english",
          name: "English",
          icon: "📖",
          tasks: 2,
          color: "#a78bfa",
        },
        {
          id: "social",
          name: "Social Studies",
          icon: "🌍",
          tasks: 1,
          color: "#fb923c",
        },
      ]);

      /*
      When backend is ready, replace setTimeout with:
      
      fetch(`/api/student/${studentId}/subjects`)
        .then(res => res.json())
        .then(data => {
          setSubjects(data);
          setLoading(false);
        });
      */
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "#64748b" }}>
        Loading subjects...
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>

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
        Tasks Assigned
      </motion.h1>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 18,
        }}
      >
        {subjects.map((subject, i) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{
              y: -6,
              borderColor: `${subject.color}50`,
              boxShadow: `0 10px 30px ${subject.color}20`,
            }}
            onClick={() =>
              navigate(`/student/tasks/${subject.id}`)
            }
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18,
              padding: "24px",
              cursor: "pointer",
              transition: "all 0.25s",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 16 }}>
              {subject.icon}
            </div>

            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              {subject.name}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#64748b",
              }}
            >
              {subject.tasks} Tasks Assigned
            </div>

            {/* Accent Line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              style={{
                marginTop: 18,
                height: 2,
                background: subject.color,
                transformOrigin: "left",
                borderRadius: 99,
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}