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

/* ── Subject Picker Modal ── */
function SubjectModal({ req, onConfirm, onClose }) {
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");
  const subjects = req?.my_subjects || [];
  const value = selected === "__custom__" ? custom.trim() : selected;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: 380, borderRadius: 18,
          background: "rgba(12,11,30,0.98)",
          border: "1px solid rgba(99,102,241,0.3)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          padding: "28px 28px 24px",
        }}
      >
        <div style={{ fontSize: 18, marginBottom: 8 }}>📚</div>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 800, color: "#e2e8f0", marginBottom: 6 }}>
          Select Subject to Accept
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>
          Accepting <strong style={{ color: "#c7d2fe" }}>{req?.student_name}</strong> — Grade {req?.grade}
        </div>

        {subjects.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {subjects.map(s => (
              <motion.div key={s} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(s)}
                style={{
                  padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                  background: selected === s ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                  border: selected === s ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  color: selected === s ? "#a5b4fc" : "#94a3b8",
                  fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                }}>{s}</motion.div>
            ))}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setSelected("__custom__")}
              style={{
                padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                background: selected === "__custom__" ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)",
                border: selected === "__custom__" ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.06)",
                color: "#475569", fontSize: 12, fontWeight: 600, transition: "all 0.15s",
              }}>+ Enter custom subject</motion.div>
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>No subjects detected. Enter manually:</div>
          </div>
        )}

        {(selected === "__custom__" || subjects.length === 0) && (
          <input autoFocus value={custom} onChange={e => setCustom(e.target.value)}
            placeholder="e.g. Mathematics"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, marginBottom: 16,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.3)",
              color: "#e2e8f0", fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif",
            }}
          />
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            disabled={!value} onClick={() => value && onConfirm(value)}
            style={{
              flex: 1, padding: "11px", borderRadius: 10, cursor: value ? "pointer" : "not-allowed",
              background: value ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.03)",
              border: value ? "1px solid rgba(52,211,153,0.35)" : "1px solid rgba(255,255,255,0.07)",
              color: value ? "#34d399" : "#334155", fontSize: 13, fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
            }}>✓ Confirm Accept</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClose}
            style={{
              padding: "11px 18px", borderRadius: 10, cursor: "pointer",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#475569", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
            }}>Cancel</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Enrollment Request Card (image 2 style) ── */
function RequestCard({ req, index, onAccept, onReject, processing }) {
  const color = classColors[index % classColors.length];
  const initials = req.student_name
    ? req.student_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const isPending = processing === req.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "16px 18px",
        marginBottom: 12,
      }}
    >
      {/* Top: avatar + info + time */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 800, color,
        }}>{initials}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>
            {req.student_name || "Unknown Student"}
          </div>
          <div style={{ fontSize: 11, color: "#475569" }}>
            Applied for: {req.my_subjects?.join(", ") || req.grade ? `Grade ${req.grade}` : "—"}
          </div>
          {req.student_email && (
            <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{req.student_email}</div>
          )}
        </div>

        {req.requested_at && (
          <span style={{ fontSize: 10, color: "#334155", whiteSpace: "nowrap", flexShrink: 0 }}>
            {new Date(req.requested_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          disabled={isPending}
          onClick={() => onAccept(req)}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 10, cursor: isPending ? "not-allowed" : "pointer",
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.28)",
            color: "#818cf8", fontSize: 12, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            opacity: isPending ? 0.5 : 1, transition: "all 0.2s",
          }}
          onMouseEnter={e => { if (!isPending) e.currentTarget.style.background = "rgba(99,102,241,0.22)"; }}
          onMouseLeave={e => { if (!isPending) e.currentTarget.style.background = "rgba(99,102,241,0.12)"; }}
        >
          {isPending ? "…" : "✓  Accept"}
        </button>

        <button
          disabled={isPending}
          onClick={() => onReject(req)}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 10, cursor: isPending ? "not-allowed" : "pointer",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#475569", fontSize: 12, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            opacity: isPending ? 0.5 : 1, transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            if (!isPending) {
              e.currentTarget.style.background = "rgba(248,113,113,0.1)";
              e.currentTarget.style.color = "#f87171";
              e.currentTarget.style.borderColor = "rgba(248,113,113,0.25)";
            }
          }}
          onMouseLeave={e => {
            if (!isPending) {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.color = "#475569";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }
          }}
        >
          ✕  Reject
        </button>
      </div>
    </motion.div>
  );
}

