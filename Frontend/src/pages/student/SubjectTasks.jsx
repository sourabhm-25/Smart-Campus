import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function SubjectTasks() {
    const { subjectId } = useParams();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ Format subject title properly (outside useEffect)
    const formattedTitle =
        subjectId
            ?.replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());

    useEffect(() => {
        setLoading(true);

        const timer = setTimeout(() => {
            setTasks([
                { id: 1, title: "Chapter 1 Worksheet", due: "Feb 22", status: "Pending" },
                { id: 2, title: "Homework Assignment", due: "Feb 25", status: "Pending" },
            ]);
            setLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, [subjectId]);

    return (
        <div style={{ padding: "40px 32px" }}>

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
                {formattedTitle} Tasks
            </motion.h1>

            {loading ? (
                <div style={{ color: "#64748b", fontSize: 14 }}>
                    Loading tasks...
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {tasks.map((task, i) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{
                                borderColor: "#6366f150",
                                boxShadow: "0 8px 24px rgba(99,102,241,0.15)",
                                y: -4,
                            }}
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                                borderRadius: 16,
                                padding: "18px 22px",
                                transition: "all 0.25s",
                            }}
                        >
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>
                                {task.title}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                                Due: {task.due}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}