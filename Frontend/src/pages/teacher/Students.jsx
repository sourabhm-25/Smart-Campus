import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.38, ease: [0.25, 1, 0.5, 1] },
});

const classColors = ["#8bb7d8", "#34d399", "#f6b94c", "#d8a0c4", "#a78bfa", "#fb7185"];
const classBgs    = ["#d8e8f4", "#d1fae5", "#FFECA8", "#f1d8e6", "#ede9fe", "#fee2e2"];

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
        background: type === "success" ? "#d1fae5" : "#fee2e2",
        border: `3px solid ${type === "success" ? "#34d399" : "#f87171"}`,
        color: type === "success" ? "#15803d" : "#b91c1c",
        fontSize: 13, fontWeight: 800,
        boxShadow: "4px 4px 0 #071521",
        fontFamily: "'DM Sans', sans-serif",
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
        background: "rgba(7,21,33,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: 400, borderRadius: 20,
          background: "#ffffff",
          border: "4px solid #071521",
          boxShadow: "8px 8px 0 #8bb7d8",
          padding: "28px 28px 24px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 8 }}>📚</div>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 900, color: "#071521", marginBottom: 6 }}>
          Select Subject to Accept
        </div>
        <div style={{ fontSize: 12, color: "#3F6E8F", marginBottom: 20, fontWeight: 700 }}>
          Accepting <strong style={{ color: "#071521" }}>{req?.student_name}</strong> — Grade {req?.grade}
        </div>

        {subjects.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {subjects.map(s => (
              <motion.div key={s} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(s)}
                style={{
                  padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                  background: selected === s ? "#FFECA8" : "#f8fafc",
                  border: selected === s ? "3px solid #071521" : "2px solid #e2e8f0",
                  color: "#071521",
                  fontSize: 13, fontWeight: 800, transition: "all 0.15s",
                  boxShadow: selected === s ? "3px 3px 0 #071521" : "none",
                }}>{s}</motion.div>
            ))}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setSelected("__custom__")}
              style={{
                padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                background: selected === "__custom__" ? "#FFF5D6" : "#f8fafc",
                border: selected === "__custom__" ? "3px solid #071521" : "2px dashed #d1d5db",
                color: "#3F6E8F", fontSize: 12, fontWeight: 800, transition: "all 0.15s",
              }}>+ Enter custom subject</motion.div>
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#3F6E8F", fontWeight: 700, marginBottom: 8 }}>No subjects detected. Enter manually:</div>
          </div>
        )}

        {(selected === "__custom__" || subjects.length === 0) && (
          <input autoFocus value={custom} onChange={e => setCustom(e.target.value)}
            placeholder="e.g. Mathematics"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, marginBottom: 16,
              background: "#ffffff", border: "3px solid #071521",
              color: "#071521", fontSize: 13, outline: "none",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "3px 3px 0 #d8e8f4",
            }}
          />
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            disabled={!value} onClick={() => value && onConfirm(value)}
            style={{
              flex: 1, padding: "12px", borderRadius: 10, cursor: value ? "pointer" : "not-allowed",
              background: value ? "#d1fae5" : "#f1f5f9",
              border: `3px solid ${value ? "#34d399" : "#e2e8f0"}`,
              color: value ? "#15803d" : "#94a3b8",
              fontSize: 13, fontWeight: 900,
              fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
              boxShadow: value ? "3px 3px 0 #071521" : "none",
            }}>✓ Confirm Accept</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClose}
            style={{
              padding: "12px 20px", borderRadius: 10, cursor: "pointer",
              background: "#fee2e2", border: "3px solid #f87171",
              color: "#b91c1c", fontSize: 13, fontWeight: 900,
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: "3px 3px 0 #071521",
            }}>Cancel</motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Enrollment Request Card ── */
