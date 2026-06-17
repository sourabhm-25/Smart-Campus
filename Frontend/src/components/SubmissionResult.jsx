// SubmissionResult.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Rich result display after homework submission.
// Shows: total score, grade badge, per-question breakdown with criteria bars,
// AI transcription, confidence indicator, and teacher override status.
// ─────────────────────────────────────────────────────────────────────────────

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// ── Grade colour map ──────────────────────────────────────────────────────────
const GRADE_COLORS = {
  "A+": { bg: "#052e16", border: "#16a34a", text: "#4ade80", label: "Excellent" },
  "A": { bg: "#052e16", border: "#22c55e", text: "#86efac", label: "Very Good" },
  "B+": { bg: "#0c4a6e", border: "#0ea5e9", text: "#7dd3fc", label: "Good" },
  "B": { bg: "#0c4a6e", border: "#38bdf8", text: "#bae6fd", label: "Above Average" },
  "C": { bg: "#1c1917", border: "#f59e0b", text: "#fcd34d", label: "Average" },
  "D": { bg: "#2d1515", border: "#f97316", text: "#fdba74", label: "Needs Work" },
  "F": { bg: "#2d0f0f", border: "#ef4444", text: "#fca5a5", label: "Fail" },
};

const gradeStyle = (g) => GRADE_COLORS[g] || GRADE_COLORS["C"];

// ── Circular score ring ───────────────────────────────────────────────────────
function ScoreRing({ score, max, size = 120, grade }) {
  const pct = max > 0 ? score / max : 0;
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const gs = gradeStyle(grade);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={gs.border} strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      {/* Centre text */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontSize: 22, fontWeight: 800, color: gs.text,
          fontFamily: "'Sora', sans-serif"
        }}>
          {score}
        </span>
        <span style={{ fontSize: 11, color: "#475569" }}>/ {max}</span>
      </div>
    </div>
  );
}

// ── Per-criterion bar ─────────────────────────────────────────────────────────
function CriterionBar({ criterion, marks_awarded, max_marks, reason, delay = 0 }) {
  const pct = max_marks > 0 ? marks_awarded / max_marks : 0;
  const color = pct >= 1 ? "#22c55e" : pct >= 0.5 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "baseline", marginBottom: 4
      }}>
        <span style={{ fontSize: 12, color: "#94a3b8", flex: 1, paddingRight: 8 }}>
          {criterion}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: marks_awarded === max_marks ? "#4ade80"
            : marks_awarded > 0 ? "#fcd34d"
              : "#f87171",
          whiteSpace: "nowrap",
        }}>
          {marks_awarded} / {max_marks}
        </span>
      </div>

      {/* Bar track */}
      <div style={{
        height: 4, borderRadius: 9999,
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, delay, ease: "easeOut" }}
          style={{ height: "100%", background: color, borderRadius: 9999 }}
        />
      </div>

      {reason && (
        <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
          {reason}
        </div>
      )}
    </div>
  );
}

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ confidence, needs_review }) {
  if (needs_review) return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 700, padding: "2px 8px",
      borderRadius: 9999, background: "rgba(234,179,8,0.12)",
      border: "1px solid rgba(234,179,8,0.3)", color: "#fde047",
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      ⚠ Manual Review
    </span>
  );

  const pct = Math.round(confidence * 100);
  const col = confidence > 0.75 ? "#4ade80" : confidence > 0.5 ? "#fcd34d" : "#f87171";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 600, padding: "2px 8px",
      borderRadius: 9999, background: `${col}12`,
      border: `1px solid ${col}33`, color: col,
    }}>
      🔍 AI Confidence {pct}%
    </span>
  );
}

