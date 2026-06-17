import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

const SUBJECT_META = {
  mathematics: { icon: "📐", color: "#60a5fa" },
  math:        { icon: "📐", color: "#60a5fa" },
  english:     { icon: "📖", color: "#a78bfa" },
  science:     { icon: "🔬", color: "#34d399" },
  "social studies": { icon: "🌍", color: "#fb923c" },
  "social science": { icon: "🌍", color: "#fb923c" },
  "computer science": { icon: "💻", color: "#f472b6" },
  "art & design": { icon: "🎨", color: "#fbbf24" },
  history:     { icon: "🏛️", color: "#f97316" },
  geography:   { icon: "🗺️", color: "#22d3ee" },
};
const getMeta = (name = "") =>
  SUBJECT_META[name.toLowerCase()] || { icon: "📚", color: "#94a3b8" };

const gradeColor  = { "A+": "#064e3b", A: "#1a7a5e", "B+": "#1e3a8a", B: "#1d4ed8", C: "#92400e", D: "#9a3412", F: "#9f1239" };
const gradeBg     = { "A+": "#d1fae5", A: "#dcfce7", "B+": "#dbeafe", B: "#eff6ff", C: "#fef3c7", D: "#ffedd5", F: "#ffe4e6" };
const gradeBorder = { "A+": "#059669", A: "#34d399", "B+": "#3b82f6", B: "#60a5fa", C: "#fbbf24", D: "#fb923c", F: "#f472b6" };

function getGrade(pct) {
  return pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : pct >= 40 ? "D" : "F";
}

function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "S";
}

// ── Avatar ─────────────────────────────────────────────────
function Avatar({ name, size = 80 }) {
  const initials = getInitials(name);
  const colors = ["#FFECA8", "#d8e8f4", "#f1d8e6", "#d1fae5", "#ede9fe"];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, border: "4px solid #071521",
      boxShadow: "4px 4px 0 #8bb7d8",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Sora', sans-serif", fontWeight: 900,
      fontSize: size * 0.34, color: "#071521", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Thin progress bar ──────────────────────────────────────
function ProgressBar({ value, color, delay = 0 }) {
  return (
    <div style={{ height: 10, background: "#e8f0f8", borderRadius: 6, overflow: "hidden", border: "2px solid #d8e8f4" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.9, ease: "easeOut", delay }}
        style={{ height: "100%", background: color, borderRadius: 4 }}
      />
    </div>
  );
}

// ── Stat card (top row) ───────────────────────────────────
function StatCard({ label, value, icon, bg, shadow, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: [0.25, 1, 0.5, 1] }}
      style={{
        padding: "18px 20px",
        borderRadius: 12, background: bg,
        border: "4px solid #071521",
        boxShadow: `5px 5px 0 ${shadow}`,
        flex: "1 1 150px",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 900, color: "#1C3F57", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 26, color: "#071521" }}>
          {value}
        </span>
      </div>
    </motion.div>
  );
}