function RequestCard({ req, index, onAccept, onReject, processing }) {
  const color  = classColors[index % classColors.length];
  const bg     = classBgs[index % classBgs.length];
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
        background: "#ffffff",
        border: "3px solid #071521",
        boxShadow: "4px 4px 0 #8bb7d8",
        padding: "16px 18px",
        marginBottom: 12,
      }}
    >
      {/* Top: avatar + info + time */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: bg, border: "3px solid #071521",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 900, color: "#071521",
          boxShadow: "2px 2px 0 #071521",
        }}>{initials}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#071521", marginBottom: 3 }}>
            {req.student_name || "Unknown Student"}
          </div>
          <div style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 700 }}>
            Applied for: {req.my_subjects?.join(", ") || req.grade ? `Grade ${req.grade}` : "—"}
          </div>
          {req.student_email && (
            <div style={{ fontSize: 10, color: "#3F6E8F", marginTop: 2, fontWeight: 700 }}>{req.student_email}</div>
          )}
        </div>

        {req.requested_at && (
          <span style={{ fontSize: 10, color: "#3F6E8F", whiteSpace: "nowrap", flexShrink: 0, fontWeight: 800, background: "#FFF5D6", border: "2px solid #071521", borderRadius: 6, padding: "2px 7px" }}>
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
            flex: 1, padding: "9px 0", borderRadius: 10,
            cursor: isPending ? "not-allowed" : "pointer",
            background: "#d1fae5", border: "3px solid #34d399",
            color: "#15803d", fontSize: 12, fontWeight: 900,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "2px 2px 0 #071521",
            opacity: isPending ? 0.5 : 1, transition: "all 0.2s",
          }}
          onMouseEnter={e => { if (!isPending) e.currentTarget.style.boxShadow = "4px 4px 0 #071521"; }}
          onMouseLeave={e => { if (!isPending) e.currentTarget.style.boxShadow = "2px 2px 0 #071521"; }}
        >
          {isPending ? "…" : "✓  Accept"}
        </button>

        <button
          disabled={isPending}
          onClick={() => onReject(req)}
          style={{
            flex: 1, padding: "9px 0", borderRadius: 10,
            cursor: isPending ? "not-allowed" : "pointer",
            background: "#fee2e2", border: "3px solid #f87171",
            color: "#b91c1c", fontSize: 12, fontWeight: 900,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "2px 2px 0 #071521",
            opacity: isPending ? 0.5 : 1, transition: "all 0.2s",
          }}
          onMouseEnter={e => { if (!isPending) e.currentTarget.style.boxShadow = "4px 4px 0 #071521"; }}
          onMouseLeave={e => { if (!isPending) e.currentTarget.style.boxShadow = "2px 2px 0 #071521"; }}
        >
          ✕  Reject
        </button>
      </div>
    </motion.div>
  );
}