/* ── Enrolled Students Table (image 2 style) ── */
function StudentsTable({ students, classes, activeClass, setActiveClass, loading }) {
  const filtered = activeClass === "all"
    ? students
    : students.filter(s => s.classInfo?.id === activeClass);

  return (
    <div style={{
      borderRadius: 18,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      height: "100%",
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 22px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.01)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>
            Enrolled Students
          </span>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
            background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", color: "#818cf8",
          }}>{filtered.length}</span>
        </div>

        {/* Class filter */}
        {classes.length > 1 && (
          <div style={{ display: "flex", gap: 5 }}>
            {[{ id: "all", label: "All" }, ...classes.map((c, i) => ({ id: c.id, label: `Grade ${c.grade}`, color: classColors[i % classColors.length] }))].map(tab => {
              const isActive = activeClass === tab.id;
              const color = tab.color || "#818cf8";
              return (
                <button key={tab.id} onClick={() => setActiveClass(tab.id)}
                  style={{
                    padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontSize: 10, fontWeight: 700,
                    background: isActive ? `${color}20` : "rgba(255,255,255,0.03)",
                    border: isActive ? `1px solid ${color}40` : "1px solid rgba(255,255,255,0.07)",
                    color: isActive ? color : "#475569", transition: "all 0.2s",
                  }}>{tab.label}</button>
              );
            })}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 13 }}>
          Loading students…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>👥</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>No students yet</div>
          <div style={{ fontSize: 11, color: "#334155" }}>Accept requests to add students</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto", flex: 1 }}>
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                {["Student Name", "Subject", "Progress", "Status", ""].map(h => (
                  <th key={h} style={{
                    padding: "10px 18px", textAlign: "left",
                    fontSize: 9, fontWeight: 700, color: "#334155",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const color = classColors[i % classColors.length];
                const initials = s.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
                const subjects = s.classInfo?.subjects || [];
                const progress = s.progress ?? Math.floor(50 + Math.random() * 45);

                return (
                  <motion.tr
                    key={s.id || i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s", cursor: "default" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Name */}
                    <td style={{ padding: "13px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: `${color}18`, border: `1px solid ${color}30`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 800, color,
                        }}>{initials}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{s.name}</div>
                          {s.email && <div style={{ fontSize: 10, color: "#334155", marginTop: 1 }}>{s.email}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td style={{ padding: "13px 18px", fontSize: 12, color: "#64748b" }}>
                      {subjects.length > 0 ? subjects.join(", ") : s.classInfo?.grade ? `Grade ${s.classInfo.grade}` : "—"}
                    </td>

                    {/* Progress */}
                    <td style={{ padding: "13px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 80, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ delay: 0.3 + i * 0.04, duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
                            style={{
                              height: "100%", borderRadius: 99,
                              background: `linear-gradient(90deg, #6366f1, #8b5cf6)`,
                              boxShadow: "0 0 6px rgba(99,102,241,0.5)",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: "#475569", minWidth: 28 }}>{progress}%</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "13px 18px" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                        background: "rgba(52,211,153,0.1)", color: "#34d399",
                        border: "1px solid rgba(52,211,153,0.2)",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>Active</span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: "13px 18px" }}>
                      <span style={{ fontSize: 14, color: "#334155", cursor: "pointer", transition: "color 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#818cf8"}
                        onMouseLeave={e => e.currentTarget.style.color = "#334155"}
                      >↗</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Quick Stats Row ── */
function QuickStats({ requests, students, classes }) {
  const stats = [
    { label: "Pending Requests", value: requests.length, icon: "🙋", color: "#f59e0b" },
    { label: "Total Students", value: students.length, icon: "👥", color: "#818cf8" },
    { label: "My Classes", value: classes.length, icon: "🏫", color: "#34d399" },
    { label: "Active Students", value: students.length, icon: "✅", color: "#22d3ee" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
      {stats.map(({ label, value, icon, color }, i) => (
        <motion.div key={label} {...fadeUp(0.04 + i * 0.05)} style={{
          borderRadius: 14,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          padding: "18px 20px",
          display: "flex", alignItems: "center", gap: 14,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
            background: `linear-gradient(90deg, transparent, ${color}55, transparent)`,
          }} />
          <div style={{
            width: 42, height: 42, borderRadius: 11, flexShrink: 0,
            background: `${color}14`, border: `1px solid ${color}28`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>{icon}</div>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.04em" }}>
              {value}
            </div>
            <div style={{ fontSize: 9, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 4 }}>
              {label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
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
  const [subjectModal, setSubjectModal] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

  const fetchRequests = async () => {
    try {
      setLoadingReq(true);
      const res = await axios.get(`${API_BASE}/teacher/enrollment-requests`, { headers: authHeaders() });
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Failed to fetch enrollment requests:", err);
    } finally {
      setLoadingReq(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoadingStudents(true);
      const res = await axios.get(`${API_BASE}/teacher/my-classes`, { headers: authHeaders() });
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

  const handleAccept = (req) => setSubjectModal(req);

  const confirmAccept = async (subject) => {
    const req = subjectModal;
    setSubjectModal(null);
    setProcessing(req.id);
    try {
      await axios.post(`${API_BASE}/teacher/enrollment-requests/${req.id}/accept`, { subject }, { headers: authHeaders() });
      showToast(`${req.student_name} accepted!`);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      fetchClasses();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to accept", "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (req) => {
    setProcessing(req.id);
    try {
      await axios.post(`${API_BASE}/teacher/enrollment-requests/${req.id}/reject`, {}, { headers: authHeaders() });
      showToast(`Request from ${req.student_name} rejected.`, "error");
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to reject", "error");
    } finally {
      setProcessing(null);
    }
  };

  const allStudents = classes.flatMap(cls => (cls.students || []).map(s => ({ ...s, classInfo: cls })));

  return (
    <div style={{ padding: "36px 40px 60px", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        button { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* ── Page Header ── */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          Class Management
        </p>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(20px, 3vw, 28px)", color: "#fff", letterSpacing: "-0.03em", marginBottom: 6 }}>
          Students
        </h1>
        <p style={{ fontSize: 13, color: "#475569" }}>
          Manage enrollment requests and view your enrolled students
        </p>
      </motion.div>

      {/* ── Quick Stats ── */}
      <QuickStats requests={requests} students={allStudents} classes={classes} />

      {/* ── Main 2-col Grid (image 2 layout) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "stretch" }}>

        {/* LEFT: Enrollment Requests */}
        <motion.div {...fadeUp(0.12)} style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>
                Enrollment Requests
              </span>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
                background: requests.length > 0 ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)",
                border: requests.length > 0 ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.08)",
                color: requests.length > 0 ? "#f59e0b" : "#334155",
              }}>{requests.length}</span>
            </div>
            {requests.length > 3 && (
              <span style={{ fontSize: 11, color: "#6366f1", cursor: "pointer", fontWeight: 600 }}>View All →</span>
            )}
          </div>

          {loadingReq ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#334155", fontSize: 13 }}>Loading…</div>
          ) : requests.length === 0 ? (
            <div style={{
              borderRadius: 16, background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              flex: 1, textAlign: "center", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>No pending requests</div>
              <div style={{ fontSize: 12, color: "#334155" }}>All enrollment requests have been reviewed</div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {requests.map((req, i) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  index={i}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  processing={processing}
                />
              ))}
            </AnimatePresence>
          )}
        </motion.div>

        {/* RIGHT: Enrolled Students Table */}
        <motion.div {...fadeUp(0.16)} style={{ minWidth: 0, overflow: "hidden" }}>
          <StudentsTable
            students={allStudents}
            classes={classes}
            activeClass={activeClass}
            setActiveClass={setActiveClass}
            loading={loadingStudents}
          />
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast.msg} type={toast.type} />}
      </AnimatePresence>

      {/* Subject Modal */}
      <AnimatePresence>
        {subjectModal && (
          <SubjectModal req={subjectModal} onConfirm={confirmAccept} onClose={() => setSubjectModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}