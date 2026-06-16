import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

export default function ChildrenManagement() {
  const [children, setChildren] = useState([]);
  const [linkEmail, setLinkEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API}/parent/dashboard`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.children) setChildren(d.children);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleLinkChild = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API}/parent/link-child`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ child_email: linkEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Failed to link child");
        return;
      }

      setMessage(`Successfully linked ${data.child.name}!`);
      setLinkEmail("");

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError("Error linking child: " + err.message);
    }
  };

  return (
    <div style={{ padding: "40px 40px 64px", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#273c75" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        .child-link-input::placeholder { color: #8ba3c0; }
        .child-link-input:focus { outline: none; border-color: #273c75 !important; box-shadow: 3px 3px 0 #d8a0c4; }
        .child-card:hover { transform: translateY(-3px); box-shadow: 9px 9px 0 #d8a0c4 !important; }
      `}</style>

      {/* Link New Child Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #fff0b8, #f1d8e6)",
          border: "4px solid #273c75",
          boxShadow: "8px 8px 0 #8bb7d8",
          marginBottom: 40,
        }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 20, color: "#273c75", marginBottom: 20 }}>
          🔗 Link a New Child
        </h2>
        <form onSubmit={handleLinkChild}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              className="child-link-input"
              type="email"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              placeholder="Enter child's email address"
              required
              style={{
                flex: 1,
                minWidth: 220,
                padding: "12px 16px",
                borderRadius: 8,
                background: "#ffffff",
                border: "3px solid #273c75",
                color: "#273c75",
                fontSize: 14,
                fontFamily: "inherit",
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                padding: "12px 28px",
                borderRadius: 8,
                background: "#f4d98e",
                border: "3px solid #273c75",
                color: "#273c75",
                fontWeight: 900,
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "inherit",
                boxShadow: "4px 4px 0 #d8a0c4",
                transition: "all 0.2s",
              }}>
              Link Child →
            </motion.button>
          </div>
          {message && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ color: "#1a7a5e", marginTop: 12, fontSize: 14, fontWeight: 800, background: "#d1fae5", padding: "8px 14px", borderRadius: 8, border: "2px solid #34d399", display: "inline-block" }}>
              ✅ {message}
            </motion.p>
          )}
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ color: "#9f1239", marginTop: 12, fontSize: 14, fontWeight: 800, background: "#ffe4e6", padding: "8px 14px", borderRadius: 8, border: "2px solid #f472b6", display: "inline-block" }}>
              ❌ {error}
            </motion.p>
          )}
        </form>
      </motion.div>

      {/* Children List */}
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 20, color: "#273c75", marginBottom: 20 }}>
          Your Children ({children.length})
        </h2>

        {loading ? (
          <p style={{ color: "#3F6E8F", fontWeight: 800 }}>Loading children...</p>
        ) : children.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: 40,
              borderRadius: 8,
              background: "#ffffff",
              border: "4px dashed #273c75",
              textAlign: "center",
            }}>
            <p style={{ fontSize: 14, color: "#334155", fontWeight: 800 }}>No children linked yet. Add one above! 👆</p>
          </motion.div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {children.map((child, i) => (
              <motion.div
                key={child.id}
                className="child-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  padding: 24,
                  borderRadius: 8,
                  background: "#ffffff",
                  border: "4px solid #273c75",
                  boxShadow: "6px 6px 0 #8bb7d8",
                  transition: "all 0.25s ease",
                }}>
                {/* Child Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "linear-gradient(135deg, #f4d98e, #d8a0c4)",
                    border: "3px solid #273c75",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, flexShrink: 0,
                  }}>
                    🧒
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 900, color: "#273c75", marginBottom: 2 }}>{child.name}</h3>
                    <p style={{ fontSize: 12, color: "#3F6E8F", fontWeight: 700 }}>{child.email}</p>
                  </div>
                </div>

                {/* Details */}
                <div style={{ background: "#d8e8f4", borderRadius: 8, padding: 14, marginBottom: 16, border: "2px solid #273c75" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <p style={{ fontSize: 11, color: "#3F6E8F", marginBottom: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Grade</p>
                      <p style={{ fontSize: 14, fontWeight: 900, color: "#273c75" }}>{child.grade}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: "#3F6E8F", marginBottom: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>School</p>
                      <p style={{ fontSize: 14, fontWeight: 900, color: "#273c75" }}>{child.school}</p>
                    </div>
                  </div>
                </div>

                {/* Subjects */}
                <div style={{ paddingTop: 14, borderTop: "3px solid #273c75" }}>
                  <p style={{ fontSize: 12, color: "#3F6E8F", marginBottom: 8, fontWeight: 800 }}>
                    📚 Subjects ({child.subjects.length})
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {child.subjects.map((subj, j) => (
                      <span key={j} style={{
                        fontSize: 11, padding: "4px 10px", borderRadius: 6,
                        background: "#f4d98e", border: "2px solid #273c75",
                        color: "#273c75", fontWeight: 800,
                      }}>
                        {subj.subject}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
