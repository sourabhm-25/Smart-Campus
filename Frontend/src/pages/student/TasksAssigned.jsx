// // import { motion } from "framer-motion";
// // import { useNavigate } from "react-router-dom";
// // import { useEffect, useState } from "react";

// // const API = "http://localhost:8000";
// // const getToken = () => localStorage.getItem("access_token");

// // const SUBJECT_META = {
// //   mathematics: { icon: "📐", color: "#60a5fa" },
// //   math: { icon: "📐", color: "#60a5fa" },
// //   english: { icon: "📖", color: "#a78bfa" },
// //   science: { icon: "🔬", color: "#34d399" },
// //   "social studies": { icon: "🌍", color: "#fb923c" },
// //   "social science": { icon: "🌍", color: "#fb923c" },
// //   "computer science": { icon: "💻", color: "#f472b6" },
// //   "art & design": { icon: "🎨", color: "#fbbf24" },
// // };
// // const getMeta = (name = "") => SUBJECT_META[name.toLowerCase()] || { icon: "📚", color: "#94a3b8" };

// // export default function TasksAssigned() {
// //   const navigate = useNavigate();

// //   const [subjects, setSubjects] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   useEffect(() => {
// //     const token = getToken();
// //     if (!token) { setLoading(false); setError("Not logged in"); return; }

// //     fetch(`${API}/student/homework`, {
// //       headers: { Authorization: `Bearer ${token}` },
// //     })
// //       .then(r => {
// //         if (!r.ok) throw new Error(`Server error ${r.status}`);
// //         return r.json();
// //       })
// //       .then(data => {
// //         // Group homework by subject
// //         const grouped = {};
// //         for (const hw of (data.homework || [])) {
// //           const key = hw.subject || "General";
// //           if (!grouped[key]) {
// //             const meta = getMeta(key);
// //             grouped[key] = {
// //               id: key.toLowerCase().replace(/\s+/g, "-"),
// //               name: key,
// //               icon: meta.icon,
// //               color: meta.color,
// //               tasks: 0,
// //               unsubmitted: 0,
// //             };
// //           }
// //           grouped[key].tasks += 1;
// //           if (!hw.submitted) grouped[key].unsubmitted += 1;
// //         }
// //         setSubjects(Object.values(grouped));
// //         setLoading(false);
// //       })
// //       .catch(err => {
// //         console.error("Failed to load homework:", err);
// //         setError("Could not load homework. Make sure you're enrolled in a class.");
// //         setLoading(false);
// //       });
// //   }, []);

// //   if (loading) {
// //     return (
// //       <div style={{ padding: "40px", color: "#64748b" }}>
// //         Loading subjects…
// //       </div>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <div style={{ padding: "40px" }}>
// //         <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "16px 20px", color: "#fca5a5", fontSize: 14 }}>
// //           ⚠️ {error}
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div style={{ padding: "40px" }}>

// //       {/* Heading */}
// //       <motion.h1
// //         initial={{ opacity: 0, y: 10 }}
// //         animate={{ opacity: 1, y: 0 }}
// //         transition={{ duration: 0.4 }}
// //         style={{
// //           fontFamily: "'Sora', sans-serif",
// //           fontWeight: 700,
// //           fontSize: 22,
// //           marginBottom: 28,
// //         }}
// //       >
// //         Tasks Assigned
// //       </motion.h1>

// //       {subjects.length === 0 ? (
// //         <motion.div
// //           initial={{ opacity: 0 }} animate={{ opacity: 1 }}
// //           style={{ color: "#475569", fontSize: 15, textAlign: "center", padding: "60px 0" }}>
// //           <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
// //           <div>No homework assigned yet.</div>
// //           <div style={{ fontSize: 13, marginTop: 8, color: "#334155" }}>Check back after your teacher assigns tasks.</div>
// //         </motion.div>
// //       ) : (
// //         /* Grid */
// //         <div
// //           style={{
// //             display: "grid",
// //             gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
// //             gap: 18,
// //           }}
// //         >
// //           {subjects.map((subject, i) => (
// //             <motion.div
// //               key={subject.id}
// //               initial={{ opacity: 0, y: 20 }}
// //               animate={{ opacity: 1, y: 0 }}
// //               transition={{ delay: i * 0.08 }}
// //               whileHover={{
// //                 y: -6,
// //                 borderColor: `${subject.color}50`,
// //                 boxShadow: `0 10px 30px ${subject.color}20`,
// //               }}
// //               onClick={() =>
// //                 navigate(`/student/tasks/${subject.id}`)
// //               }
// //               style={{
// //                 background: "rgba(255,255,255,0.03)",
// //                 border: "1px solid rgba(255,255,255,0.07)",
// //                 borderRadius: 18,
// //                 padding: "24px",
// //                 cursor: "pointer",
// //                 transition: "all 0.25s",
// //                 position: "relative",
// //               }}
// //             >
// //               {/* Unsubmitted badge */}
// //               {subject.unsubmitted > 0 && (
// //                 <div style={{
// //                   position: "absolute", top: 14, right: 14,
// //                   background: "#ef4444", color: "#fff",
// //                   fontSize: 11, fontWeight: 700, borderRadius: 99,
// //                   padding: "2px 8px",
// //                 }}>
// //                   {subject.unsubmitted} due
// //                 </div>
// //               )}