/* ── Enrolled Students Table ── */
function StudentsTable({ students, classes, activeClass, setActiveClass, loading }) {
  const filtered = activeClass === "all"
    ? students
    : students.filter(s => s.classInfo?.id === activeClass);

  return (
    <div style={{
      borderRadius: 18,
      background: "#ffffff",
      border: "4px solid #071521",
      boxShadow: "6px 6px 0 #8bb7d8",
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      height: "100%",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "3px solid #071521",
        background: "#FFECA8",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 900, color: "#071521" }}>
            Enrolled Students
          </span>
          <span style={{
            fontSize: 10, fontWeight: 900, padding: "2px 9px", borderRadius: 99,
            background: "#ffffff", border: "2px solid #071521", color: "#071521",
            boxShadow: "1px 1px 0 #071521",
          }}>{filtered.length}</span>
        </div>

        {/* Class filter */}
        {classes.length > 1 && (
          <div style={{ display: "flex", gap: 5 }}>
            {[{ id: "all", label: "All", bg: "#FFF5D6" },
              ...classes.map((c, i) => ({ id: c.id, label: `Grade ${c.grade}`, bg: classBgs[i % classBgs.length] }))
            ].map(tab => {
              const isActive = activeClass === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveClass(tab.id)}
                  style={{
                    padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 900,
                    background: isActive ? tab.bg : "#f8fafc",
                    border: isActive ? "2px solid #071521" : "2px solid #e2e8f0",
                    color: "#071521", transition: "all 0.2s",
                    boxShadow: isActive ? "2px 2px 0 #071521" : "none",
                  }}>{tab.label}</button>
              );
            })}
          </div>
        )}
      </div>

      {/* Table content */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#3F6E8F", fontSize: 13, fontWeight: 800 }}>
          Loading students…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 0" }}>
          <div style={{ fontSize: 36 }}>👥</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#071521" }}>No students yet</div>
          <div style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 700 }}>Accept requests to add students</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto", flex: 1 }}>
          <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: "2px dashed rgba(7,21,33,0.12)", background: "#FFF5D6" }}>
                {["Student Name", "Subject", "Progress", "Status", ""].map(h => (
                  <th key={h} style={{
                    padding: "10px 18px", textAlign: "left",
                    fontSize: 9, fontWeight: 900, color: "#3F6E8F",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const color    = classColors[i % classColors.length];
                const bg       = classBgs[i % classBgs.length];
                const initials = s.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
                const subjects = s.classInfo?.subjects || [];
                const progress = s.progress ?? Math.floor(50 + Math.random() * 45);

                return (
                  <motion.tr
                    key={s.id || i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: "2px dashed rgba(7,21,33,0.1)", transition: "background 0.15s", cursor: "default" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(246,185,76,0.12)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Name */}
                    <td style={{ padding: "13px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                          background: bg, border: "3px solid #071521",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 900, color: "#071521",
                          boxShadow: "2px 2px 0 #071521",
                        }}>{initials}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#071521" }}>{s.name}</div>
                          {s.email && <div style={{ fontSize: 10, color: "#3F6E8F", marginTop: 1, fontWeight: 700 }}>{s.email}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td style={{ padding: "13px 18px", fontSize: 12, color: "#3F6E8F", fontWeight: 700 }}>
                      {subjects.length > 0 ? subjects.join(", ") : s.classInfo?.grade ? `Grade ${s.classInfo.grade}` : "—"}
                    </td>

                    {/* Progress */}
                    <td style={{ padding: "13px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 80, height: 6, borderRadius: 99, background: "rgba(7,21,33,0.08)", overflow: "hidden", border: "1px solid rgba(7,21,33,0.1)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ delay: 0.3 + i * 0.04, duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
                            style={{ height: "100%", borderRadius: 99, background: color }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: "#071521", minWidth: 28, fontWeight: 900 }}>{progress}%</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "13px 18px" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 900, padding: "3px 10px", borderRadius: 8,
                        background: "#d1fae5", color: "#15803d",
                        border: "2px solid #34d399",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>Active</span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: "13px 18px" }}>
                      <span style={{ fontSize: 14, color: "#3F6E8F", cursor: "pointer", fontWeight: 900, transition: "color 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#071521"}
                        onMouseLeave={e => e.currentTarget.style.color = "#3F6E8F"}
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
    { label: "Pending Requests", value: requests.length, icon: "🙋", bg: "#FFECA8",  border: "#f6b94c" },
    { label: "Total Students",   value: students.length, icon: "👥", bg: "#d8e8f4",  border: "#8bb7d8" },
    { label: "My Classes",       value: classes.length,  icon: "🏫", bg: "#d1fae5",  border: "#34d399" },
    { label: "Active Students",  value: students.length, icon: "✅", bg: "#f1d8e6",  border: "#d8a0c4" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
      {stats.map(({ label, value, icon, bg, border }, i) => (
        <motion.div key={label} {...fadeUp(0.04 + i * 0.05)} style={{
          borderRadius: 14,
          background: bg,
          border: "4px solid #071521",
          boxShadow: "4px 4px 0 #071521",
          padding: "18px 20px",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11, flexShrink: 0,
            background: "#ffffff", border: "3px solid #071521",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            boxShadow: "2px 2px 0 #071521",
          }}>{icon}</div>
          <div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 900, color: "#071521", lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: 9, color: "#3F6E8F", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 4 }}>
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
  const [requests, setRequests]         = useState([]);
  const [classes, setClasses]           = useState([]);
  const [loadingReq, setLoadingReq]     = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [processing, setProcessing]     = useState(null);
  const [toast, setToast]               = useState(null);
  const [activeClass, setActiveClass]   = useState("all");
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

  useEffect(() => { fetchRequests(); fetchClasses(); }, []);

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
    <div style={{ padding: "36px 40px 60px", fontFamily: "'DM Sans', sans-serif", color: "#071521" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=Sora:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        button { font-family: 'DM Sans', sans-serif; }
        input { font-family: 'DM Sans', sans-serif; }
        input:focus { outline: none; box-shadow: 4px 4px 0 #8bb7d8 !important; }
      `}</style>

      {/* ── Page Header ── */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          Class Management
        </p>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: "clamp(20px, 3vw, 28px)", color: "#071521", marginBottom: 6 }}>
          Students
        </h1>
        <p style={{ fontSize: 13, color: "#3F6E8F", fontWeight: 700 }}>
          Manage enrollment requests and view your enrolled students
        </p>
      </motion.div>

      {/* ── Quick Stats ── */}
      <QuickStats requests={requests} students={allStudents} classes={classes} />

      {/* ── Main 2-col Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "stretch" }}>

        {/* LEFT: Enrollment Requests */}
        <motion.div {...fadeUp(0.12)} style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 900, color: "#071521" }}>
                Enrollment Requests
              </span>
              <span style={{
                fontSize: 10, fontWeight: 900, padding: "2px 9px", borderRadius: 99,
                background: requests.length > 0 ? "#FFECA8" : "#f1f5f9",
                border: `2px solid ${requests.length > 0 ? "#f6b94c" : "#e2e8f0"}`,
                color: "#071521",
                boxShadow: "1px 1px 0 #071521",
              }}>{requests.length}</span>
            </div>
            {requests.length > 3 && (
              <span style={{ fontSize: 11, color: "#273c75", cursor: "pointer", fontWeight: 900 }}>View All →</span>
            )}
          </div>

          {loadingReq ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#3F6E8F", fontSize: 13, fontWeight: 800 }}>Loading…</div>
          ) : requests.length === 0 ? (
            <div style={{
              borderRadius: 16, background: "#ffffff",
              border: "4px solid #071521",
              boxShadow: "6px 6px 0 #d8e8f4",
              flex: 1, textAlign: "center", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12, padding: "48px 24px",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: "#d1fae5", border: "3px solid #34d399",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                boxShadow: "3px 3px 0 #071521",
              }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#071521" }}>No pending requests</div>
              <div style={{ fontSize: 12, color: "#3F6E8F", fontWeight: 700 }}>All enrollment requests have been reviewed</div>
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