// ── Edit profile modal ─────────────────────────────────────
function EditModal({ user, onSave, onClose, saving }) {
  const [name, setName] = useState(user.name || "");
  const [school, setSchool] = useState(user.school || "");
  const [grade, setGrade] = useState(user.grade || "");

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(7,21,33,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "#ffffff", border: "4px solid #071521",
          borderRadius: 20, padding: "28px 28px 24px",
          width: "100%", maxWidth: 440,
          boxShadow: "8px 8px 0 #8bb7d8",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 20, color: "#071521", marginBottom: 22 }}>
          ✏️ Edit Profile
        </h3>

        {[
          { label: "Full Name", val: name, set: setName, placeholder: "Your full name" },
          { label: "School", val: school, set: setSchool, placeholder: "School name" },
          { label: "Grade / Class", val: grade, set: setGrade, placeholder: "e.g. Grade 5, 10th, etc." },
        ].map(({ label, val, set, placeholder }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
              {label}
            </label>
            <input
              value={val}
              onChange={e => set(e.target.value)}
              placeholder={placeholder}
              style={{
                width: "100%", padding: "10px 14px", fontSize: 14, fontWeight: 700,
                border: "3px solid #071521", borderRadius: 10, outline: "none",
                fontFamily: "inherit", color: "#071521",
                boxShadow: "3px 3px 0 #d8e8f4",
              }}
            />
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px 0", fontSize: 13, fontWeight: 800,
              border: "3px solid #071521", borderRadius: 10, cursor: "pointer",
              background: "#f1f5f9", color: "#071521", fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ name: name.trim(), school: school.trim(), grade: grade.trim() })}
            disabled={saving || !name.trim()}
            style={{
              flex: 2, padding: "11px 0", fontSize: 13, fontWeight: 900,
              border: "3px solid #071521", borderRadius: 10,
              cursor: saving ? "not-allowed" : "pointer",
              background: "#FFECA8", color: "#071521",
              boxShadow: "4px 4px 0 #071521",
              fontFamily: "inherit",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save Changes ✓"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Change Password Modal ──────────────────────────────────
function PasswordModal({ onClose }) {
  const [old, setOld] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null); // "saving" | "ok" | "error"
  const [errMsg, setErrMsg] = useState("");

  const match = next && confirm && next === confirm;
  const strong = next.length >= 6;

  const handleSave = async () => {
    if (!match || !strong || !old) return;
    setStatus("saving");
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ old_password: old, new_password: next }),
      });
      if (res.ok) {
        setStatus("ok");
        setTimeout(onClose, 1400);
      } else {
        const d = await res.json();
        setErrMsg(d.detail || "Failed to change password.");
        setStatus("error");
      }
    } catch {
      setErrMsg("Network error.");
      setStatus("error");
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(7,21,33,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "#ffffff", border: "4px solid #071521",
          borderRadius: 20, padding: "28px 28px 24px",
          width: "100%", maxWidth: 400,
          boxShadow: "8px 8px 0 #d8a0c4",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 20, color: "#071521", marginBottom: 22 }}>
          🔒 Change Password
        </h3>

        {status === "ok" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#065f46" }}>Password changed!</div>
          </div>
        ) : (
          <>
            {[
              { label: "Current Password", val: old, set: setOld },
              { label: "New Password", val: next, set: setNext },
              { label: "Confirm New Password", val: confirm, set: setConfirm },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                  {label}
                </label>
                <input
                  type="password"
                  value={val}
                  onChange={e => set(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", fontSize: 14, fontWeight: 700,
                    border: "3px solid #071521", borderRadius: 10, outline: "none",
                    fontFamily: "inherit", color: "#071521",
                    boxShadow: "3px 3px 0 #d8e8f4",
                  }}
                />
              </div>
            ))}

            {next && !strong && (
              <div style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", marginBottom: 10, background: "#fee2e2", border: "2px solid #f87171", borderRadius: 8, padding: "6px 10px" }}>
                Password must be at least 6 characters
              </div>
            )}
            {next && confirm && !match && (
              <div style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", marginBottom: 10, background: "#fee2e2", border: "2px solid #f87171", borderRadius: 8, padding: "6px 10px" }}>
                Passwords do not match
              </div>
            )}
            {status === "error" && (
              <div style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", marginBottom: 10, background: "#fee2e2", border: "2px solid #f87171", borderRadius: 8, padding: "6px 10px" }}>
                ⚠️ {errMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "11px 0", fontSize: 13, fontWeight: 800, border: "3px solid #071521", borderRadius: 10, cursor: "pointer", background: "#f1f5f9", color: "#071521", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!match || !strong || !old || status === "saving"}
                style={{
                  flex: 2, padding: "11px 0", fontSize: 13, fontWeight: 900,
                  border: "3px solid #071521", borderRadius: 10,
                  cursor: (match && strong && old) ? "pointer" : "not-allowed",
                  background: (match && strong && old) ? "#f1d8e6" : "#e2e8f0",
                  color: (match && strong && old) ? "#071521" : "#94a3b8",
                  boxShadow: (match && strong && old) ? "4px 4px 0 #d8a0c4" : "none",
                  fontFamily: "inherit",
                }}
              >
                {status === "saving" ? "Saving…" : "Update Password"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── Main Profile Page ─────────────────────────────────────
export default function Profile() {
  const [user, setUser]           = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [progress, setProgress]   = useState([]);
  const [myClass, setMyClass]     = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null); // "edit" | "password"
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState(null);
  const [tab, setTab]             = useState("overview"); // "overview" | "progress" | "class"

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    const h = { Authorization: `Bearer ${token}` };

    Promise.allSettled([
      fetch(`${API}/auth/me`, { headers: h }).then(r => r.json()),
      fetch(`${API}/student/dashboard`, { headers: h }).then(r => r.json()),
      fetch(`${API}/student/progress`, { headers: h }).then(r => r.json()),
      fetch(`${API}/student/my-class`, { headers: h }).then(r => r.json()),
      fetch(`${API}/student/enrollment-status`, { headers: h }).then(r => r.json()),
    ]).then(([u, d, p, c, e]) => {
      if (u.status === "fulfilled" && u.value?.user) setUser(u.value.user);
      else {
        // fallback: localStorage
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        if (stored?.name) setUser(stored);
      }
      if (d.status === "fulfilled") setDashboard(d.value);
      if (p.status === "fulfilled") setProgress(p.value?.progress_by_subject || []);
      if (c.status === "fulfilled") setMyClass(c.value?.class || null);
      if (e.status === "fulfilled") setEnrollment(e.value?.requests || []);
      setLoading(false);
    });
  }, []);

  const handleSaveProfile = async (data) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/profile/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setUser(result.user);
        // update localStorage
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, ...result.user }));
        setSaveMsg("✓ Profile updated!");
        setTimeout(() => setSaveMsg(null), 3000);
      } else {
        setSaveMsg("⚠️ Update failed. Try again.");
        setTimeout(() => setSaveMsg(null), 3000);
      }
    } catch {
      setSaveMsg("⚠️ Network error.");
      setTimeout(() => setSaveMsg(null), 3000);
    }
    setSaving(false);
    setModal(null);
  };

  const totalSubmitted = dashboard?.total_submitted_homework ?? 0;
  const totalPending = dashboard?.total_pending_homework ?? 0;
  const subjects = dashboard?.subjects || [];

  const overallPct = progress.length > 0
    ? Math.round(progress.reduce((s, p) => s + (p.percentage ?? 0), 0) / progress.length)
    : null;
  const overallGrade = overallPct !== null ? getGrade(overallPct) : null;

  const TABS = [
    { id: "overview", label: "📊 Overview" },
    { id: "progress", label: "📈 Progress" },
    { id: "class", label: "🏫 My Class" },
  ];

  if (loading) return (
    <div style={{ padding: "48px", fontFamily: "'DM Sans', sans-serif", color: "#3F6E8F", display: "flex", alignItems: "center", gap: 14, fontWeight: 800 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 22, height: 22, border: "3px solid #d8e8f4", borderTopColor: "#3F6E8F", borderRadius: "50%" }} />
      Loading profile…
    </div>
  );

  if (!user) return (
    <div style={{ padding: "40px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#fee2e2", border: "4px solid #f87171", borderRadius: 12, padding: "20px", fontWeight: 800, color: "#991b1b", boxShadow: "4px 4px 0 #fca5a5" }}>
        ⚠️ Could not load profile. Please log in again.
      </div>
    </div>
  );

  return (
    <div style={{ padding: "36px 36px 60px", maxWidth: 860, fontFamily: "'DM Sans', sans-serif", color: "#071521" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=Sora:wght@600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; box-shadow: 4px 4px 0 #8bb7d8 !important; }
        textarea:focus { outline: none; }
      `}</style>

      {/* ── Hero card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: "linear-gradient(135deg, #ffe792, #d8e8f4)",
          border: "4px solid #071521",
          borderRadius: 16, padding: "28px 28px 24px",
          boxShadow: "7px 7px 0 #d8a0c4",
          marginBottom: 24,
          display: "flex", alignItems: "flex-start", gap: 22, flexWrap: "wrap",
        }}
      >
        <Avatar name={user.name || "S"} size={84} />

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Student Profile
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: "clamp(22px, 3vw, 30px)", color: "#071521", margin: "0 0 8px" }}>
            {user.name || "—"}
          </h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {user.email && (
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1C3F57", display: "flex", alignItems: "center", gap: 5 }}>
                ✉️ {user.email}
              </span>
            )}
            {user.school && (
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1C3F57", display: "flex", alignItems: "center", gap: 5 }}>
                🏫 {user.school}
              </span>
            )}
            {user.grade && (
              <span style={{
                fontSize: 12, fontWeight: 900, padding: "3px 12px",
                background: "#ffffff", border: "3px solid #071521",
                borderRadius: 99, color: "#071521",
                boxShadow: "2px 2px 0 #8bb7d8",
              }}>
                Grade {user.grade}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          <motion.button
            whileHover={{ y: -2, boxShadow: "5px 5px 0 #071521" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModal("edit")}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: 900,
              background: "#ffffff", border: "3px solid #071521",
              borderRadius: 10, cursor: "pointer", color: "#071521",
              boxShadow: "3px 3px 0 #071521",
              fontFamily: "inherit",
            }}
          >
            ✏️ Edit Profile
          </motion.button>
          <motion.button
            whileHover={{ y: -2, boxShadow: "5px 5px 0 #d8a0c4" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModal("password")}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: 900,
              background: "#f1d8e6", border: "3px solid #071521",
              borderRadius: 10, cursor: "pointer", color: "#071521",
              boxShadow: "3px 3px 0 #d8a0c4",
              fontFamily: "inherit",
            }}
          >
            🔒 Password
          </motion.button>
        </div>
      </motion.div>

      {/* Save message toast */}
      <AnimatePresence>
        {saveMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: saveMsg.startsWith("✓") ? "#d1fae5" : "#fee2e2",
              border: `3px solid ${saveMsg.startsWith("✓") ? "#34d399" : "#f87171"}`,
              borderRadius: 10, padding: "10px 18px",
              fontSize: 13, fontWeight: 800,
              color: saveMsg.startsWith("✓") ? "#065f46" : "#991b1b",
              marginBottom: 18, boxShadow: `3px 3px 0 ${saveMsg.startsWith("✓") ? "#6ee7b7" : "#fca5a5"}`,
            }}
          >
            {saveMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stat row ── */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard label="Subjects" value={subjects.length} icon="📚" bg="#d8e8f4" shadow="#8bb7d8" delay={0.08} />
        <StatCard label="Tasks Pending" value={totalPending} icon="⏳" bg="#fff0b8" shadow="#f4d98e" delay={0.14} />
        <StatCard label="Submitted" value={totalSubmitted} icon="✅" bg="#f1d8e6" shadow="#d8a0c4" delay={0.20} />
        {overallPct !== null && (
          <StatCard label="Avg Score" value={`${overallPct}%`} icon="🏆" bg="#d1fae5" shadow="#6ee7b7" delay={0.26} />
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "9px 18px", fontSize: 13, fontWeight: 900,
              border: "3px solid #071521", borderRadius: 10, cursor: "pointer",
              background: tab === t.id ? "#071521" : "#ffffff",
              color: tab === t.id ? "#FFECA8" : "#071521",
              boxShadow: tab === t.id ? "3px 3px 0 #d8a0c4" : "2px 2px 0 #d8e8f4",
              transition: "all 0.15s",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>

            {/* Profile info card */}
            <div style={{
              background: "#ffffff", border: "4px solid #071521",
              borderRadius: 14, padding: "24px",
              boxShadow: "6px 6px 0 #8bb7d8",
              marginBottom: 20,
            }}>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 17, color: "#071521", marginBottom: 18 }}>
                📋 Personal Information
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { label: "Full Name",  value: user.name },
                  { label: "Email",      value: user.email },
                  { label: "School",     value: user.school || "—" },
                  { label: "Grade",      value: user.grade ? `Grade ${user.grade}` : "—" },
                  { label: "Role",       value: "Student" },
                  { label: "Account",    value: user.auth_provider === "google" ? "Google" : "Email/Password" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: "14px 16px", background: "#f8fafc", border: "2px solid #d8e8f4", borderRadius: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#071521" }}>{value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects grid */}
            {subjects.length > 0 && (
              <div style={{
                background: "#ffffff", border: "4px solid #071521",
                borderRadius: 14, padding: "24px",
                boxShadow: "6px 6px 0 #f4d98e",
              }}>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 17, color: "#071521", marginBottom: 18 }}>
                  📚 My Subjects
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  {subjects.map((s, i) => {
                    const meta = getMeta(s.subject);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                          padding: "14px 16px", background: `${meta.color}15`,
                          border: `3px solid ${meta.color}`,
                          borderRadius: 10, boxShadow: `2px 2px 0 ${meta.color}40`,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 20 }}>{meta.icon}</span>
                          <div style={{ fontSize: 14, fontWeight: 900, color: "#071521" }}>{s.subject}</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#3F6E8F", marginBottom: 4 }}>
                          {s.teacher_name}
                        </div>
                        {s.pending_homework > 0 ? (
                          <span style={{
                            fontSize: 11, fontWeight: 900, padding: "2px 10px",
                            background: "#fee2e2", border: "2px solid #f87171",
                            borderRadius: 99, color: "#991b1b",
                          }}>
                            {s.pending_homework} pending
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 11, fontWeight: 900, padding: "2px 10px",
                            background: "#d1fae5", border: "2px solid #34d399",
                            borderRadius: 99, color: "#065f46",
                          }}>
                            All done ✓
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === "progress" && (
          <motion.div key="progress" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {progress.length === 0 ? (
              <div style={{ background: "#ffffff", border: "4px dashed #071521", borderRadius: 14, padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#071521", fontFamily: "'Sora', sans-serif" }}>No evaluated submissions yet</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#3F6E8F", marginTop: 8 }}>Complete and submit tasks to see your progress here.</div>
              </div>
            ) : (
              <>
                {/* ── Row 1: Overall Donut + Score Bar Chart ── */}
                <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>

                  {/* Overall Donut Ring */}
                  <div style={{
                    background: "#ffffff", border: "4px solid #071521", borderRadius: 14,
                    padding: "22px 24px", boxShadow: "6px 6px 0 #8bb7d8",
                    flex: "1 1 200px", minWidth: 200,
                    display: "flex", flexDirection: "column", alignItems: "center",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14, alignSelf: "flex-start" }}>
                      Overall Score
                    </div>
                    {(() => {
                      const pct = overallPct ?? 0;
                      const grade = overallGrade ?? "F";
                      const r = 58, circ = 2 * Math.PI * r;
                      const offset = circ * (1 - pct / 100);
                      const col = gradeBorder[grade] || "#60a5fa";
                      return (
                        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width={144} height={144} style={{ transform: "rotate(-90deg)" }}>
                            <circle cx={72} cy={72} r={r} fill="none" stroke="#e8f0f8" strokeWidth={14} />
                            <motion.circle
                              cx={72} cy={72} r={r} fill="none" stroke={col} strokeWidth={14}
                              strokeLinecap="round" strokeDasharray={circ}
                              initial={{ strokeDashoffset: circ }}
                              animate={{ strokeDashoffset: offset }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                            />
                          </svg>
                          <div style={{ position: "absolute", textAlign: "center" }}>
                            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 26, color: "#071521", lineHeight: 1 }}>{pct}%</div>
                            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 18, color: col, marginTop: 2 }}>{grade}</div>
                          </div>
                        </div>
                      );
                    })()}
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#3F6E8F", marginTop: 10, textAlign: "center" }}>
                      Avg across {progress.length} subject{progress.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Bar Chart — Score % per Subject */}
                  <div style={{
                    background: "#ffffff", border: "4px solid #071521", borderRadius: 14,
                    padding: "22px 24px", boxShadow: "6px 6px 0 #f4d98e",
                    flex: "3 1 280px", minWidth: 260,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
                      Score % by Subject
                    </div>
                    {(() => {
                      const chartH = 180;
                      const barW = Math.max(36, Math.floor(320 / Math.max(progress.length, 1)));
                      const gap = 12;
                      const totalW = progress.length * (barW + gap) - gap;
                      return (
                        <div style={{ overflowX: "auto" }}>
                          <svg width={Math.max(totalW + 44, 260)} height={chartH + 44} style={{ display: "block" }}>
                            {[0, 25, 50, 75, 100].map(v => (
                              <g key={v}>
                                <line x1={34} y1={chartH - (v / 100) * chartH} x2={totalW + 38} y2={chartH - (v / 100) * chartH} stroke="#e8f0f8" strokeWidth={1.5} />
                                <text x={30} y={chartH - (v / 100) * chartH + 4} textAnchor="end" fontSize={9} fill="#94a3b8" fontWeight="700">{v}</text>
                              </g>
                            ))}
                            {progress.map((p, i) => {
                              const meta = getMeta(p.subject);
                              const pct = Math.min(100, p.percentage ?? 0);
                              const grade = getGrade(pct);
                              const col = gradeBorder[grade] || meta.color;
                              const bh = Math.max(4, (pct / 100) * chartH);
                              const x = 38 + i * (barW + gap);
                              const y = chartH - bh;
                              const label = p.subject.length > 7 ? p.subject.slice(0, 6) + "…" : p.subject;
                              return (
                                <g key={i}>
                                  <rect x={x} y={0} width={barW} height={chartH} rx={5} fill="#f8fafc" />
                                  <motion.rect x={x} width={barW} rx={5} fill={col}
                                    initial={{ y: chartH, height: 0 }}
                                    animate={{ y, height: bh }}
                                    transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                                  />
                                  <text x={x + barW / 2} y={Math.max(y - 3, 11)} textAnchor="middle" fontSize={9} fontWeight="900" fill={col}>{Math.round(pct)}%</text>
                                  <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize={9} fontWeight="800" fill="#071521">{label}</text>
                                  <text x={x + barW / 2} y={chartH + 26} textAnchor="middle" fontSize={8} fontWeight="900" fill={col}>{grade}</text>
                                </g>
                              );
                            })}
                            <line x1={34} y1={chartH} x2={totalW + 38} y2={chartH} stroke="#d8e8f4" strokeWidth={2} />
                          </svg>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* ── Row 2: Marks bars + Submissions count ── */}
                <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>

                  {/* Marks Earned vs Possible */}
                  <div style={{
                    background: "#ffffff", border: "4px solid #071521", borderRadius: 14,
                    padding: "22px 24px", boxShadow: "6px 6px 0 #d8a0c4",
                    flex: "2 1 260px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
                      Marks Earned vs Available
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {progress.map((p, i) => {
                        const meta = getMeta(p.subject);
                        const pct = p.total_possible > 0 ? (p.total_scored / p.total_possible) * 100 : 0;
                        const grade = getGrade(pct);
                        const col = gradeBorder[grade] || meta.color;
                        return (
                          <div key={i}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 15 }}>{meta.icon}</span>
                                <span style={{ fontSize: 13, fontWeight: 800, color: "#071521" }}>{p.subject}</span>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 900, color: col }}>{p.total_scored} / {p.total_possible}</span>
                            </div>
                            <div style={{ height: 12, background: "#e8f0f8", borderRadius: 6, overflow: "hidden", border: "2px solid #d8e8f4" }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, pct)}%` }}
                                transition={{ duration: 0.9, ease: "easeOut", delay: i * 0.07 }}
                                style={{ height: "100%", background: `linear-gradient(90deg, ${col}, ${col}99)`, borderRadius: 4 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Evaluated Submissions count */}
                  <div style={{
                    background: "#ffffff", border: "4px solid #071521", borderRadius: 14,
                    padding: "22px 24px", boxShadow: "6px 6px 0 #6ee7b7",
                    flex: "1 1 180px", minWidth: 180,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
                      Evaluated Submissions
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {progress.map((p, i) => {
                        const meta = getMeta(p.subject);
                        const maxSubs = Math.max(...progress.map(x => x.evaluated_submissions), 1);
                        const pct = (p.evaluated_submissions / maxSubs) * 100;
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 14, flexShrink: 0 }}>{meta.icon}</span>
                            <div style={{ flex: 1, height: 10, background: "#e8f0f8", borderRadius: 5, overflow: "hidden" }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.07 }}
                                style={{ height: "100%", background: meta.color, borderRadius: 5 }}
                              />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 900, color: "#071521", minWidth: 16, textAlign: "right" }}>
                              {p.evaluated_submissions}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, color: "#3F6E8F" }}>
                      Total: <strong style={{ color: "#071521" }}>{progress.reduce((s, p) => s + p.evaluated_submissions, 0)}</strong> graded
                    </div>
                  </div>
                </div>

                {/* ── Row 3: Per-subject detail cards ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {progress.map((p, i) => {
                    const meta = getMeta(p.subject);
                    const pct = p.percentage ?? 0;
                    const grade = getGrade(pct);
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        style={{ background: "#ffffff", border: "4px solid #071521", borderRadius: 14, padding: "18px 22px", boxShadow: `5px 5px 0 ${meta.color}60` }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${meta.color}20`, border: `3px solid ${meta.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                              {meta.icon}
                            </div>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 900, color: "#071521", fontFamily: "'Sora', sans-serif" }}>{p.subject}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#3F6E8F" }}>
                                {p.evaluated_submissions} submission{p.evaluated_submissions !== 1 ? "s" : ""} graded · avg {p.average_score ?? 0} pts
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: "center", background: gradeBg[grade] || "#dbeafe", border: `3px solid ${gradeBorder[grade] || "#60a5fa"}`, borderRadius: 10, padding: "6px 14px", boxShadow: "2px 2px 0 #071521" }}>
                            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 20, color: gradeColor[grade] || "#1d4ed8" }}>{grade}</div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: gradeColor[grade] || "#1d4ed8" }}>{pct}%</div>
                          </div>
                        </div>
                        <ProgressBar value={pct} color={gradeBorder[grade] || meta.color} delay={0.1 + i * 0.05} />
                        <div style={{ display: "flex", gap: 20, marginTop: 8, fontSize: 12, fontWeight: 700, color: "#3F6E8F" }}>
                          <span>Total Scored: <strong style={{ color: "#071521" }}>{p.total_scored}/{p.total_possible}</strong></span>
                          <span>Average: <strong style={{ color: "#071521" }}>{p.average_score}</strong></span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}

        {tab === "class" && (
          <motion.div key="class" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {!myClass ? (
              <div style={{ background: "#ffffff", border: "4px solid #071521", borderRadius: 14, padding: "32px", boxShadow: "6px 6px 0 #f4d98e" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#1C3F57", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 18 }}>
                  Enrollment Requests
                </div>
                {enrollment?.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🏫</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#071521" }}>Not enrolled in any class yet</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#3F6E8F", marginTop: 6 }}>Wait for your teacher to accept your enrollment request.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {enrollment?.map((req, i) => (
                      <div key={i} style={{
                        padding: "14px 16px", borderRadius: 10,
                        background: req.status === "accepted" ? "#d1fae5" : req.status === "rejected" ? "#fee2e2" : "#fff0b8",
                        border: `3px solid ${req.status === "accepted" ? "#34d399" : req.status === "rejected" ? "#f87171" : "#fbbf24"}`,
                        boxShadow: `2px 2px 0 ${req.status === "accepted" ? "#6ee7b7" : req.status === "rejected" ? "#fca5a5" : "#f4d98e"}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: "#071521" }}>{req.school} · Grade {req.grade}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#3F6E8F", marginTop: 3 }}>
                              Requested {new Date(req.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 900, padding: "3px 12px",
                            borderRadius: 99,
                            background: "#ffffff", border: "2px solid #071521",
                            color: req.status === "accepted" ? "#065f46" : req.status === "rejected" ? "#991b1b" : "#92400e",
                            textTransform: "capitalize",
                          }}>
                            {req.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Class info */}
                <div style={{
                  background: "linear-gradient(135deg, #d8e8f4, #f1d8e6)",
                  border: "4px solid #071521", borderRadius: 14, padding: "22px 24px",
                  boxShadow: "6px 6px 0 #8bb7d8",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                    My Class
                  </div>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 22, color: "#071521", marginBottom: 4 }}>
                    {myClass.school}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1C3F57" }}>
                    Grade {myClass.grade} · {myClass.classmate_count} classmate{myClass.classmate_count !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Teachers */}
                {myClass.teachers?.length > 0 && (
                  <div style={{ background: "#ffffff", border: "4px solid #071521", borderRadius: 14, padding: "20px 22px", boxShadow: "5px 5px 0 #f4d98e" }}>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 16, color: "#071521", marginBottom: 14 }}>
                      👨‍🏫 Teachers
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                      {myClass.teachers.map((t, i) => {
                        const meta = getMeta(t.subject);
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            style={{
                              padding: "12px 14px",
                              background: `${meta.color}15`,
                              border: `3px solid ${meta.color}`,
                              borderRadius: 10,
                            }}
                          >
                            <div style={{ fontSize: 18, marginBottom: 5 }}>{meta.icon}</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#071521" }}>{t.name}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#3F6E8F", marginTop: 3 }}>{t.subject}</div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Classmates */}
                {myClass.classmates?.length > 0 && (
                  <div style={{ background: "#ffffff", border: "4px solid #071521", borderRadius: 14, padding: "20px 22px", boxShadow: "5px 5px 0 #d8a0c4" }}>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 16, color: "#071521", marginBottom: 14 }}>
                      👥 Classmates ({myClass.classmate_count})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {myClass.classmates.map((c, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 }}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 14px",
                            background: "#f8fafc", border: "2px solid #d8e8f4",
                            borderRadius: 99,
                          }}
                        >
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "#d8e8f4", border: "2px solid #071521",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 900, color: "#071521",
                          }}>
                            {getInitials(c.name)}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#071521" }}>{c.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <AnimatePresence>
        {modal === "edit" && (
          <EditModal
            key="edit-modal"
            user={user}
            onSave={handleSaveProfile}
            onClose={() => setModal(null)}
            saving={saving}
          />
        )}
        {modal === "password" && (
          <PasswordModal key="pw-modal" onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}