// //               <div style={{ fontSize: 28, marginBottom: 16 }}>
// //                 {subject.icon}
// //               </div>

// //               <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
// //                 {subject.name}
// //               </div>

// //               <div style={{ fontSize: 12, color: "#64748b" }}>
// //                 {subject.tasks} Task{subject.tasks !== 1 ? "s" : ""} Assigned
// //               </div>

// //               {/* Accent Line */}
// //               <motion.div
// //                 initial={{ scaleX: 0 }}
// //                 animate={{ scaleX: 1 }}
// //                 transition={{ delay: 0.4 + i * 0.05 }}
// //                 style={{
// //                   marginTop: 18,
// //                   height: 2,
// //                   background: subject.color,
// //                   transformOrigin: "left",
// //                   borderRadius: 99,
// //                 }}
// //               />
// //             </motion.div>
// //           ))}
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// import { motion, AnimatePresence } from "framer-motion";
// import { useEffect, useState } from "react";

// const API = "http://localhost:8000";
// const getToken = () => localStorage.getItem("access_token");

// const SUBJECT_META = {
//   mathematics: { icon: "📐", color: "#60a5fa" },
//   math: { icon: "📐", color: "#60a5fa" },
//   english: { icon: "📖", color: "#a78bfa" },
//   science: { icon: "🔬", color: "#34d399" },
//   "social studies": { icon: "🌍", color: "#fb923c" },
//   "social science": { icon: "🌍", color: "#fb923c" },
//   "computer science": { icon: "💻", color: "#f472b6" },
//   "art & design": { icon: "🎨", color: "#fbbf24" },
// };
// const getMeta = (name = "") =>
//   SUBJECT_META[name.toLowerCase()] || { icon: "📚", color: "#94a3b8" };

// function formatDeadline(deadline) {
//   if (!deadline) return null;
//   const d = new Date(deadline);
//   if (isNaN(d)) return deadline;
//   const now = new Date();
//   const diff = d - now;
//   const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
//   const formatted = d.toLocaleDateString("en-IN", {
//     day: "numeric", month: "short", year: "numeric",
//   });
//   if (days < 0) return { label: `Overdue · ${formatted}`, urgent: true };
//   if (days === 0) return { label: `Due Today · ${formatted}`, urgent: true };
//   if (days <= 2) return { label: `Due in ${days}d · ${formatted}`, urgent: true };
//   return { label: `Due ${formatted}`, urgent: false };
// }

// function TaskCard({ task, color }) {
//   const [expanded, setExpanded] = useState(false);
//   const deadline = formatDeadline(task.deadline);

//   const statusConfig = task.submitted
//     ? { label: task.submission_status === "late" ? "Submitted Late" : "Submitted", color: "#34d399", bg: "rgba(52,211,153,0.1)" }
//     : { label: "Pending", color: "#fb923c", bg: "rgba(251,146,60,0.1)" };

//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, y: 8 }}
//       animate={{ opacity: 1, y: 0 }}
//       style={{
//         background: "rgba(255,255,255,0.03)",
//         border: `1px solid rgba(255,255,255,0.07)`,
//         borderRadius: 14,
//         overflow: "hidden",
//         marginBottom: 10,
//       }}
//     >
//       {/* Task header row */}
//       <div
//         onClick={() => setExpanded(e => !e)}
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "14px 18px",
//           cursor: "pointer",
//           gap: 12,
//         }}
//       >
//         {/* Left: title + meta */}
//         <div style={{ flex: 1, minWidth: 0 }}>
//           <div style={{
//             fontSize: 14,
//             fontWeight: 600,
//             color: "#e2e8f0",
//             whiteSpace: "nowrap",
//             overflow: "hidden",
//             textOverflow: "ellipsis",
//             marginBottom: 4,
//           }}>
//             {task.title}
//           </div>
//           <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
//             {/* Task type badge */}
//             <span style={{
//               fontSize: 11,
//               color: color,
//               background: `${color}18`,
//               borderRadius: 6,
//               padding: "2px 8px",
//               fontWeight: 600,
//               textTransform: "capitalize",
//             }}>
//               {task.task_type}
//             </span>
//             {/* Deadline */}
//             {deadline && (
//               <span style={{
//                 fontSize: 11,
//                 color: deadline.urgent ? "#fca5a5" : "#64748b",
//               }}>
//                 {deadline.label}
//               </span>
//             )}
//           </div>
//         </div>

