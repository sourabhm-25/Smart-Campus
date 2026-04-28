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
      
      // Refresh dashboard
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError("Error linking child: " + err.message);
    }
  };

  return (
    <div style={{ padding: "40px 40px 64px", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
      `}</style>

      {/* Link New Child Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 32,
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          marginBottom: 40,
        }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 20 }}>
          Link a New Child
        </h2>
        <form onSubmit={handleLinkChild}>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              type="email"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              placeholder="Enter child's email"
              required
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e2e8f0",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                background: "rgba(99,102,241,0.3)",
                border: "1px solid rgba(99,102,241,0.5)",
                color: "#c7d2fe",
                fontWeight: 600,
                cursor: "pointer",
              }}>
              Link Child
            </button>
          </div>
          {message && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#34d399", marginTop: 12, fontSize: 14 }}>
              ✅ {message}
            </motion.p>
          )}
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: "#f472b6", marginTop: 12, fontSize: 14 }}>
              ❌ {error}
            </motion.p>
          )}
        </form>
      </motion.div>

      {/* Children List */}
      <div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 20 }}>
          Your Children ({children.length})
        </h2>

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading...</p>
        ) : children.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              padding: 40,
              borderRadius: 16,
              background: "rgba(255,255,255,0.03)",
              border: "2px dashed rgba(255,255,255,0.1)",
              textAlign: "center",
            }}>
            <p style={{ fontSize: 14, color: "#64748b" }}>No children linked yet. Add one above!</p>
          </motion.div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {children.map((child, i) => (
              <motion.div
                key={child.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  padding: 24,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(20px)",
                }}>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{child.name}</h3>
                  <p style={{ fontSize: 13, color: "#64748b" }}>{child.email}</p>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Grade</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{child.grade}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>School</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{child.school}</p>
                  </div>
                </div>

                <div style={{ paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Subjects: {child.subjects.length}</p>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {child.subjects.map((subj, j) => (
                      <span key={j} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#c7d2fe" }}>
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
