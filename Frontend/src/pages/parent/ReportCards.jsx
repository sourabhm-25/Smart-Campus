import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

export default function ReportCards() {
  const [searchParams] = useSearchParams();
  const selectedChildId = searchParams.get("child");

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(selectedChildId || null);
  const [reportCard, setReportCard] = useState(null);
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

  // Fetch report card when child is selected
  useEffect(() => {
    if (!selectedChild) return;

    setLoading(true);
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API}/parent/child/${selectedChild}/report-card`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.report_card) {
          setReportCard(d.report_card);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedChild]);

  const gradeColor = {
    A: "#34d399",
    B: "#60a5fa",
    C: "#fbbf24",
    D: "#fb923c",
    F: "#f472b6",
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

      {/* Report Card */}
      {loading ? (
        <p style={{ color: "#64748b" }}>Loading report card...</p>
      ) : !reportCard ? (
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
          <p style={{ fontSize: 14, color: "#64748b" }}>Select a child to view their report card</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div style={{
            padding: 32,
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 24, color: "#fff", marginBottom: 8 }}>
                {reportCard.child_name}
              </h2>
              <p style={{ fontSize: 13, color: "#64748b" }}>
                {reportCard.grade} • {reportCard.school}
              </p>
              <p style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
                Generated: {new Date(reportCard.generated_at).toLocaleDateString()}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: gradeColor[reportCard.overall_grade] || "#60a5fa", marginBottom: 8 }}>
                {reportCard.overall_grade}
              </div>
              <p style={{ fontSize: 12, color: "#64748b" }}>
                {reportCard.overall_percentage}%
              </p>
            </div>
          </div>

          {/* Overall Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Total Submissions", value: reportCard.total_evaluated_submissions, icon: "📝" },
              { label: "Overall Percentage", value: `${reportCard.overall_percentage}%`, icon: "📊" },
              { label: "Overall Grade", value: reportCard.overall_grade, icon: "⭐" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  padding: 20,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                <p style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{stat.label}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
                  {stat.icon} {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Subject Performance */}
          <div>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 16 }}>
              Subject Performance
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {reportCard.subjects.map((subject, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                        {subject.subject}
                      </h4>
                      <p style={{ fontSize: 12, color: "#64748b" }}>
                        {subject.submissions} submissions
                      </p>
                    </div>
                    <div style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: gradeColor[subject.grade] || "#60a5fa",
                    }}>
                      {subject.grade}
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: "#64748b" }}>
                        <span>Score</span>
                        <span>{subject.total_score}/{subject.max_possible}</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${subject.percentage}%`,
                          background: gradeColor[subject.grade] || "#60a5fa",
                          transition: "width 0.8s ease-out",
                        }} />
                      </div>
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>
                      {subject.percentage}%
                    </p>
                  </div>

                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Average: <span style={{ color: "#c7d2fe", fontWeight: 600 }}>{subject.average}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