//         {/* Right: status + chevron */}
//         <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
//           <span style={{
//             fontSize: 11,
//             fontWeight: 700,
//             color: statusConfig.color,
//             background: statusConfig.bg,
//             borderRadius: 99,
//             padding: "3px 10px",
//           }}>
//             {statusConfig.label}
//           </span>
//           <motion.span
//             animate={{ rotate: expanded ? 180 : 0 }}
//             transition={{ duration: 0.2 }}
//             style={{ color: "#475569", fontSize: 13 }}
//           >
//             ▼
//           </motion.span>
//         </div>
//       </div>

//       {/* Expanded detail */}
//       <AnimatePresence initial={false}>
//         {expanded && (
//           <motion.div
//             key="detail"
//             initial={{ height: 0, opacity: 0 }}
//             animate={{ height: "auto", opacity: 1 }}
//             exit={{ height: 0, opacity: 0 }}
//             transition={{ duration: 0.25, ease: "easeInOut" }}
//             style={{ overflow: "hidden" }}
//           >
//             <div style={{
//               borderTop: "1px solid rgba(255,255,255,0.06)",
//               padding: "16px 18px",
//               display: "flex",
//               flexDirection: "column",
//               gap: 12,
//             }}>
//               {/* Description */}
//               {task.description && (
//                 <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
//                   {task.description}
//                 </p>
//               )}

//               {/* Meta row */}
//               <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
//                 {task.teacher_name && (
//                   <div>
//                     <div style={{ fontSize: 10, color: "#475569", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Teacher</div>
//                     <div style={{ fontSize: 13, color: "#cbd5e1" }}>{task.teacher_name}</div>
//                   </div>
//                 )}
//                 {task.submission_score != null && (
//                   <div>
//                     <div style={{ fontSize: 10, color: "#475569", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Score</div>
//                     <div style={{ fontSize: 13, color: "#34d399", fontWeight: 700 }}>{task.submission_score}</div>
//                   </div>
//                 )}
//                 {task.grade && (
//                   <div>
//                     <div style={{ fontSize: 10, color: "#475569", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Grade</div>
//                     <div style={{ fontSize: 13, color: "#cbd5e1" }}>{task.grade}</div>
//                   </div>
//                 )}
//               </div>

//               {/* Questions preview */}
//               {task.questions && task.questions.length > 0 && (
//                 <div>
//                   <div style={{ fontSize: 11, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
//                     Questions ({task.questions.length})
//                   </div>
//                   <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
//                     {task.questions.slice(0, 3).map((q, idx) => (
//                       <div key={idx} style={{
//                         fontSize: 12,
//                         color: "#94a3b8",
//                         background: "rgba(255,255,255,0.03)",
//                         borderRadius: 8,
//                         padding: "8px 12px",
//                         borderLeft: `3px solid ${color}`,
//                       }}>
//                         <span style={{ color: color, fontWeight: 700, marginRight: 6 }}>Q{idx + 1}.</span>
//                         {typeof q === "string" ? q : q.question || q.text || JSON.stringify(q)}
//                       </div>
//                     ))}
//                     {task.questions.length > 3 && (
//                       <div style={{ fontSize: 12, color: "#475569", paddingLeft: 4 }}>
//                         +{task.questions.length - 3} more questions
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Action button */}
//               {!task.submitted && (
//                 <motion.button
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                   style={{
//                     alignSelf: "flex-start",
//                     background: color,
//                     color: "#0f172a",
//                     border: "none",
//                     borderRadius: 8,
//                     padding: "8px 18px",
//                     fontSize: 13,
//                     fontWeight: 700,
//                     cursor: "pointer",
//                     marginTop: 4,
//                   }}
//                 >
//                   Start Task →
//                 </motion.button>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// function SubjectAccordion({ subject, index }) {
//   const [open, setOpen] = useState(false);
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [fetched, setFetched] = useState(false);

//   const handleToggle = () => {
//     if (!fetched) {
//       setLoading(true);
//       const token = getToken();
//       fetch(`${API}/student/homework/${encodeURIComponent(subject.name)}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//         .then(r => r.json())
//         .then(data => {
//           setTasks(data.homework || []);
//           setFetched(true);
//           setLoading(false);
//         })
//         .catch(() => {
//           setLoading(false);
//           setFetched(true);
//         });
//     }
//     setOpen(o => !o);
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay: index * 0.07 }}
//       style={{
//         background: "rgba(255,255,255,0.03)",
//         border: "1px solid rgba(255,255,255,0.07)",
//         borderRadius: 18,
//         overflow: "hidden",
//         marginBottom: 14,
//       }}
//     >
//       {/* Subject header */}
//       <div
//         onClick={handleToggle}
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "20px 24px",
//           cursor: "pointer",
//           position: "relative",
//         }}
//       >
//         {/* Accent left bar */}
//         <div style={{
//           position: "absolute", left: 0, top: 0, bottom: 0,
//           width: 4, background: subject.color, borderRadius: "18px 0 0 18px",
//         }} />

