import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.38, ease: [0.25, 1, 0.5, 1] },
});

const classColors = ["#818cf8", "#34d399", "#22d3ee", "#f59e0b", "#c084fc", "#fb7185"];

/* ── Glass Card ── */
const GlassCard = ({ children, style = {}, delay = 0 }) => (
  <motion.div
    {...fadeUp(delay)}
    style={{
      borderRadius: 16,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(8px)",
      padding: "22px 24px",
      ...style,
    }}
  >
    {children}
  </motion.div>
);

/* ── Section Header ── */
function SH({ title, count, color = "#818cf8", icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      <span style={{
        fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 800,
        color: "#e2e8f0", letterSpacing: "-0.01em",
      }}>{title}</span>
      {count !== undefined && (
        <span style={{
          fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
          background: `${color}20`, border: `1px solid ${color}40`, color,
        }}>{count}</span>
      )}
    </div>
  );
}

/* ── Toast ── */
function Toast({ msg, type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 999,
        padding: "12px 20px", borderRadius: 12,
        background: type === "success" ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
        border: `1px solid ${type === "success" ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)"}`,
        backdropFilter: "blur(16px)",
        color: type === "success" ? "#34d399" : "#f87171",
        fontSize: 13, fontWeight: 600,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {type === "success" ? "✓ " : "✗ "}{msg}
    </motion.div>
  );
}

