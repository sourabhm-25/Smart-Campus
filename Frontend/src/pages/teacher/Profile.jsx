import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "T";
}

const SUBJECT_META = {
  mathematics: { icon: "📐", color: "#3b82f6" },
  math:        { icon: "📐", color: "#3b82f6" },
  english:     { icon: "📖", color: "#a78bfa" },
  science:     { icon: "🔬", color: "#34d399" },
  history:     { icon: "🏛️", color: "#f97316" },
  geography:   { icon: "🗺️", color: "#22d3ee" },
  "computer science": { icon: "💻", color: "#f472b6" },
  "social studies": { icon: "🌍", color: "#fb923c" },
  "art & design": { icon: "🎨", color: "#fbbf24" },
};
const getSubjectMeta = (name = "") => SUBJECT_META[name.toLowerCase()] || { icon: "📚", color: "#8bb7d8" };

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.38, ease: [0.25, 1, 0.5, 1] },
});

/* ── Avatar ── */
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

/* ── Stat card ── */
function StatCard({ label, value, icon, bg, shadow, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: [0.25, 1, 0.5, 1] }}
      style={{
        padding: "18px 20px", borderRadius: 12, background: bg,
        border: "4px solid #071521", boxShadow: `5px 5px 0 ${shadow}`,
        flex: "1 1 150px",
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
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

/* ── Edit Profile Modal ── */
function EditModal({ user, onSave, onClose, saving }) {
  const [name, setName]     = useState(user.name || "");
  const [school, setSchool] = useState(user.school || "");
  const [subject, setSubject] = useState(user.subject || "");

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(7,21,33,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
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
          { label: "Full Name",    val: name,    set: setName,    placeholder: "Your full name" },
          { label: "School",       val: school,  set: setSchool,  placeholder: "School name" },
          { label: "Subject / Department", val: subject, set: setSubject, placeholder: "e.g. Mathematics, Science" },
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
          <button onClick={onClose} style={{
            flex: 1, padding: "11px 0", fontSize: 13, fontWeight: 800,
            border: "3px solid #071521", borderRadius: 10, cursor: "pointer",
            background: "#f1f5f9", color: "#071521", fontFamily: "inherit",
          }}>Cancel</button>
          <button
            onClick={() => onSave({ name: name.trim(), school: school.trim(), subject: subject.trim() })}
            disabled={saving || !name.trim()}
            style={{
              flex: 2, padding: "11px 0", fontSize: 13, fontWeight: 900,
              border: "3px solid #071521", borderRadius: 10,
              cursor: saving ? "not-allowed" : "pointer",
              background: "#FFECA8", color: "#071521",
              boxShadow: "4px 4px 0 #071521", fontFamily: "inherit",
              opacity: saving ? 0.7 : 1,
            }}
          >{saving ? "Saving…" : "Save Changes ✓"}</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Change Password Modal ── */
function PasswordModal({ onClose }) {
  const [old, setOld]       = useState("");
  const [next, setNext]     = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  const match  = next && confirm && next === confirm;
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
      if (res.ok) { setStatus("ok"); setTimeout(onClose, 1400); }
      else {
        const d = await res.json();
        setErrMsg(d.detail || "Failed to change password.");
        setStatus("error");
      }
    } catch {
      setErrMsg("Network error."); setStatus("error");
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", fontSize: 14, fontWeight: 700,
    border: "3px solid #071521", borderRadius: 10, outline: "none",
    fontFamily: "inherit", color: "#071521", boxShadow: "3px 3px 0 #d8e8f4",
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(7,21,33,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
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
          boxShadow: "8px 8px 0 #d8a0c4", fontFamily: "'DM Sans', sans-serif",
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
              { label: "New Password",     val: next, set: setNext },
              { label: "Confirm New Password", val: confirm, set: setConfirm },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                  {label}
                </label>
                <input type="password" value={val} onChange={e => set(e.target.value)} style={inputStyle} />
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
              >{status === "saving" ? "Saving…" : "Update Password"}</button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

/* ── Main Profile Page ── */
export default function TeacherProfile() {
  const [user, setUser]       = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [tab, setTab]         = useState("overview");

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    const h = { Authorization: `Bearer ${token}` };

    Promise.allSettled([
      fetch(`${API}/auth/me`, { headers: h }).then(r => r.json()),
      fetch(`${API}/teacher/my-classes`, { headers: h }).then(r => r.json()),
    ]).then(([u, c]) => {
      if (u.status === "fulfilled" && u.value?.user) setUser(u.value.user);
      else {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        if (stored?.name) setUser(stored);
      }
      if (c.status === "fulfilled") setClasses(c.value?.classes || []);
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

  const totalStudents = classes.reduce((a, c) => a + (c.student_count || 0), 0);
  const allSubjects   = [...new Set(classes.flatMap(c => c.my_subjects || []))];

  const TABS = [
    { id: "overview", label: "📊 Overview" },
    { id: "classes",  label: "🏫 My Classes" },
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
    <div style={{ padding: "36px 36px 60px", maxWidth: 900, fontFamily: "'DM Sans', sans-serif", color: "#071521" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,700;9..40,800;9..40,900&family=Sora:wght@600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; box-shadow: 4px 4px 0 #8bb7d8 !important; }
      `}</style>

      {/* ── Hero card ── */}
      <motion.div {...fadeUp(0)} style={{
        background: "linear-gradient(135deg, #ffe792, #B7DBFF)",
        border: "4px solid #071521", borderRadius: 16,
        padding: "28px 28px 24px", boxShadow: "7px 7px 0 #d8a0c4",
        marginBottom: 24,
        display: "flex", alignItems: "flex-start", gap: 22, flexWrap: "wrap",
      }}>
        <Avatar name={user.name || "T"} size={84} />

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Teacher Profile
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
            <span style={{
              fontSize: 12, fontWeight: 900, padding: "3px 12px",
              background: "#ffffff", border: "3px solid #071521",
              borderRadius: 99, color: "#071521", boxShadow: "2px 2px 0 #8bb7d8",
            }}>
              Teacher
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          <motion.button
            whileHover={{ y: -2, boxShadow: "5px 5px 0 #071521" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModal("edit")}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: 900,
              background: "#ffffff", border: "3px solid #071521",
              borderRadius: 10, cursor: "pointer", color: "#071521",
              boxShadow: "3px 3px 0 #071521", fontFamily: "inherit",
            }}
          >✏️ Edit Profile</motion.button>
          <motion.button
            whileHover={{ y: -2, boxShadow: "5px 5px 0 #d8a0c4" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModal("password")}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: 900,
              background: "#f1d8e6", border: "3px solid #071521",
              borderRadius: 10, cursor: "pointer", color: "#071521",
              boxShadow: "3px 3px 0 #d8a0c4", fontFamily: "inherit",
            }}
          >🔒 Password</motion.button>
        </div>
      </motion.div>

      {/* Save toast */}
      <AnimatePresence>
        {saveMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{
              background: saveMsg.startsWith("✓") ? "#d1fae5" : "#fee2e2",
              border: `3px solid ${saveMsg.startsWith("✓") ? "#34d399" : "#f87171"}`,
              borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 800,
              color: saveMsg.startsWith("✓") ? "#065f46" : "#991b1b",
              marginBottom: 18,
              boxShadow: `3px 3px 0 ${saveMsg.startsWith("✓") ? "#6ee7b7" : "#fca5a5"}`,
            }}
          >{saveMsg}</motion.div>
        )}
      </AnimatePresence>

      {/* ── Stat row ── */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard label="My Classes"     value={classes.length}    icon="🏫" bg="#d8e8f4" shadow="#8bb7d8" delay={0.08} />
        <StatCard label="Total Students" value={totalStudents}      icon="👥" bg="#FFECA8" shadow="#f4d98e" delay={0.14} />
        <StatCard label="Subjects"       value={allSubjects.length} icon="📚" bg="#f1d8e6" shadow="#d8a0c4" delay={0.20} />
        <StatCard label="Role"           value="Teacher"            icon="🎓" bg="#d1fae5" shadow="#6ee7b7" delay={0.26} />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 18px", fontSize: 13, fontWeight: 900,
            border: "3px solid #071521", borderRadius: 10, cursor: "pointer",
            background: tab === t.id ? "#071521" : "#ffffff",
            color: tab === t.id ? "#FFECA8" : "#071521",
            boxShadow: tab === t.id ? "3px 3px 0 #d8a0c4" : "2px 2px 0 #d8e8f4",
            transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>

            {/* Personal info */}
            <div style={{ background: "#ffffff", border: "4px solid #071521", borderRadius: 14, padding: "24px", boxShadow: "6px 6px 0 #8bb7d8", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 17, color: "#071521", marginBottom: 18 }}>
                📋 Personal Information
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                {[
                  { label: "Full Name", value: user.name },
                  { label: "Email",     value: user.email },
                  { label: "School",    value: user.school || "—" },
                  { label: "Role",      value: "Teacher" },
                  { label: "Account",   value: user.auth_provider === "google" ? "Google" : "Email / Password" },
                  { label: "Classes",   value: `${classes.length} class${classes.length !== 1 ? "es" : ""}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: "14px 16px", background: "#f8fafc", border: "2px solid #d8e8f4", borderRadius: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#071521" }}>{value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects I teach */}
            {allSubjects.length > 0 && (
              <div style={{ background: "#ffffff", border: "4px solid #071521", borderRadius: 14, padding: "24px", boxShadow: "6px 6px 0 #f4d98e" }}>
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 17, color: "#071521", marginBottom: 18 }}>
                  📚 Subjects I Teach
                </h2>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {allSubjects.map((s, i) => {
                    const meta = getSubjectMeta(s);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                          padding: "10px 18px", borderRadius: 12,
                          background: `${meta.color}18`,
                          border: `3px solid ${meta.color}`,
                          display: "flex", alignItems: "center", gap: 8,
                          boxShadow: `2px 2px 0 ${meta.color}60`,
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{meta.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: "#071521" }}>{s}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === "classes" && (
          <motion.div key="classes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {classes.length === 0 ? (
              <div style={{ background: "#ffffff", border: "4px dashed #071521", borderRadius: 14, padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏫</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#071521", fontFamily: "'Sora', sans-serif" }}>No classes yet</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#3F6E8F", marginTop: 8 }}>
                  Students who enroll will appear in your classes.
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {classes.map((cls, i) => {
                  const colors = ["#d8e8f4", "#FFECA8", "#f1d8e6", "#d1fae5", "#ede9fe"];
                  const borders = ["#8bb7d8", "#f6b94c", "#d8a0c4", "#34d399", "#a78bfa"];
                  const bg = colors[i % colors.length];
                  const border = borders[i % borders.length];
                  return (
                    <motion.div
                      key={cls.id || i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      whileHover={{ y: -3, boxShadow: "8px 8px 0 #d8a0c4" }}
                      style={{
                        background: "#ffffff", border: "4px solid #071521",
                        borderRadius: 14, padding: "22px",
                        boxShadow: "5px 5px 0 #071521",
                        position: "relative", overflow: "hidden",
                        transition: "all 0.18s",
                      }}
                    >
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: border }} />

                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, marginTop: 4 }}>
                        <div style={{
                          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                          background: bg, border: "3px solid #071521",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 900, color: "#071521",
                          boxShadow: "2px 2px 0 #071521",
                        }}>{cls.grade || "C"}</div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: "#071521" }}>Grade {cls.grade}</div>
                          <div style={{ fontSize: 12, color: "#3F6E8F", fontWeight: 700, marginTop: 2 }}>
                            {(cls.my_subjects || []).join(", ") || "—"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ background: "#FFF5D6", padding: "10px", borderRadius: 8, border: "2px solid #071521" }}>
                          <div style={{ fontSize: 9, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3, fontWeight: 900 }}>Students</div>
                          <div style={{ fontSize: 18, fontWeight: 900, color: "#071521" }}>{cls.student_count || 0}</div>
                        </div>
                        <div style={{ background: bg, padding: "10px", borderRadius: 8, border: "2px solid #071521" }}>
                          <div style={{ fontSize: 9, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3, fontWeight: 900 }}>School</div>
                          <div style={{ fontSize: 11, fontWeight: 900, color: "#071521", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cls.school || "—"}</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {modal === "edit" && <EditModal user={user} onSave={handleSaveProfile} onClose={() => setModal(null)} saving={saving} />}
        {modal === "password" && <PasswordModal onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