//         <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
//           <span style={{ fontSize: 26 }}>{subject.icon}</span>
//           <div>
//             <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>
//               {subject.name}
//             </div>
//             <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
//               {subject.tasks} Task{subject.tasks !== 1 ? "s" : ""} · {subject.unsubmitted} pending
//             </div>
//           </div>
//         </div>

//         <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//           {subject.unsubmitted > 0 && (
//             <div style={{
//               background: "#ef4444",
//               color: "#fff",
//               fontSize: 11,
//               fontWeight: 700,
//               borderRadius: 99,
//               padding: "2px 10px",
//             }}>
//               {subject.unsubmitted} due
//             </div>
//           )}
//           <motion.span
//             animate={{ rotate: open ? 180 : 0 }}
//             transition={{ duration: 0.25 }}
//             style={{ color: subject.color, fontSize: 14 }}
//           >
//             ▼
//           </motion.span>
//         </div>
//       </div>

//       {/* Tasks list */}
//       <AnimatePresence initial={false}>
//         {open && (
//           <motion.div
//             key="tasks"
//             initial={{ height: 0, opacity: 0 }}
//             animate={{ height: "auto", opacity: 1 }}
//             exit={{ height: 0, opacity: 0 }}
//             transition={{ duration: 0.3, ease: "easeInOut" }}
//             style={{ overflow: "hidden" }}
//           >
//             <div style={{
//               borderTop: "1px solid rgba(255,255,255,0.06)",
//               padding: "16px 20px",
//             }}>
//               {loading ? (
//                 <div style={{ color: "#475569", fontSize: 13, padding: "12px 0" }}>
//                   Loading tasks…
//                 </div>
//               ) : tasks.length === 0 ? (
//                 <div style={{ color: "#475569", fontSize: 13, padding: "12px 0", textAlign: "center" }}>
//                   No active tasks for this subject.
//                 </div>
//               ) : (
//                 tasks.map(task => (
//                   <TaskCard key={task.id} task={task} color={subject.color} />
//                 ))
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// export default function TasksAssigned() {
//   const [subjects, setSubjects] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const token = getToken();
//     if (!token) { setLoading(false); setError("Not logged in"); return; }

//     fetch(`${API}/student/homework`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then(r => {
//         if (!r.ok) throw new Error(`Server error ${r.status}`);
//         return r.json();
//       })
//       .then(data => {
//         const grouped = {};
//         for (const hw of (data.homework || [])) {
//           const key = hw.subject || "General";
//           if (!grouped[key]) {
//             const meta = getMeta(key);
//             grouped[key] = {
//               id: key.toLowerCase().replace(/\s+/g, "-"),
//               name: key,
//               icon: meta.icon,
//               color: meta.color,
//               tasks: 0,
//               unsubmitted: 0,
//             };
//           }
//           grouped[key].tasks += 1;
//           if (!hw.submitted) grouped[key].unsubmitted += 1;
//         }
//         setSubjects(Object.values(grouped));
//         setLoading(false);
//       })
//       .catch(() => {
//         setError("Could not load homework. Make sure you're enrolled in a class.");
//         setLoading(false);
//       });
//   }, []);

//   if (loading) return (
//     <div style={{ padding: "40px", color: "#64748b" }}>Loading subjects…</div>
//   );

//   if (error) return (
//     <div style={{ padding: "40px" }}>
//       <div style={{
//         background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
//         borderRadius: 12, padding: "16px 20px", color: "#fca5a5", fontSize: 14,
//       }}>
//         ⚠️ {error}
//       </div>
//     </div>
//   );

//   return (
//     <div style={{ padding: "40px", maxWidth: 760 }}>
//       <motion.h1
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//         style={{
//           fontFamily: "'Sora', sans-serif",
//           fontWeight: 700,
//           fontSize: 22,
//           marginBottom: 28,
//           color: "#f1f5f9",
//         }}
//       >
//         Tasks Assigned
//       </motion.h1>

//       {subjects.length === 0 ? (
//         <motion.div
//           initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//           style={{ color: "#475569", fontSize: 15, textAlign: "center", padding: "60px 0" }}
//         >
//           <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
//           <div>No homework assigned yet.</div>
//           <div style={{ fontSize: 13, marginTop: 8, color: "#334155" }}>
//             Check back after your teacher assigns tasks.
//           </div>
//         </motion.div>
//       ) : (
//         subjects.map((subject, i) => (
//           <SubjectAccordion key={subject.id} subject={subject} index={i} />
//         ))
//       )}
//     </div>
//   );
// }

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("access_token");