/* ── Enrollment Request Card ── */
function EnrollmentCard({ req, index, onAccept, onReject, processing }) {
  const color = classColors[index % classColors.length];
  const initials = req.student_name ? req.student_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  const timeAgo = req.requested_at ? new Date(req.requested_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

  return (
    <motion.div
      {...fadeUp(0.08 + index * 0.05)}
      layout
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.045)",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 800, color,
      }}>{initials}</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>
          {req.student_name || "Unknown Student"}
        </div>
        <div style={{ fontSize: 11, color: "#475569", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span>📧 {req.student_email || "—"}</span>
          {req.grade && <span>📚 Grade {req.grade}</span>}
          {req.school && <span>🏫 {req.school}</span>}
          <span>🕐 {timeAgo}</span>
        </div>
        {req.my_subjects && req.my_subjects.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {req.my_subjects.map(s => (
              <span key={s} style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                background: `${color}15`, border: `1px solid ${color}30`, color,
              }}>{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {/* Accept — use first available subject */}
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 4px 16px rgba(52,211,153,0.3)" }}
          whileTap={{ scale: 0.96 }}
          disabled={processing === req.id}
          onClick={() => onAccept(req)}
          style={{
            padding: "8px 16px", borderRadius: 9, cursor: processing === req.id ? "not-allowed" : "pointer",
            background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)",
            color: "#34d399", fontSize: 12, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            opacity: processing === req.id ? 0.5 : 1,
            transition: "all 0.2s",
          }}
        >
          {processing === req.id ? "…" : "✓ Accept"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 4px 16px rgba(248,113,113,0.25)" }}
          whileTap={{ scale: 0.96 }}
          disabled={processing === req.id}
          onClick={() => onReject(req)}
          style={{
            padding: "8px 16px", borderRadius: 9, cursor: processing === req.id ? "not-allowed" : "pointer",
            background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)",
            color: "#f87171", fontSize: 12, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            opacity: processing === req.id ? 0.5 : 1,
            transition: "all 0.2s",
          }}
        >
          ✗ Reject
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Student Row ── */
function StudentRow({ student, index, classInfo }) {
  const color = classColors[index % classColors.length];
  const initials = student.name ? student.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <motion.div
      {...fadeUp(0.06 + index * 0.04)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "13px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* Rank */}
      <span style={{ width: 28, fontSize: 11, color: "#334155", fontWeight: 600, textAlign: "center" }}>
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 800, color,
      }}>{initials}</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>
          {student.name}
        </div>
        <div style={{ fontSize: 11, color: "#475569" }}>{student.email}</div>
      </div>

      {/* Grade badge */}
      {(classInfo?.grade || student.grade) && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
          background: `${color}15`, border: `1px solid ${color}30`, color,
          flexShrink: 0,
        }}>
          Grade {classInfo?.grade || student.grade}
        </span>
      )}

      {/* Subjects */}
      {classInfo?.subjects?.map(s => (
        <span key={s} style={{
          fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 99,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          color: "#64748b", flexShrink: 0,
        }}>{s}</span>
      ))}

      {/* Status dot */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
        <span style={{ fontSize: 10, color: "#34d399", fontWeight: 600 }}>Enrolled</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function Students() {
  const [requests, setRequests] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingReq, setLoadingReq] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeClass, setActiveClass] = useState("all");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const token = () => localStorage.getItem("access_token");
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  /* Fetch enrollment requests */
  const fetchRequests = async () => {
    try {
      setLoadingReq(true);
      const res = await axios.get(`${API_BASE}/teacher/enrollment-requests`, { headers: headers() });
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Failed to fetch enrollment requests:", err);
    } finally {
      setLoadingReq(false);
    }
  };

  /* Fetch teacher's classes + students */
  const fetchClasses = async () => {
    try {
      setLoadingStudents(true);
      const res = await axios.get(`${API_BASE}/teacher/my-classes`, { headers: headers() });
      setClasses(res.data.classes || []);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchClasses();
  }, []);

  /* Accept request */
  const handleAccept = async (req) => {
    const subject = req.my_subjects?.[0];
    if (!subject) {
      showToast("No subject found for this class", "error");
      return;
    }
    setProcessing(req.id);
    try {
      await axios.post(
        `${API_BASE}/teacher/enrollment-requests/${req.id}/accept`,
        { subject },
        { headers: headers() }
      );
      showToast(`${req.student_name} accepted into Grade ${req.grade || "class"}!`);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      fetchClasses(); // refresh enrolled list
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to accept request", "error");
    } finally {
      setProcessing(null);
    }
  };

  /* Reject request */
  const handleReject = async (req) => {
    setProcessing(req.id);
    try {
      await axios.post(
        `${API_BASE}/teacher/enrollment-requests/${req.id}/reject`,
        {},
        { headers: headers() }
      );
      showToast(`Request from ${req.student_name} rejected.`, "error");
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to reject request", "error");
    } finally {
      setProcessing(null);
    }
  };

  /* Flatten students with class info */
  const allStudents = classes.flatMap(cls =>
    (cls.students || []).map(s => ({ ...s, classInfo: cls }))
  );

  const filteredStudents = activeClass === "all"
    ? allStudents
    : allStudents.filter(s => s.classInfo?.id === activeClass);

  const totalStudents = allStudents.length;

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1100, fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
          Class Management
        </p>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(20px, 3vw, 26px)", color: "#fff", letterSpacing: "-0.03em", marginBottom: 6 }}>
          Students
        </h1>
        <p style={{ fontSize: 13, color: "#334155" }}>
          Manage enrollment requests and view your enrolled students
        </p>
      </motion.div>

      {/* ── SUMMARY STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Pending Requests", value: requests.length, color: "#f59e0b", icon: "🙋" },
          { label: "Total Students", value: totalStudents, color: "#818cf8", icon: "👥" },
          { label: "My Classes", value: classes.length, color: "#34d399", icon: "🏫" },
        ].map(({ label, value, color, icon }, i) => (
          <motion.div key={label} {...fadeUp(0.04 + i * 0.04)} style={{
            borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: "20px 22px",
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
              background: `linear-gradient(90deg, transparent, ${color}55, transparent)`,
            }} />
            <div style={{
              width: 46, height: 46, borderRadius: 12, flexShrink: 0,
              background: `${color}14`, border: `1px solid ${color}28`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>{icon}</div>
            <div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.04em" }}>
                {value}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
                {label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ══════════════════════════════════
          SECTION 1: ENROLLMENT REQUESTS
      ══════════════════════════════════ */}
      <GlassCard delay={0.14} style={{ marginBottom: 24 }}>
        <SH title="Enrollment Requests" count={requests.length} color="#f59e0b" icon="🙋" />

        {loadingReq ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#334155", fontSize: 13 }}>
            Loading requests…
          </div>
        ) : requests.length === 0 ? (
          <motion.div
            {...fadeUp(0.1)}
            style={{
              textAlign: "center", padding: "48px 0",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>No pending requests</div>
            <div style={{ fontSize: 12, color: "#334155" }}>All enrollment requests have been reviewed</div>
          </motion.div>
        ) : (
          <div style={{ margin: "0 -24px" }}>
            <AnimatePresence>
              {requests.map((req, i) => (
                <EnrollmentCard
                  key={req.id}
                  req={req}
                  index={i}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  processing={processing}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </GlassCard>

      {/* ══════════════════════════════════
          SECTION 2: ENROLLED STUDENTS
      ══════════════════════════════════ */}
      <GlassCard delay={0.2}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <SH title="Enrolled Students" count={filteredStudents.length} color="#818cf8" icon="👥" />

          {/* Class filter tabs */}
          {classes.length > 1 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setActiveClass("all")}
                style={{
                  padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
                  background: activeClass === "all" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                  border: activeClass === "all" ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  color: activeClass === "all" ? "#a5b4fc" : "#475569",
                  transition: "all 0.2s",
                }}
              >All</motion.button>
              {classes.map((cls, i) => {
                const color = classColors[i % classColors.length];
                const isActive = activeClass === cls.id;
                return (
                  <motion.button
                    key={cls.id}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveClass(cls.id)}
                    style={{
                      padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
                      background: isActive ? `${color}20` : "rgba(255,255,255,0.03)",
                      border: isActive ? `1px solid ${color}40` : "1px solid rgba(255,255,255,0.07)",
                      color: isActive ? color : "#475569",
                      transition: "all 0.2s",
                    }}
                  >Grade {cls.grade}</motion.button>
                );
              })}
            </div>
          )}
        </div>

        {loadingStudents ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#334155", fontSize: 13 }}>
            Loading students…
          </div>
        ) : filteredStudents.length === 0 ? (
          <motion.div
            {...fadeUp(0.1)}
            style={{ textAlign: "center", padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>👥</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>No students enrolled yet</div>
            <div style={{ fontSize: 12, color: "#334155" }}>Accept enrollment requests above to add students</div>
          </motion.div>
        ) : (
          <div style={{ margin: "0 -24px" }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "28px 38px 1fr auto auto auto",
              gap: 14, padding: "10px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}>
              {["#", "", "Student", "Grade", "Subject", "Status"].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
              ))}
            </div>

            <AnimatePresence>
              {filteredStudents.map((s, i) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  index={i}
                  classInfo={s.classInfo}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </GlassCard>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
