import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

export default function ParentProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(stored);
    if (stored.name && stored.email) {
      setFormData({
        name: stored.name,
        email: stored.email,
        phone: stored.phone || "",
      });
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

    // In a real app, you'd send this to the backend
    localStorage.setItem("user", JSON.stringify(formData));
    setMessage("Profile updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) return <p style={{ color: "#64748b", padding: 40 }}>Loading...</p>;

  return (
    <div style={{ padding: "40px 40px 64px", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
      `}</style>

      <div style={{ maxWidth: 600 }}>
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 32,
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: 24,
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(99,102,241,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
            }}>
              👨‍👩‍👧‍👦
            </div>
            <div>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 4 }}>
                {formData.name}
              </h2>
              <p style={{ fontSize: 13, color: "#64748b" }}>Parent Account</p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4, display: "block" }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e2e8f0",
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4, display: "block" }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  color: "#64748b",
                  fontSize: 14,
                  fontFamily: "inherit",
                  cursor: "not-allowed",
                }}
              />
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Email cannot be changed</p>
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4, display: "block" }}>
                Phone (Optional)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e2e8f0",
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              />
            </div>

            {message && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#34d399", fontSize: 13, fontWeight: 600 }}>
                ✅ {message}
              </motion.p>
            )}
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#f472b6", fontSize: 13, fontWeight: 600 }}>
                ❌ {error}
              </motion.p>
            )}

            <button
              type="submit"
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "rgba(99,102,241,0.3)",
                border: "1px solid rgba(99,102,241,0.5)",
                color: "#c7d2fe",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
                marginTop: 8,
              }}>
              Save Changes
            </button>
          </form>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            padding: 32,
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
          <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 20 }}>
            Account & Security
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e2e8f0",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
                textAlign: "left",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,0.05)";
              }}>
              🔒 Change Password
            </button>

            <button
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e2e8f0",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
                textAlign: "left",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,0.05)";
              }}>
              🔔 Notification Preferences
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "rgba(244, 114, 182, 0.1)",
                border: "1px solid rgba(244, 114, 182, 0.3)",
                color: "#f472b6",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
                textAlign: "left",
                marginTop: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(244, 114, 182, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(244, 114, 182, 0.1)";
              }}>
              🚪 Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