// ─────────────────────────────
// Subject colour / icon map
// ─────────────────────────────
const SUBJECT_META = {
  mathematics: { icon: "📐", color: "#60a5fa" },
  math: { icon: "📐", color: "#60a5fa" },
  english: { icon: "📖", color: "#a78bfa" },
  science: { icon: "🔬", color: "#34d399" },
  "social studies": { icon: "🌍", color: "#fb923c" },
  "social science": { icon: "🌍", color: "#fb923c" },
  "computer science": { icon: "💻", color: "#f472b6" },
  "art & design": { icon: "🎨", color: "#fbbf24" },
  history: { icon: "🏛️", color: "#f97316" },
  geography: { icon: "🗺️", color: "#22d3ee" },
};
const getMeta = (name = "") =>
  SUBJECT_META[name.toLowerCase()] || { icon: "📚", color: "#94a3b8" };

// ─────────────────────────────
// Helpers
// ─────────────────────────────
function formatDeadline(deadline) {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isNaN(d)) return { label: deadline, urgent: false };
  const now = new Date();
  const diff = d - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const fmt = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  if (days < 0) return { label: `Overdue · ${fmt}`, urgent: true };
  if (days === 0) return { label: `Due Today · ${fmt}`, urgent: true };
  if (days <= 2) return { label: `Due in ${days}d · ${fmt}`, urgent: true };
  return { label: `Due ${fmt}`, urgent: false };
}

/**
 * Normalise whatever shape the backend stores questions in:
 *   - Array directly                        → use as-is
 *   - { questions: [...] }                  → extract .questions
 *   - { mcq: [...], short_answer: [...] }   → merge arrays
 */
function normaliseQuestions(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.questions)) return raw.questions;
  // merge any array-valued keys  (e.g. mcq, short_answer, essay)
  return Object.values(raw).filter(Array.isArray).flat();
}

