import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

// Helper to get grade color
const getGrade = (pct) => {
  if (pct >= 90) return "A";
  if (pct >= 80) return "B";
  if (pct >= 70) return "C";
  if (pct >= 60) return "D";
  return "F";
};

const gradeColor = { A: "#047857", B: "#1d4ed8", C: "#b45309", D: "#b91c1c", F: "#be123c" };
const gradeBg = { A: "#d1fae5", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2", F: "#ffe4e6" };
const gradeBorder = { A: "#10b981", B: "#60a5fa", C: "#fbbf24", D: "#f87171", F: "#fb7185" };

export default function Analytics() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  
  const [stats, setStats] = useState(null);
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drill-down state
  const [selectedHomework, setSelectedHomework] = useState(null);

  // 1. Fetch Classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`${API}/teacher/my-classes`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
          if (data.classes && data.classes.length > 0) {
            setSelectedClassId(data.classes[0].id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch classes", err);
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // 2. Fetch Analytics & Homework when class changes
  useEffect(() => {
    if (!selectedClassId) return;
    
    setLoading(true);
    const fetchAnalytics = async () => {
      try {
        const [statsRes, hwRes] = await Promise.all([
          fetch(`${API}/teacher/class/${selectedClassId}/analytics`, {
            headers: { Authorization: `Bearer ${getToken()}` }
          }),
          fetch(`${API}/teacher/homework`, {
            headers: { Authorization: `Bearer ${getToken()}` }
          })
        ]);
        
        if (statsRes.ok && hwRes.ok) {
          const statsData = await statsRes.json();
          const hwData = await hwRes.json();
          
          setStats(statsData);
          // Filter homework for the selected class and sort oldest to newest for charting
          const classHw = (hwData.homework || [])
            .filter(hw => hw.class_id === selectedClassId)
            .reverse(); 
          setHomeworks(classHw);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [selectedClassId]);

  return (
    <div style={{ padding: "34px", fontFamily: "'DM Sans', sans-serif", color: "#071521", position: "relative" }}>
      {/* Header & Class Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 32, color: "#071521", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Class Analytics 📈
          </h1>
          <p style={{ fontSize: 14, color: "#3F6E8F", fontWeight: 700 }}>
            Deep dive into student performance and submission trends.
          </p>
        </div>
        
        {classes.length > 0 && (
          <select 
            value={selectedClassId || ""} 
            onChange={e => setSelectedClassId(e.target.value)}
            style={{
              padding: "12px 18px", borderRadius: 10, border: "3px solid #071521",
              background: "#ffffff", fontSize: 14, fontWeight: 800, color: "#071521",
              boxShadow: "4px 4px 0 #f4d98e", cursor: "pointer", fontFamily: "inherit",
              outline: "none"
            }}
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.school} — Grade {c.grade}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#3F6E8F", fontWeight: 800 }}>Loading analytics...</div>
      ) : classes.length === 0 ? (
        <div style={{ background: "#ffffff", border: "4px dashed #071521", borderRadius: 14, padding: "60px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏫</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#071521", fontFamily: "'Sora', sans-serif" }}>No Classes Assigned</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#3F6E8F", marginTop: 8 }}>You need to be assigned to a class to view analytics.</div>
        </div>
      ) : stats ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          
          {/* STAT CARDS ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 }}>
            <StatCard 
              title="Completion Rate" 
              value={`${stats.overall_completion_rate}%`} 
              subtext={`${stats.total_submissions} / ${stats.total_possible_submissions} Submissions`}
              icon="🎯" color="#60a5fa" shadowColor="#8bb7d8" 
            />
            <StatCard 
              title="Average Score" 
              value={stats.average_score != null ? `${stats.average_score}%` : "—"} 
              subtext={`Across ${stats.total_submissions} evaluated tasks`}
              icon="📈" color="#fbbf24" shadowColor="#f4d98e" 
            />
            <StatCard 
              title="Tasks Assigned" 
              value={stats.total_homework_assigned} 
              subtext={`To ${stats.enrolled_students} Enrolled Students`}
              icon="📝" color="#f472b6" shadowColor="#d8a0c4" 
            />
          </div>

          {homeworks.length === 0 ? (
            <div style={{ background: "#ffffff", border: "4px dashed #071521", borderRadius: 14, padding: "60px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#071521" }}>No Tasks Assigned Yet</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#3F6E8F", marginTop: 8 }}>Assign some tasks to this class to see performance charts.</div>
            </div>
          ) : (
            <>
              {/* CHARTS ROW */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 24 }}>
                
                {/* LINE/AREA CHART: Average Score over Time */}
                <div style={{ flex: "2 1 400px", minWidth: 320, background: "#ffffff", border: "4px solid #071521", borderRadius: 14, padding: "24px", boxShadow: "8px 8px 0 #8bb7d8" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Performance Trend
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>Click a bar to view details</div>
                  </div>
                  <ScoreTrendChart homeworks={homeworks} onSelect={setSelectedHomework} />
                </div>

                {/* BAR CHART: Submission Rate per Task */}
                <div style={{ flex: "1 1 300px", minWidth: 280, background: "#ffffff", border: "4px solid #071521", borderRadius: 14, padding: "24px", boxShadow: "8px 8px 0 #6ee7b7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Submission Rate
                    </div>
                  </div>
                  <SubmissionRateChart homeworks={homeworks} onSelect={setSelectedHomework} />
                </div>
                
              </div>
            </>
          )}
        </motion.div>
      ) : null}

      {/* Drill-down Modal */}
      <AnimatePresence>
        {selectedHomework && (
          <HomeworkDetailsModal 
            hw={selectedHomework} 
            onClose={() => setSelectedHomework(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────
// COMPONENTS
// ──────────────────────────────────────────────

function StatCard({ title, value, subtext, icon, color, shadowColor }) {
  return (
    <div style={{ background: "#ffffff", border: "4px solid #071521", borderRadius: 14, padding: "22px", boxShadow: `6px 6px 0 ${shadowColor}`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -10, right: -10, fontSize: 80, opacity: 0.08, transform: "rotate(15deg)" }}>{icon}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}25`, border: `3px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {icon}
        </div>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#3F6E8F", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</div>
      </div>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 36, fontWeight: 900, color: "#071521", lineHeight: 1.1, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#5a7a8a" }}>
        {subtext}
      </div>
    </div>
  );
}

function ScoreTrendChart({ homeworks, onSelect }) {
  // Increased height slightly to accommodate angled text
  const chartH = 220;
  const barW = Math.max(32, Math.floor(400 / Math.max(homeworks.length, 1)));
  const gap = 20;
  const totalW = homeworks.length * (barW + gap) - gap;
  
  return (
    <div style={{ overflowX: "auto", paddingBottom: 16 }}>
      <svg width={Math.max(totalW + 60, 400)} height={chartH + 80} style={{ display: "block", overflow: "visible" }}>
        {/* Y-Axis Guidelines */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={34} y1={chartH - (v / 100) * chartH} x2={Math.max(totalW + 38, 380)} y2={chartH - (v / 100) * chartH} stroke="#e8f0f8" strokeWidth={1.5} strokeDasharray="4 4" />
            <text x={26} y={chartH - (v / 100) * chartH + 4} textAnchor="end" fontSize={10} fill="#94a3b8" fontWeight="800">{v}</text>
          </g>
        ))}
        
        {/* Bars */}
        {homeworks.map((hw, i) => {
          const pct = Math.min(100, hw.avg_score || 0);
          const grade = getGrade(pct);
          const col = gradeBorder[grade] || "#60a5fa";
          const bh = Math.max(4, (pct / 100) * chartH);
          const x = 38 + i * (barW + gap);
          const y = chartH - bh;
          
          let label = hw.title;
          if (label.length > 14) label = label.slice(0, 13) + "…";
          
          // Format date properly
          const dateStr = hw.created_at ? new Date(hw.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "N/A";

          return (
            <g key={hw.id} style={{ cursor: "pointer" }} onClick={() => onSelect(hw)}>
              {/* Background slot (hoverable area) */}
              <rect x={x} y={0} width={barW} height={chartH} rx={6} fill="#f8fafc" style={{ transition: "fill 0.2s" }} onMouseEnter={e => e.currentTarget.setAttribute('fill', '#f1f5f9')} onMouseLeave={e => e.currentTarget.setAttribute('fill', '#f8fafc')} />
              
              {/* Animated Bar */}
              <motion.rect x={x} width={barW} rx={6} fill={col}
                initial={{ y: chartH, height: 0 }}
                animate={{ y, height: bh }}
                transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
                style={{ pointerEvents: "none" }}
              />
              
              <text x={x + barW / 2} y={Math.max(y - 6, 12)} textAnchor="middle" fontSize={10} fontWeight="900" fill={col} style={{ pointerEvents: "none" }}>{Math.round(pct)}%</text>
              
              {/* X-Axis Label - Angled */}
              <text 
                x={x + barW / 2} y={chartH + 18} 
                textAnchor="end" 
                fontSize={10} fontWeight="800" fill="#071521"
                transform={`rotate(-40 ${x + barW / 2} ${chartH + 18})`}
                style={{ pointerEvents: "none" }}
              >
                {label}
              </text>
              
              {/* Date directly underneath angled label */}
              <text 
                x={x + barW / 2 + 10} y={chartH + 18 + 14} 
                textAnchor="end" 
                fontSize={8} fontWeight="700" fill="#94a3b8"
                transform={`rotate(-40 ${x + barW / 2 + 10} ${chartH + 18 + 14})`}
                style={{ pointerEvents: "none" }}
              >
                {dateStr}
              </text>
            </g>
          );
        })}
        {/* X-Axis Base Line */}
        <line x1={34} y1={chartH} x2={Math.max(totalW + 38, 380)} y2={chartH} stroke="#cbd5e1" strokeWidth={3} strokeLinecap="round" />
      </svg>
    </div>
  );
}

function SubmissionRateChart({ homeworks, onSelect }) {
  // Show max 6 recent homeworks for this vertical layout
  const recent = [...homeworks].reverse().slice(0, 6);
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {recent.map((hw, i) => {
        const enrolled = hw.student_count || 1;
        const subs = hw.submission_count || 0;
        const pct = Math.min(100, (subs / enrolled) * 100);
        
        let label = hw.title;
        if (label.length > 25) label = label.slice(0, 24) + "…";
        
        const isComplete = pct === 100;
        const col = isComplete ? "#34d399" : (pct > 50 ? "#60a5fa" : "#f87171");

        return (
          <div key={hw.id} style={{ cursor: "pointer" }} onClick={() => onSelect(hw)}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#071521", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#3F6E8F"} onMouseLeave={e => e.currentTarget.style.color = "#071521"}>
                {label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 900, color: col }}>
                {subs} <span style={{ color: "#94a3b8", fontSize: 10 }}>/ {enrolled}</span>
              </span>
            </div>
            <div style={{ height: 14, background: "#f1f5f9", borderRadius: 8, overflow: "hidden", border: "2px solid #e2e8f0" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                style={{ 
                  height: "100%", 
                  background: `linear-gradient(90deg, ${col}, ${col}dd)`, 
                  borderRadius: 6 
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// DRILL-DOWN MODAL
// ──────────────────────────────────────────────

function HomeworkDetailsModal({ hw, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const res = await fetch(`${API}/teacher/homework/${hw.id}/submissions`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, [hw.id]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(7, 21, 33, 0.4)", backdropFilter: "blur(4px)" }}
      />
      
      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{ 
          width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto",
          background: "#ffffff", border: "4px solid #071521", borderRadius: 16, 
          boxShadow: "12px 12px 0 #d8a0c4", position: "relative", zIndex: 10
        }}
      >
        <div style={{ padding: "24px 32px", borderBottom: "4px solid #071521", background: "#f8fafc", position: "sticky", top: 0, zIndex: 5, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#071521", fontFamily: "'Sora', sans-serif", marginBottom: 4 }}>
              {hw.title}
            </h2>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#3F6E8F" }}>
              {hw.subject} • Created on {hw.created_at ? new Date(hw.created_at).toLocaleDateString() : "N/A"}
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              width: 36, height: 36, borderRadius: 10, border: "3px solid #071521", background: "#ffffff", 
              fontWeight: 900, cursor: "pointer", display: "grid", placeItems: "center" 
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "32px" }}>
          {/* Quick Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
            <div style={{ background: "#f1f5f9", padding: "16px", borderRadius: 10, border: "2px solid #cbd5e1" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Completion</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#071521" }}>{hw.submission_count} / {hw.student_count}</div>
            </div>
            <div style={{ background: "#f1f5f9", padding: "16px", borderRadius: 10, border: "2px solid #cbd5e1" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Average Score</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#071521" }}>{hw.avg_score}%</div>
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#071521", marginBottom: 16, paddingBottom: 8, borderBottom: "2px solid #e2e8f0" }}>
            Student Submissions
          </h3>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b", fontWeight: 700 }}>Loading submissions...</div>
          ) : data?.submissions?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b", fontWeight: 700 }}>No students enrolled.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.submissions.map((sub, i) => (
                <div key={i} style={{ 
                  display: "flex", alignItems: "center", justifyContent: "space-between", 
                  padding: "16px", borderRadius: 10, border: "2px solid #e2e8f0", background: "#ffffff" 
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#d8e8f4", border: "2px solid #8bb7d8", display: "grid", placeItems: "center", fontWeight: 900, color: "#273c75" }}>
                      {sub.student_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#071521" }}>{sub.student_name}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>
                        {sub.status === "pending" ? "Not submitted" : `Submitted ${new Date(sub.submitted_at).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  
                  {sub.status !== "pending" ? (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: gradeColor[getGrade(sub.percentage)] || "#071521" }}>
                        {sub.percentage}%
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>
                        {sub.total_score} / {sub.max_score} marks
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "4px 10px", borderRadius: 6, background: "#f1f5f9", fontSize: 11, fontWeight: 800, color: "#64748b" }}>
                      Pending
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
