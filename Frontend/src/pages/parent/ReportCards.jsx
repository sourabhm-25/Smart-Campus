import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

const gradeColor  = { "A+": "#064e3b", A: "#1a7a5e", "B+": "#1e3a8a", B: "#1d4ed8", C: "#92400e", D: "#9a3412", F: "#9f1239" };
const gradeBg     = { "A+": "#d1fae5", A: "#dcfce7", "B+": "#dbeafe", B: "#eff6ff", C: "#fef3c7", D: "#ffedd5", F: "#ffe4e6" };
const gradeBorder = { "A+": "#059669", A: "#34d399", "B+": "#3b82f6", B: "#60a5fa", C: "#fbbf24", D: "#fb923c", F: "#f472b6" };

export default function ReportCards() {
  const [searchParams] = useSearchParams();
  const selectedChildId = searchParams.get("child");

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(selectedChildId || null);
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!selectedChild) return;

    setLoading(true);
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API}/parent/child/${selectedChild}/report-card`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.report_card) setReportCard(d.report_card);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedChild]);

  return (
    <div style={{ padding: "40px 40px 64px", minHeight: "100%", fontFamily: "'DM Sans', sans-serif", color: "#273c75" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        .rc-select:focus { outline: none; border-color: #273c75 !important; box-shadow: 3px 3px 0 #d8a0c4; }
        .rc-subject-card:hover { transform: translateY(-3px); box-shadow: 9px 9px 0 #d8a0c4 !important; }
      `}</style>

      {/* Child Selector */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
        <label style={{ fontSize: 12, color: "#3F6E8F", fontWeight: 800, marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Select Child
        </label>
        <select
          className="rc-select"
          value={selectedChild || ""}
          onChange={(e) => setSelectedChild(e.target.value)}
          style={{
            width: "100%", maxWidth: 360,
            padding: "12px 16px", borderRadius: 8,
            background: "#ffffff", border: "3px solid #273c75",
            color: "#273c75", fontSize: 14,
            fontFamily: "inherit", fontWeight: 700,
            boxShadow: "4px 4px 0 #8bb7d8",
            cursor: "pointer",
          }}>
          <option value="">Choose a child…</option>
          {children.map(child => (
            <option key={child.id} value={child.id}>{child.name}</option>
          ))}
        </select>
      </motion.div>

      {/* Loading / Empty */}
      {loading ? (
        <p style={{ color: "#3F6E8F", fontWeight: 800 }}>Loading report card…</p>
      ) : !reportCard ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: 40, borderRadius: 8, background: "#ffffff", border: "4px dashed #273c75", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#334155", fontWeight: 800 }}>Select a child above to view their report card 📋</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Report Header */}
          <div style={{
            padding: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #fff0b8, #f1d8e6)",
            border: "4px solid #273c75",
            boxShadow: "8px 8px 0 #8bb7d8",
            marginBottom: 28,
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20,
          }}>
            <div>
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 26, color: "#273c75", marginBottom: 6 }}>
                {reportCard.child_name}
              </h2>
              <p style={{ fontSize: 14, color: "#334155", fontWeight: 800, marginBottom: 4 }}>
                {reportCard.grade} • {reportCard.school}
              </p>
              <p style={{ fontSize: 12, color: "#3F6E8F", fontWeight: 700 }}>
                Generated: {new Date(reportCard.generated_at).toLocaleDateString()}
              </p>
            </div>
            <div style={{
              textAlign: "center",
              background: gradeBg[reportCard.overall_grade] || "#dbeafe",
              border: `4px solid ${gradeBorder[reportCard.overall_grade] || "#60a5fa"}`,
              borderRadius: 12,
              padding: "18px 32px",
              boxShadow: "4px 4px 0 #273c75",
            }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: gradeColor[reportCard.overall_grade] || "#1d4ed8", lineHeight: 1 }}>
                {reportCard.overall_grade}
              </div>
              <p style={{ fontSize: 13, fontWeight: 800, color: gradeColor[reportCard.overall_grade] || "#1d4ed8", marginTop: 6 }}>
                {reportCard.overall_percentage}%
              </p>
            </div>
          </div>

          {/* Overall Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 36 }}>
            {[
              { label: "Total Submissions", value: reportCard.total_evaluated_submissions, icon: "📝", bg: "#d8e8f4", shadow: "#8bb7d8" },
              { label: "Overall Percentage", value: `${reportCard.overall_percentage}%`, icon: "📊", bg: "#fff0b8", shadow: "#f4d98e" },
              { label: "Overall Grade", value: reportCard.overall_grade, icon: "⭐", bg: "#f1d8e6", shadow: "#d8a0c4" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  padding: "20px",
                  borderRadius: 8,
                  background: stat.bg,
                  border: "4px solid #273c75",
                  boxShadow: `6px 6px 0 ${stat.shadow}`,
                }}>
                <p style={{ fontSize: 11, color: "#334155", fontWeight: 800, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: 26, fontWeight: 900, color: "#273c75" }}>
                  {stat.icon} {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Subject Performance */}
          <div>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 20, color: "#273c75", marginBottom: 20 }}>
              Subject Performance
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {reportCard.subjects.map((subject, i) => {
                const gc = gradeColor[subject.grade] || "#1d4ed8";
                const gb = gradeBg[subject.grade] || "#dbeafe";
                const gborder = gradeBorder[subject.grade] || "#60a5fa";
                return (
                  <motion.div
                    key={i}
                    className="rc-subject-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    style={{
                      padding: 22, borderRadius: 8,
                      background: "#ffffff",
                      border: "4px solid #273c75",
                      boxShadow: "6px 6px 0 #8bb7d8",
                      transition: "all 0.25s ease",
                    }}>
                    {/* Subject header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 900, color: "#273c75", marginBottom: 4 }}>
                          {subject.subject}
                        </h4>
                        <p style={{ fontSize: 12, color: "#3F6E8F", fontWeight: 700 }}>
                          {subject.submissions} submission{subject.submissions !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div style={{
                        width: 48, height: 48, borderRadius: 8,
                        background: gb, border: `3px solid ${gborder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, fontWeight: 900, color: gc,
                      }}>
                        {subject.grade}
                      </div>
                    </div>

                    {/* Score bar */}
                    <div style={{ background: "#e8f0f8", borderRadius: 8, padding: 12, marginBottom: 14, border: "2px solid #d8e8f4" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6, color: "#3F6E8F", fontWeight: 700 }}>
                        <span>Score</span>
                        <span style={{ color: "#273c75", fontWeight: 900 }}>{subject.total_score}/{subject.max_possible}</span>
                      </div>
                      <div style={{ height: 10, background: "#d8e8f4", borderRadius: 6, overflow: "hidden", border: "2px solid #273c75" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${subject.percentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 + i * 0.08 }}
                          style={{ height: "100%", background: gborder, borderRadius: 4 }}
                        />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 900, color: gc, marginTop: 6 }}>
                        {subject.percentage}%
                      </p>
                    </div>

                    <div style={{ fontSize: 12, color: "#3F6E8F", fontWeight: 700, paddingTop: 10, borderTop: "2px solid #e8f0f8" }}>
                      Average: <span style={{ color: "#273c75", fontWeight: 900 }}>{subject.average}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