// ═══════════════════════════════════════════════════════
// TaskAttemptModal
// Full-screen overlay: renders every question, collects
// answers, submits to POST /student/homework/{id}/submit
// ═══════════════════════════════════════════════════════
function TaskAttemptModal({ task, color, onClose, onSubmitted }) {
  const [hw, setHw] = useState(null);
  const [loadingHw, setLoadingHw] = useState(true);
  const [answers, setAnswers] = useState({});   // { [qIndex]: string }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // set after successful submit
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Fetch full homework detail (includes all questions)
  useEffect(() => {
    setLoadingHw(true);
    fetch(`${API}/student/homework/${task.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then(data => { setHw(data); setLoadingHw(false); })
      .catch(err => { setFetchError(err.message); setLoadingHw(false); });
  }, [task.id]);

  const questions = normaliseQuestions(hw?.questions);

  const allAnswered = questions.length > 0 &&
    questions.every((_, i) => (answers[i] ?? "").trim() !== "");

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        answers: questions.map((q, i) => ({
          question_index: i,
          question: q.question || q.text || `Q${i + 1}`,
          answer: answers[i] ?? "",
          type: q.type || "short_answer",
        })),
      };
      const res = await fetch(`${API}/student/homework/${task.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Submission failed");
      setResult(data);
      onSubmitted(task.id); // tell parent to mark as submitted
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={result ? onClose : undefined}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        {/* Modal panel */}
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={e => e.stopPropagation()}
          style={{
            background: "#0f172a",
            border: `1px solid ${color}30`,
            borderRadius: 20,
            width: "100%",
            maxWidth: 680,
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: `0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px ${color}20`,
          }}
        >
          {/* ── Header ── */}
          <div style={{
            position: "sticky", top: 0, zIndex: 10,
            background: "#0f172a",
            borderBottom: `1px solid rgba(255,255,255,0.06)`,
            padding: "20px 24px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, color: color, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
                marginBottom: 6,
              }}>
                {task.subject} · {task.task_type}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>
                {task.title}
              </div>
              {task.teacher_name && (
                <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                  Assigned by {task.teacher_name}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#64748b",
                fontSize: 18,
                width: 34, height: 34,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: "24px" }}>

            {/* Loading state */}
            {loadingHw && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#475569" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
                Loading task…
              </div>
            )}

            {/* Fetch error */}
            {fetchError && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 10, padding: "14px 18px",
                color: "#fca5a5", fontSize: 13,
              }}>
                ⚠️ {fetchError}
              </div>
            )}

            {/* ── SUCCESS RESULT ── */}
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "32px 0" }}
              >
                <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
                  Task Submitted!
                </div>
                {result.total_score != null && (
                  <div style={{
                    fontSize: 36, fontWeight: 800,
                    color: color, marginBottom: 8,
                  }}>
                    {result.total_score}
                    {result.max_score != null && (
                      <span style={{ fontSize: 18, color: "#475569" }}>
                        /{result.max_score}
                      </span>
                    )}
                  </div>
                )}
                {result.message && (
                  <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20 }}>
                    {result.message}
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  style={{
                    background: color,
                    color: "#0f172a",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 28px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Done
                </motion.button>
              </motion.div>
            )}

            {/* ── TASK CONTENT ── */}
            {!loadingHw && !fetchError && !result && hw && (
              <>
                {/* Description */}
                {hw.description && (
                  <div style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: "14px 18px",
                    fontSize: 13,
                    color: "#94a3b8",
                    lineHeight: 1.7,
                    marginBottom: 24,
                  }}>
                    {hw.description}
                  </div>
                )}

                {/* Deadline */}
                {hw.deadline && (() => {
                  const dl = formatDeadline(hw.deadline);
                  return (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: dl.urgent ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${dl.urgent ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 8,
                      padding: "5px 12px",
                      fontSize: 12,
                      color: dl.urgent ? "#fca5a5" : "#64748b",
                      marginBottom: 24,
                    }}>
                      🕐 {dl.label}
                    </div>
                  );
                })()}

                {/* No questions */}
                {questions.length === 0 && (
                  <div style={{ color: "#475569", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
                    No questions found for this task.
                  </div>
                )}

                {/* Questions */}
                {questions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{
                      fontSize: 12, color: "#475569",
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      marginBottom: -8,
                    }}>
                      {questions.length} Question{questions.length !== 1 ? "s" : ""}
                    </div>

                    {questions.map((q, idx) => {
                      const qText = q.question || q.text || `Question ${idx + 1}`;
                      const qType = (q.type || "short_answer").toLowerCase();
                      const options = q.options || q.choices || [];
                      const marks = q.marks || q.points || null;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          style={{
                            background: "rgba(255,255,255,0.025)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderLeft: `3px solid ${color}`,
                            borderRadius: 12,
                            padding: "18px 20px",
                          }}
                        >
                          {/* Question text */}
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 8,
                            marginBottom: 14,
                          }}>
                            <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.6 }}>
                              <span style={{
                                color: color, fontWeight: 700,
                                marginRight: 8, fontSize: 13,
                              }}>
                                Q{idx + 1}.
                              </span>
                              {qText}
                            </div>
                            {marks && (
                              <span style={{
                                fontSize: 11, color: color,
                                background: `${color}18`,
                                borderRadius: 6, padding: "2px 8px",
                                fontWeight: 700, flexShrink: 0,
                              }}>
                                {marks} mark{marks !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>

                          {/* MCQ */}
                          {(qType === "mcq" || qType === "multiple_choice") && options.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {options.map((opt, oIdx) => {
                                const optText = typeof opt === "string" ? opt : opt.text || opt.label || String(opt);
                                const isSelected = answers[idx] === optText;
                                return (
                                  <label
                                    key={oIdx}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      padding: "10px 14px",
                                      borderRadius: 8,
                                      cursor: "pointer",
                                      background: isSelected ? `${color}18` : "rgba(255,255,255,0.03)",
                                      border: `1px solid ${isSelected ? color + "50" : "rgba(255,255,255,0.06)"}`,
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name={`q_${idx}`}
                                      value={optText}
                                      checked={isSelected}
                                      onChange={() => setAnswers(a => ({ ...a, [idx]: optText }))}
                                      style={{ accentColor: color, width: 15, height: 15 }}
                                    />
                                    <span style={{ fontSize: 13, color: isSelected ? "#f1f5f9" : "#94a3b8" }}>
                                      {optText}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* True / False */}
                          {qType === "true_false" && (
                            <div style={{ display: "flex", gap: 10 }}>
                              {["True", "False"].map(opt => {
                                const isSelected = answers[idx] === opt;
                                return (
                                  <label
                                    key={opt}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      padding: "8px 18px",
                                      borderRadius: 8,
                                      cursor: "pointer",
                                      background: isSelected ? `${color}18` : "rgba(255,255,255,0.03)",
                                      border: `1px solid ${isSelected ? color + "50" : "rgba(255,255,255,0.06)"}`,
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name={`q_${idx}`}
                                      value={opt}
                                      checked={isSelected}
                                      onChange={() => setAnswers(a => ({ ...a, [idx]: opt }))}
                                      style={{ accentColor: color }}
                                    />
                                    <span style={{ fontSize: 13, color: isSelected ? "#f1f5f9" : "#94a3b8" }}>
                                      {opt}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* Short answer / essay / fill-in-the-blank */}
                          {(
                            qType === "short_answer" ||
                            qType === "essay" ||
                            qType === "long_answer" ||
                            qType === "fill_in_the_blank" ||
                            qType === "fill" ||
                            // default for anything not handled above
                            (qType !== "mcq" && qType !== "multiple_choice" && qType !== "true_false")
                          ) && (
                              <textarea
                                value={answers[idx] ?? ""}
                                onChange={e => setAnswers(a => ({ ...a, [idx]: e.target.value }))}
                                placeholder={
                                  qType === "fill_in_the_blank" || qType === "fill"
                                    ? "Fill in the blank…"
                                    : qType === "essay" || qType === "long_answer"
                                      ? "Write your answer here…"
                                      : "Your answer…"
                                }
                                rows={qType === "essay" || qType === "long_answer" ? 5 : 2}
                                style={{
                                  width: "100%",
                                  background: "rgba(255,255,255,0.04)",
                                  border: `1px solid ${(answers[idx] ?? "").trim() ? color + "50" : "rgba(255,255,255,0.08)"}`,
                                  borderRadius: 8,
                                  padding: "10px 14px",
                                  fontSize: 13,
                                  color: "#e2e8f0",
                                  resize: "vertical",
                                  outline: "none",
                                  fontFamily: "inherit",
                                  lineHeight: 1.6,
                                  boxSizing: "border-box",
                                  transition: "border-color 0.15s",
                                }}
                              />
                            )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Submit error */}
                {submitError && (
                  <div style={{
                    marginTop: 16,
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 10, padding: "12px 16px",
                    color: "#fca5a5", fontSize: 13,
                  }}>
                    ⚠️ {submitError}
                  </div>
                )}

                {/* Submit button */}
                {questions.length > 0 && (
                  <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={onClose}
                      style={{
                        background: "transparent",
                        color: "#64748b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        padding: "10px 22px",
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={allAnswered ? { scale: 1.03 } : {}}
                      whileTap={allAnswered ? { scale: 0.97 } : {}}
                      onClick={allAnswered && !submitting ? handleSubmit : undefined}
                      style={{
                        background: allAnswered ? color : "rgba(255,255,255,0.06)",
                        color: allAnswered ? "#0f172a" : "#334155",
                        border: "none",
                        borderRadius: 10,
                        padding: "10px 28px",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: allAnswered && !submitting ? "pointer" : "not-allowed",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {submitting ? (
                        <>
                          <span style={{
                            width: 14, height: 14,
                            border: "2px solid #0f172a",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            display: "inline-block",
                            animation: "spin 0.6s linear infinite",
                          }} />
                          Submitting…
                        </>
                      ) : (
                        `Submit Task${!allAnswered ? ` (${questions.filter((_, i) => (answers[i] ?? "").trim() !== "").length}/${questions.length})` : ""}`
                      )}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════
// TaskCard  — single row inside a subject accordion
// ═══════════════════════════════════════════════════════
function TaskCard({ task, color, onAttempt }) {
  const [expanded, setExpanded] = useState(false);
  const deadline = formatDeadline(task.deadline);

  const statusConfig = task.submitted
    ? {
      label: task.submission_status === "late" ? "Submitted Late" : "Submitted",
      color: "#34d399",
      bg: "rgba(52,211,153,0.1)",
    }
    : { label: "Pending", color: "#fb923c", bg: "rgba(251,146,60,0.1)" };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      {/* Header row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          cursor: "pointer",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: "#e2e8f0",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            marginBottom: 4,
          }}>
            {task.title}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, color, background: `${color}18`,
              borderRadius: 6, padding: "2px 8px",
              fontWeight: 600, textTransform: "capitalize",
            }}>
              {task.task_type}
            </span>
            {deadline && (
              <span style={{ fontSize: 11, color: deadline.urgent ? "#fca5a5" : "#64748b" }}>
                {deadline.label}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: statusConfig.color,
            background: statusConfig.bg,
            borderRadius: 99, padding: "3px 10px",
          }}>
            {statusConfig.label}
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: "#475569", fontSize: 13 }}
          >
            ▼
          </motion.span>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "16px 18px",
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              {task.description && (
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
                  {task.description}
                </p>
              )}

              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {task.teacher_name && (
                  <div>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Teacher</div>
                    <div style={{ fontSize: 13, color: "#cbd5e1" }}>{task.teacher_name}</div>
                  </div>
                )}
                {task.grade && (
                  <div>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Grade</div>
                    <div style={{ fontSize: 13, color: "#cbd5e1" }}>{task.grade}</div>
                  </div>
                )}
                {task.submission_score != null && (
                  <div>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your Score</div>
                    <div style={{ fontSize: 13, color: "#34d399", fontWeight: 700 }}>
                      {task.submission_score}
                      {task.max_score != null && <span style={{ color: "#475569" }}>/{task.max_score}</span>}
                    </div>
                  </div>
                )}
                {task.feedback && (
                  <div>
                    <div style={{ fontSize: 10, color: "#475569", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Feedback</div>
                    <div style={{ fontSize: 13, color: "#a78bfa" }}>{task.feedback}</div>
                  </div>
                )}
              </div>

              {/* Question count hint */}
              {(() => {
                const qs = normaliseQuestions(task.questions);
                return qs.length > 0 ? (
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    📝 {qs.length} question{qs.length !== 1 ? "s" : ""} in this task
                  </div>
                ) : null;
              })()}

              {/* Action */}
              {!task.submitted ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={e => { e.stopPropagation(); onAttempt(task); }}
                  style={{
                    alignSelf: "flex-start",
                    background: color,
                    color: "#0f172a",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 20px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: 4,
                  }}
                >
                  Start Task →
                </motion.button>
              ) : (
                <div style={{
                  alignSelf: "flex-start",
                  background: "rgba(52,211,153,0.08)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 12,
                  color: "#34d399",
                }}>
                  ✓ Submitted
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// SubjectAccordion
// Uses tasks passed from parent (from the initial fetch)
// ═══════════════════════════════════════════════════════
function SubjectAccordion({ subject, index, onAttempt }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: 14,
      }}
    >
      {/* Subject header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          cursor: "pointer",
          position: "relative",
        }}
      >
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: 4, background: subject.color, borderRadius: "18px 0 0 18px",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 26 }}>{subject.icon}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>
              {subject.name}
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
              {subject.tasks} Task{subject.tasks !== 1 ? "s" : ""} · {subject.unsubmitted} pending
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {subject.unsubmitted > 0 && (
            <div style={{
              background: "#ef4444", color: "#fff",
              fontSize: 11, fontWeight: 700,
              borderRadius: 99, padding: "2px 10px",
            }}>
              {subject.unsubmitted} due
            </div>
          )}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            style={{ color: subject.color, fontSize: 14 }}
          >
            ▼
          </motion.span>
        </div>
      </div>

      {/* Tasks list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="tasks"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "16px 20px",
            }}>
              {subject.homeworkList.length === 0 ? (
                <div style={{ color: "#475569", fontSize: 13, padding: "12px 0", textAlign: "center" }}>
                  No active tasks for this subject.
                </div>
              ) : (
                subject.homeworkList.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    color={subject.color}
                    onAttempt={onAttempt}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════
export default function TasksAssigned() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptTask, setAttemptTask] = useState(null); // task being attempted

  const loadHomework = useCallback(() => {
    const token = getToken();
    if (!token) { setLoading(false); setError("Not logged in"); return; }

    fetch(`${API}/student/homework`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then(data => {
        // Group by subject, keep full homework objects
        const grouped = {};
        for (const hw of (data.homework || [])) {
          const key = hw.subject || "General";
          if (!grouped[key]) {
            const meta = getMeta(key);
            grouped[key] = {
              id: key.toLowerCase().replace(/\s+/g, "-"),
              name: key,
              icon: meta.icon,
              color: meta.color,
              tasks: 0,
              unsubmitted: 0,
              homeworkList: [],
            };
          }
          grouped[key].tasks += 1;
          if (!hw.submitted) grouped[key].unsubmitted += 1;
          grouped[key].homeworkList.push(hw);
        }
        setSubjects(Object.values(grouped));
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load homework. Make sure you're enrolled in a class.");
        setLoading(false);
      });
  }, []);

  useEffect(() => { loadHomework(); }, [loadHomework]);

  // Called when a task is successfully submitted inside the modal
  const handleSubmitted = useCallback((homeworkId) => {
    setSubjects(prev =>
      prev.map(subj => ({
        ...subj,
        unsubmitted: subj.homeworkList.some(h => h.id === homeworkId)
          ? Math.max(0, subj.unsubmitted - 1)
          : subj.unsubmitted,
        homeworkList: subj.homeworkList.map(h =>
          h.id === homeworkId ? { ...h, submitted: true } : h
        ),
      }))
    );
  }, []);

  // ── Render ──
  if (loading) return (
    <div style={{ padding: "40px", color: "#64748b" }}>Loading subjects…</div>
  );

  if (error) return (
    <div style={{ padding: "40px" }}>
      <div style={{
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: 12, padding: "16px 20px",
        color: "#fca5a5", fontSize: 14,
      }}>
        ⚠️ {error}
      </div>
    </div>
  );

  return (
    <>
      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ padding: "40px", maxWidth: 760 }}>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            marginBottom: 28,
            color: "#f1f5f9",
          }}
        >
          Tasks Assigned
        </motion.h1>

        {subjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ color: "#475569", fontSize: 15, textAlign: "center", padding: "60px 0" }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
            <div>No homework assigned yet.</div>
            <div style={{ fontSize: 13, marginTop: 8, color: "#334155" }}>
              Check back after your teacher assigns tasks.
            </div>
          </motion.div>
        ) : (
          subjects.map((subject, i) => (
            <SubjectAccordion
              key={subject.id}
              subject={subject}
              index={i}
              onAttempt={setAttemptTask}
            />
          ))
        )}
      </div>

      {/* Task Attempt Modal */}
      {attemptTask && (
        <TaskAttemptModal
          task={attemptTask}
          color={getMeta(attemptTask.subject).color}
          onClose={() => setAttemptTask(null)}
          onSubmitted={handleSubmitted}
        />
      )}
    </>
  );
}