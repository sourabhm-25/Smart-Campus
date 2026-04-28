import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

export default function ProgressTracking() {
  const [searchParams] = useSearchParams();
  const selectedChildId = searchParams.get("child");

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(selectedChildId || null);
  const [progress, setProgress] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch children list
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API}/parent/dashboard`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.children) {
          setChildren(d.children);
          if (selectedChildId && d.children.find(c => c.id === selectedChildId)) {
            setSelectedChild(selectedChildId);
          } else if (d.children.length > 0) {
            setSelectedChild(d.children[0].id);
          }
        }
      });
  }, [selectedChildId]);

  // Fetch progress when child is selected
  useEffect(() => {
    if (!selectedChild) return;

    setLoading(true);
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/parent/child/${selectedChild}/progress`, { headers }).then(r => r.json()),
      fetch(`${API}/parent/child/${selectedChild}/submissions`, { headers }).then(r => r.json()),
    ]).then(([progressData, submissionsData]) => {
      if (progressData.progress_by_subject) {
        setProgress(progressData);
      }
      if (submissionsData.submissions) {
        setSubmissions(submissionsData.submissions.slice(0, 10)); // Last 10
      }
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [selectedChild]);

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "#34d399";
    if (percentage >= 80) return "#60a5fa";
    if (percentage >= 70) return "#fbbf24";
    if (percentage >= 60) return "#fb923c";
    return "#f472b6";
  };

  return (
    <div style={{ padding: "40px 40px 64px", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
      `}</style>

      {/* Child Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 40 }}>
        <label style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 8, display: "block" }}>
          Select Child
        </label>
        <select
          value={selectedChild || ""}
          onChange={(e) => setSelectedChild(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 400,
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#e2e8f0",
            fontSize: 14,
            fontFamily: "inherit",
            cursor: "pointer",
          }}>
          <option value="">Choose a child</option>
          {children.map(child => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
        </select>
      </motion.div>

      {/* Progress Overview */}
      {loading ? (
        <p style={{ color: "#64748b" }}>Loading progress data...</p>
      ) : !progress ? (
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
          <p style={{ fontSize: 14, color: "#64748b" }}>Select a child to view progress</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>
          {/* Overall Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: 32,
              borderRadius: 16,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              marginBottom: 32,
            }}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 20 }}>
              Overall Progress
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Overall Percentage</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: getGradeColor(progress.overall_percentage || 0) }}>
                  {progress.overall_percentage || 0}%
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Total Submissions</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: "#60a5fa" }}>
                  {progress.total_submissions || 0}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Subjects</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: "#fbbf24" }}>
                  {progress.progress_by_subject?.length || 0}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Subject-wise Progress */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 16 }}>
              Progress by Subject
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {progress.progress_by_subject?.map((subject, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
                    {subject.subject}
                  </h4>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                      <span>Score: {subject.total_scored}/{subject.total_possible}</span>
                      <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
                        {subject.percentage}%
                      </span>
                    </div>
                    <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${subject.percentage}%`,
                        background: getGradeColor(subject.percentage),
                        transition: "width 0.8s ease-out",
                      }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                    <div>
                      <p style={{ color: "#64748b", marginBottom: 2 }}>Avg Score</p>
                      <p style={{ color: "#c7d2fe", fontWeight: 600 }}>{subject.average_score}</p>
                    </div>
                    <div>
                      <p style={{ color: "#64748b", marginBottom: 2 }}>Completion</p>
                      <p style={{ color: "#c7d2fe", fontWeight: 600 }}>{subject.completion_rate}%</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Submissions */}
          {submissions.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 16 }}>
                Recent Submissions
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      <th style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Homework</th>
                      <th style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Subject</th>
                      <th style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Score</th>
                      <th style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Percentage</th>
                      <th style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "12px", color: "#e2e8f0" }}>{sub.homework_title}</td>
                        <td style={{ padding: "12px", color: "#e2e8f0" }}>{sub.subject}</td>
                        <td style={{ padding: "12px", color: "#e2e8f0" }}>
                          {sub.total_score}/{sub.max_score}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ color: getGradeColor(sub.percentage || 0), fontWeight: 600 }}>
                            {sub.percentage}%
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: sub.status === "evaluated" ? "rgba(52, 211, 153, 0.2)" : "rgba(148, 163, 184, 0.2)",
                            color: sub.status === "evaluated" ? "#34d399" : "#cbd5e1",
                          }}>
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
