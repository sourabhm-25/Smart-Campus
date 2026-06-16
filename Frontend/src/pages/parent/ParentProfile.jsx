import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

export default function ParentProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(stored);
    if (stored.name && stored.email) {
      setFormData({ name: stored.name, email: stored.email, phone: stored.phone || "" });
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    localStorage.setItem("user", JSON.stringify(formData));
    setMessage("Profile updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) return <p style={{ color: "#3F6E8F", padding: 40, fontWeight: 800 }}>Loading…</p>;

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 8,
    background: "#ffffff",
    border: "3px solid #273c75",
    color: "#273c75",
    fontSize: 14,
    fontFamily: "inherit",
    fontWeight: 700,
    transition: "all 0.2s",
  };

  const disabledInputStyle = {
    ...inputStyle,
    background: "#e8f0f8",
    border: "3px solid #8bb7d8",
    color: "#3F6E8F",
    cursor: "not-allowed",
  };

  return (
    <div style={{ padding: "40px 40px 64px", minHeight: "100%", fontFamily: "'DM Sans', sans-serif", color: "#273c75" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        .profile-input:focus { outline: none; border-color: #c94fab !important; box-shadow: 3px 3px 0 #d8a0c4; }
        .profile-action-btn:hover { background: #d8e8f4 !important; }
      `}</style>

      <div style={{ maxWidth: 600 }}>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #fff0b8, #f1d8e6)",
            border: "4px solid #273c75",
            boxShadow: "8px 8px 0 #8bb7d8",
            marginBottom: 24,
          }}>

          {/* Avatar + Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#f4d98e",
              border: "4px solid #273c75",
              boxShadow: "4px 4px 0 #d8a0c4",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36,
            }}>
              👨‍👩‍👧‍👦
            </div>
            <div>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 22, color: "#273c75", marginBottom: 4 }}>
                {formData.name}
              </h2>
              <span style={{
                display: "inline-block",
                fontSize: 11, padding: "4px 12px", borderRadius: 6,
                background: "#d8a0c4", border: "2px solid #273c75",
                color: "#273c75", fontWeight: 900, textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                Parent Account
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ fontSize: 12, color: "#273c75", fontWeight: 900, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Full Name
              </label>
              <input
                className="profile-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#273c75", fontWeight: 900, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                style={disabledInputStyle}
              />
              <p style={{ fontSize: 11, color: "#3F6E8F", marginTop: 4, fontWeight: 700 }}>Email cannot be changed</p>
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#273c75", fontWeight: 900, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Phone (Optional)
              </label>
              <input
                className="profile-input"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                style={inputStyle}
              />
            </div>

            {message && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ color: "#1a7a5e", fontSize: 13, fontWeight: 800, background: "#d1fae5", padding: "10px 14px", borderRadius: 8, border: "2px solid #34d399" }}>
                ✅ {message}
              </motion.p>
            )}
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ color: "#9f1239", fontSize: 13, fontWeight: 800, background: "#ffe4e6", padding: "10px 14px", borderRadius: 8, border: "2px solid #f472b6" }}>
                ❌ {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "13px 16px",
                borderRadius: 8,
                background: "#f4d98e",
                border: "3px solid #273c75",
                color: "#273c75",
                fontWeight: 900,
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "inherit",
                boxShadow: "4px 4px 0 #d8a0c4",
                marginTop: 4,
              }}>
              Save Changes ✓
            </motion.button>
          </form>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            padding: 28,
            borderRadius: 8,
            background: "#ffffff",
            border: "4px solid #273c75",
            boxShadow: "6px 6px 0 #8bb7d8",
          }}>
          <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 17, color: "#273c75", marginBottom: 18 }}>
            Account &amp; Security
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "🔒 Change Password", action: () => {} },
              { label: "🔔 Notification Preferences", action: () => {} },
            ].map((item, i) => (
              <motion.button
                key={i}
                className="profile-action-btn"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={item.action}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "#f8f4ec",
                  border: "3px solid #273c75",
                  color: "#273c75",
                  fontWeight: 800,
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: "inherit",
                  textAlign: "left",
                  transition: "background 0.2s",
                }}>
                {item.label}
              </motion.button>
            ))}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "#ffe4e6",
                border: "3px solid #f472b6",
                color: "#9f1239",
                fontWeight: 900,
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "inherit",
                textAlign: "left",
                marginTop: 8,
                boxShadow: "4px 4px 0 #f472b6",
                transition: "all 0.2s",
              }}>
              🚪 Logout
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