// ── Question result card ──────────────────────────────────────────────────────
function QuestionResultCard({ item, index }) {
  const [expanded, setExpanded] = useState(false);
  const { question, score, max_marks, transcription, feedback,
    criteria, confidence, needs_review, teacher_override } = item;

  const pct = max_marks > 0 ? score / max_marks : 0;
  const barColor = pct >= 0.8 ? "#22c55e" : pct >= 0.5 ? "#f59e0b" : "#ef4444";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${needs_review ? "rgba(234,179,8,0.25)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: "14px 18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Q number */}
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#64748b",
          flexShrink: 0,
        }}>
          {index + 1}
        </div>

        {/* Question text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, color: "#cbd5e1",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {question}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <ConfidenceBadge confidence={confidence} needs_review={needs_review} />
            {teacher_override && (
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 9999,
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#a5b4fc", fontWeight: 600,
              }}>
                ✏ Teacher Adjusted
              </span>
            )}
          </div>
        </div>

        {/* Score pill */}
        <div style={{
          flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
        }}>
          <span style={{
            fontSize: 16, fontWeight: 800,
            color: barColor,
            fontFamily: "'Sora', sans-serif",
          }}>
            {score}/{max_marks}
          </span>
          {/* Mini bar */}
          <div style={{
            width: 60, height: 3, borderRadius: 9999,
            background: "rgba(255,255,255,0.07)"
          }}>
            <div style={{
              width: `${pct * 100}%`, height: "100%",
              background: barColor, borderRadius: 9999,
              transition: "width 0.5s",
            }} />
          </div>
        </div>

        {/* Chevron */}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: "#475569", fontSize: 12, flexShrink: 0 }}
        >▼</motion.span>
      </div>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "0 18px 16px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: 14,
            }}>
              {/* Criteria breakdown */}
              {criteria && criteria.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{
                    fontSize: 10, color: "#475569", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10
                  }}>
                    Mark Breakdown
                  </div>
                  {criteria.map((c, i) => (
                    <CriterionBar
                      key={i}
                      criterion={c.criterion}
                      marks_awarded={c.marks_awarded}
                      max_marks={c.max_marks}
                      reason={c.reason}
                      delay={i * 0.08}
                    />
                  ))}
                </div>
              )}

              {/* AI Transcription */}
              {transcription && (
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10, padding: "10px 14px",
                  marginBottom: 10,
                }}>
                  <div style={{
                    fontSize: 10, color: "#475569", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6
                  }}>
                    What AI Read
                  </div>
                  <div style={{
                    fontSize: 12, color: "#94a3b8", lineHeight: 1.6,
                    fontFamily: "monospace"
                  }}>
                    {transcription}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div style={{
                  background: "rgba(14,165,233,0.06)",
                  border: "1px solid rgba(14,165,233,0.15)",
                  borderRadius: 10, padding: "10px 14px",
                }}>
                  <div style={{
                    fontSize: 10, color: "#475569", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6
                  }}>
                    Feedback
                  </div>
                  <div style={{ fontSize: 13, color: "#7dd3fc", lineHeight: 1.6 }}>
                    {feedback}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component — shown after successful submission
// ─────────────────────────────────────────────────────────────────────────────
export default function SubmissionResult({ result, onClose, subjectColor = "#60a5fa" }) {
  const {
    total_score, total_marks, percentage, grade,
    needs_review, message, breakdown = [],
  } = result;

  const gs = gradeStyle(grade);
  const reviewCount = breakdown.filter(b => b.needs_review).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(2,6,23,0.97)",
        overflowY: "auto",
        display: "flex", flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px 60px",
      }}
    >
      {/* Close */}
      <div style={{
        width: "100%", maxWidth: 640, display: "flex",
        justifyContent: "flex-end", marginBottom: 8
      }}>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, padding: "8px 16px",
            color: "#64748b", fontSize: 13, cursor: "pointer",
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Score header */}
      <div style={{
        width: "100%", maxWidth: 640,
        background: gs.bg,
        border: `1px solid ${gs.border}33`,
        borderRadius: 20,
        padding: "32px 28px",
        display: "flex", alignItems: "center", gap: 28,
        marginBottom: 24,
        flexWrap: "wrap",
      }}>
        <ScoreRing score={total_score} max={total_marks} grade={grade} />

        <div style={{ flex: 1 }}>
          <div style={{
            display: "inline-block",
            fontSize: 36, fontWeight: 900,
            fontFamily: "'Sora', sans-serif",
            color: gs.text,
            lineHeight: 1,
            marginBottom: 6,
          }}>
            {grade}
          </div>
          <div style={{ fontSize: 14, color: gs.text, opacity: 0.7, marginBottom: 8 }}>
            {gs.label} · {percentage}%
          </div>

          {needs_review && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 12, color: "#fde047",
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.25)",
                borderRadius: 8, padding: "6px 12px",
              }}
            >
              ⚠ {reviewCount} question{reviewCount > 1 ? "s" : ""} flagged for teacher review
            </motion.div>
          )}

          {!needs_review && (
            <div style={{ fontSize: 12, color: "#4ade80" }}>
              ✓ All answers graded with high confidence
            </div>
          )}
        </div>
      </div>

      {/* Question breakdown */}
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div style={{
          fontSize: 12, color: "#475569", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14
        }}>
          Question Breakdown
        </div>
        {breakdown.map((item, i) => (
          <QuestionResultCard key={i} item={item} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
