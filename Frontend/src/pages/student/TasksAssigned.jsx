import { motion, AnimatePresence } from "framer-motion";
import SubmissionResult from "../../components/SubmissionResult";
import { useEffect, useState, useCallback, useRef } from "react";
import ProctoringCamera from "./ProctoringCamera";

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
  SUBJECT_META[name.toLowerCase()] || { icon: "📚", color: "#37383aff" };

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
  if (days < 0) return { label: `Overdue · ${fmt}`, urgent: true, overdue: true };
  if (days === 0) return { label: `Due Today · ${fmt}`, urgent: true };
  if (days <= 2) return { label: `Due in ${days}d · ${fmt}`, urgent: true };
  return { label: `Due ${fmt}`, urgent: false };
}

// Normalize the questions array from various API shapes
function normaliseQuestions(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.questions)) return raw.questions;
  // Handle { mcq: [...], short_answer: [...], ... }
  const all = [];
  for (const [type, arr] of Object.entries(raw)) {
    if (Array.isArray(arr)) {
      arr.forEach(q => all.push({ ...q, type: q.type || type }));
    }
  }
  return all;
}

// Detect question type robustly
function detectType(q) {
  const t = (q.type || "").toLowerCase().replace(/[\s-]/g, "_");
  if (t.includes("mcq") || t.includes("multiple_choice") || t.includes("multiple")) return "mcq";
  if (t.includes("true") || t.includes("false") || t.includes("tf")) return "true_false";
  if (t.includes("fill")) return "fill";
  if (t.includes("essay") || t.includes("long")) return "essay";
  if (t.includes("matching")) return "matching";
  return "short_answer";
}

// ════════════════════════════════════════════════════════
// SpeakingTask — full-screen audio recorder + AI evaluator
// ════════════════════════════════════════════════════════
function SpeakingTask({ task, color, onClose, onSubmitted }) {
  const [hw, setHw] = useState(null);
  const [hwLoading, setHwLoading] = useState(true);
  const [hwError, setHwError] = useState(null);

  const [phase, setPhase] = useState("idle"); // idle | recording | processing | result | error
  const [recSeconds, setRecSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [bars, setBars] = useState(Array(32).fill(4));

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);

  // Fetch homework detail for speaking_passage
  useEffect(() => {
    fetch(`${API}/student/homework-detail/${task.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json(); })
      .then(data => { setHw(data); setHwLoading(false); })
      .catch(err => { setHwError(err.message); setHwLoading(false); });
  }, [task.id]);

  // Waveform animation
  const startWaveform = (stream) => {
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    src.connect(analyser);
    analyserRef.current = analyser;

    const update = () => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      setBars(Array.from(data).map(v => Math.max(4, (v / 255) * 80)));
      animRef.current = requestAnimationFrame(update);
    };
    animRef.current = requestAnimationFrame(update);
  };

  const stopWaveform = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setBars(Array(32).fill(4));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      mediaRef.current = mr;

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mr.start(250);
      setPhase("recording");
      setRecSeconds(0);

      timerRef.current = setInterval(() => {
        setRecSeconds(s => {
          if (s >= 180) { stopRecording(); return s; }
          return s + 1;
        });
      }, 1000);

      startWaveform(stream);
    } catch {
      setPhase("error");
      setSubmitError("Microphone access denied. Please allow microphone and try again.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    stopWaveform();
    setPhase("idle");
  };

  const submitAudio = async () => {
    if (!audioBlob) return;
    setPhase("processing");
    setSubmitError(null);
    try {
      const formData = new FormData();
      formData.append("homework_id", task.id);
      formData.append("duration_seconds", String(recSeconds || 1));
      formData.append("audio_file", audioBlob, "recording.webm");

      const res = await fetch(`${API}/speaking/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail?.message || data.detail || "Submission failed");
      }
      setResult(data);
      setPhase("result");
      onSubmitted(task.id);
    } catch (err) {
      setPhase("error");
      setSubmitError(err.message);
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const scoreColor = (pct) => {
    if (pct >= 80) return "#34d399";
    if (pct >= 60) return "#60a5fa";
    if (pct >= 40) return "#fbbf24";
    return "#f87171";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0,
        background: "#07101f",
        zIndex: 1000,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div style={{
        padding: "16px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, color: "#1a1a1bff", fontSize: 13, fontWeight: 600,
              padding: "8px 14px", cursor: "pointer",
            }}
          >
            ← Exit
          </button>
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 11, color, background: `${color}18`, borderRadius: 6, padding: "3px 10px", fontWeight: 700, textTransform: "uppercase" }}>
                {task.subject}
              </span>
              <span style={{ fontSize: 11, color: "#a78bfa", background: "rgba(167,139,250,0.12)", borderRadius: 6, padding: "3px 10px", fontWeight: 700 }}>
                🎤 Speaking
              </span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#44494eff", marginTop: 4 }}>{task.title}</div>
          </div>
        </div>
        {phase === "recording" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.div
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }}
            />
            <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>
              {fmt(recSeconds)}
            </span>
            <span style={{ color: "#071521", fontSize: 12 }}>/ 3:00</span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px" }}>
        {hwLoading && (
          <div style={{ color: "#071521", display: "flex", alignItems: "center", gap: 12, margin: "auto 0" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: 28, height: 28, border: `3px solid ${color}33`, borderTopColor: color, borderRadius: "50%" }} />
            Loading task…
          </div>
        )}

        {hwError && (
          <div style={{ color: "#fca5a5", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "16px 24px", margin: "auto 0" }}>
            ⚠️ {hwError}
          </div>
        )}

        {/* ── RESULT SCREEN ── */}
        {phase === "result" && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: 600, width: "100%", display: "flex", flexDirection: "column", gap: 20, margin: "auto 0" }}
          >
            {/* Score hero */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: "32px 32px 24px", textAlign: "center",
            }}>
              <div style={{ fontSize: 14, color: "#071521", marginBottom: 12 }}>Your Speaking Score</div>
              <div style={{ fontSize: 72, fontWeight: 900, color: scoreColor(result.grade_percentage), lineHeight: 1, letterSpacing: "-0.04em" }}>
                {result.grade_percentage}%
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor(result.grade_percentage), marginTop: 6 }}>
                Grade {result.grade_letter}
              </div>
              <div style={{ fontSize: 13, color: "#071521", marginTop: 8 }}>
                {result.scores.total} / {result.scores.max} points
              </div>
            </div>

            {/* Score breakdown */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 24px" }}>
              <div style={{ fontSize: 11, color: "#071521", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Score Breakdown</div>
              {[
                { label: "Content Relevance", val: result.scores.content_relevance, max: 3 },
                { label: "Pronunciation", val: result.scores.pronunciation, max: 2 },
                { label: "Fluency", val: result.scores.fluency, max: 2 },
                { label: "Grammar", val: result.scores.grammar, max: 2 },
                { label: "Confidence", val: result.scores.confidence, max: 1 },
              ].map(({ label, val, max }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#313437ff" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{val}/{max}</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(val / max) * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 3 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "💪 Strengths", text: result.feedback.strengths, bg: "rgba(239, 230, 230, 1)", border: "rgba(52,211,153,0.2)", col: "#34d399" },
                { label: "📈 Improvements", text: result.feedback.improvements, bg: "rgba(255, 255, 255, 1)", border: "rgba(96,165,250,0.2)", col: "#60a5fa" },
                { label: "⭐ Encouragement", text: result.feedback.encouragement, bg: "rgba(255, 255, 255, 1)", border: "rgba(167,139,250,0.2)", col: "#a78bfa" },
              ].map(({ label, text, bg, border, col }) => (
                <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: col, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
                  <div style={{ fontSize: 13, color: "#091c35ff", lineHeight: 1.65 }}>{text || "—"}</div>
                </div>
              ))}
            </div>

            {/* Transcript */}
            {result.transcript && result.transcript !== "[No speech detected]" && (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, color: "#031c3fff", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>📝 AI Transcript</div>
                <div style={{ fontSize: 13, color: "#102a4fff", lineHeight: 1.7, fontStyle: "italic" }}>"{result.transcript}"</div>
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                background: `linear-gradient(135deg, ${color}cc, ${color})`,
                color: "#0a0f1a", border: "none", borderRadius: 12,
                padding: "14px 32px", fontSize: 14, fontWeight: 700,
                cursor: "pointer", boxShadow: `0 4px 20px ${color}44`,
              }}
            >
              Done ✓
            </button>
          </motion.div>
        )}

        {/* ── ERROR STATE ── */}
        {phase === "error" && (
          <div style={{ textAlign: "center", maxWidth: 420, margin: "auto 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
            <div style={{ color: "#fca5a5", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "16px 24px", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              {submitError}
            </div>
            <button
              onClick={() => { setPhase("idle"); setAudioBlob(null); setAudioUrl(null); }}
              style={{ background: color, color: "#0a0f1a", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {phase === "processing" && (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, margin: "auto 0" }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              style={{ width: 56, height: 56, border: `4px solid ${color}22`, borderTopColor: color, borderRadius: "50%" }}
            />
            <div style={{ fontSize: 15, color: "#041123ff", fontWeight: 600 }}>Gemini AI is evaluating your speech…</div>
            <div style={{ fontSize: 12, color: "#334155" }}>Analysing pronunciation, fluency, grammar, and confidence</div>
          </div>
        )}

        {/* ── IDLE / RECORDING STATE ── */}
        {(phase === "idle" || phase === "recording") && !hwLoading && !hwError && hw && (
          <div style={{ maxWidth: 560, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 28, margin: "auto 0" }}>

            {/* Passage card */}
            <div style={{
              background: "rgba(255,255,255,0.03)", border: `1px solid ${color}33`,
              borderRadius: 20, padding: "24px 28px", width: "100%", boxSizing: "border-box",
            }}>
              <div style={{ fontSize: 11, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                🎤 Speak About This
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#14253cff", lineHeight: 1.7 }}>
                {hw.speaking_passage || hw.title || "Speak about the given topic."}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "#334155" }}>
                Tip: Speak clearly, at a natural pace, in complete sentences.
              </div>
            </div>

            {/* Waveform visualizer */}
            <div style={{
              height: 80, display: "flex", alignItems: "center", gap: 3,
              padding: "0 16px",
            }}>
              {bars.slice(0, 24).map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: phase === "recording" ? h : 4 }}
                  transition={{ duration: 0.08 }}
                  style={{
                    width: 6, borderRadius: 3,
                    background: phase === "recording"
                      ? `hsl(${200 + i * 5}, 80%, 65%)`
                      : "rgba(255,255,255,0.06)",
                  }}
                />
              ))}
            </div>

            {/* Playback (after recording, idle state) */}
            {phase === "idle" && audioUrl && (
              <div style={{ width: "100%", boxSizing: "border-box" }}>
                <div style={{ fontSize: 12, color: "#071521", marginBottom: 8, textAlign: "center" }}>
                  Recording ready · {fmt(recSeconds)}
                </div>
                <audio
                  src={audioUrl}
                  controls
                  style={{
                    width: "100%", borderRadius: 10,
                    filter: "invert(1) hue-rotate(180deg) brightness(0.8)",
                  }}
                />
              </div>
            )}

            {/* Controls */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
              {phase === "idle" && !audioBlob && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={startRecording}
                  style={{
                    background: `linear-gradient(135deg, #ef4444cc, #ef4444)`,
                    color: "#530606ff", border: "none", borderRadius: 100,
                    padding: "16px 40px", fontSize: 15, fontWeight: 700,
                    cursor: "pointer", boxShadow: "0 4px 24px rgba(239,68,68,0.4)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  🎙️ Start Recording
                </motion.button>
              )}

              {phase === "recording" && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={stopRecording}
                  style={{
                    background: "rgba(239,68,68,0.15)", color: "#fca5a5",
                    border: "2px solid rgba(239,68,68,0.4)", borderRadius: 100,
                    padding: "14px 36px", fontSize: 15, fontWeight: 700,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  ⏹ Stop Recording
                </motion.button>
              )}

              {phase === "idle" && audioBlob && (
                <>
                  <button
                    onClick={() => { setAudioBlob(null); setAudioUrl(null); setRecSeconds(0); }}
                    style={{
                      background: "rgba(255,255,255,0.05)", color: "#525252ff",
                      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 100,
                      padding: "12px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    🔄 Re-record
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={submitAudio}
                    style={{
                      background: `linear-gradient(135deg, ${color}cc, ${color})`,
                      color: "#0a0f1a", border: "none", borderRadius: 100,
                      padding: "14px 36px", fontSize: 14, fontWeight: 700,
                      cursor: "pointer", boxShadow: `0 4px 20px ${color}44`,
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    ✓ Submit for Evaluation
                  </motion.button>
                </>
              )}
            </div>

            {/* Helper text */}
            {phase === "idle" && !audioBlob && (
              <div style={{ fontSize: 12, color: "#334155", textAlign: "center" }}>
                Max recording time: 3 minutes · Minimum: 2 seconds
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// PhotoUpload — camera / gallery input for text questions
// ════════════════════════════════════════════════════════
function PhotoUpload({ color, onPhotoSelected, currentPhoto, filePickerOpenRef }) {
  const fileRef = useRef();

  // Open the file picker while suppressing fullscreen-exit AND visibility violations
  const openFilePicker = (withCapture) => {
    if (withCapture) {
      fileRef.current.setAttribute("capture", "environment");
    } else {
      fileRef.current.removeAttribute("capture");
    }
    // Set flag to block violation handlers
    if (filePickerOpenRef) filePickerOpenRef.current = true;

    // Safety: clear flag after window regains focus (with delay so all events fire first)
    const clearFlag = () => {
      setTimeout(() => {
        if (filePickerOpenRef) filePickerOpenRef.current = false;
      }, 1500);
      window.removeEventListener("focus", clearFlag);
    };
    window.addEventListener("focus", clearFlag);

    fileRef.current.click();
  };

  const handleFile = (e) => {
    // Clear flag after a short delay so any pending events are ignored first
    setTimeout(() => {
      if (filePickerOpenRef) filePickerOpenRef.current = false;
    }, 1500);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPhotoSelected({ file, preview: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        fontSize: 11, color: "#071521", marginBottom: 8,
        textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        — or attach a photo of your handwritten answer —
      </div>

      {currentPhoto ? (
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            src={currentPhoto.preview}
            alt="Answer"
            style={{
              maxWidth: "100%", maxHeight: 200,
              borderRadius: 10,
              border: `2px solid ${color}55`,
              display: "block",
            }}
          />
          <button
            onClick={() => onPhotoSelected(null)}
            style={{
              position: "absolute", top: 6, right: 6,
              background: "rgba(0,0,0,0.7)", border: "none",
              borderRadius: "50%", width: 24, height: 24,
              color: "#071521", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10 }}>
          {/* Camera */}
          <button
            onClick={() => openFilePicker(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 10, cursor: "pointer",
              background: `${color}12`,
              border: `1px solid ${color}33`,
              color: "#071521", fontSize: 13, fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            📷 Take Photo
          </button>
          {/* Gallery */}
          <button
            onClick={() => openFilePicker(false)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 10, cursor: "pointer",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#071521", fontSize: 13, fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            🖼️ Upload Image
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFile}
          />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// QuestionSlide — isolated component so AnimatePresence
// exit animation always has stable, prop-frozen data
// ════════════════════════════════════════════════════════
function QuestionSlide({ question, stepIndex, color, answers, setAnswers, photos, setPhotos, submitError, total, filePickerOpenRef }) {
  if (!question) return null;
  const qType = detectType(question);
  const isLast = stepIndex === total - 1;

  return (
    <>
      {/* Question number + type badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `${color}22`, border: `2px solid ${color}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 900, color, flexShrink: 0,
        }}>
          Q{stepIndex + 1}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{
            fontSize: 11, color,
            background: `${color}18`, border: `1px solid ${color}44`,
            borderRadius: 6, padding: "4px 12px",
            textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800,
          }}>
            {qType === "mcq" ? "Multiple Choice"
              : qType === "true_false" ? "True / False"
                : qType === "fill" ? "Fill in the Blank"
                  : qType === "essay" ? "Essay" : "Short Answer"}
          </span>
          {(question.marks || question.points) && (
            <span style={{
              fontSize: 11, color: "#94a3b8",
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, padding: "4px 12px", fontWeight: 700,
            }}>
              {question.marks || question.points} mark{(question.marks || question.points) !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Question text */}
      <div style={{
        fontSize: 19, fontWeight: 700, color: "#f1f5f9",
        lineHeight: 1.75, marginBottom: 28,
        paddingLeft: 18, borderLeft: `4px solid ${color}88`,
      }}>
        {(() => {
          const qText = question.question || question.text;
          if (typeof qText === "string" || typeof qText === "number") return qText;
          if (qText) return JSON.stringify(qText);
          return `Question ${stepIndex + 1}`;
        })()}
      </div>

      {/* MCQ */}
      {qType === "mcq" && (() => {
        const rawOptions = question.options || question.choices || [];
        // Guard malformed data (object instead of array) so it can't crash the screen
        const options = Array.isArray(rawOptions) ? rawOptions : Object.values(rawOptions || {});
        const letters = ["A", "B", "C", "D", "E"];
        if (options.length === 0) return <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 700 }}>⚠️ No options for this question.</div>;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {options.map((opt, oIdx) => {
              const optText = typeof opt === "string" ? opt : (opt.text || opt.label || opt.option || String(opt));
              const isSelected = answers[stepIndex] === optText;
              return (
                <motion.label
                  key={oIdx}
                  whileHover={{ scale: 1.008, x: 3 }}
                  whileTap={{ scale: 0.996 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "16px 20px", borderRadius: 14, cursor: "pointer",
                    background: isSelected ? `${color}18` : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${isSelected ? color + "88" : "rgba(255,255,255,0.1)"}`,
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? `0 0 0 3px ${color}18` : "none",
                  }}
                >
                  <input type="radio" name={`q_${stepIndex}`} value={optText} checked={isSelected}
                    onChange={() => setAnswers(a => ({ ...a, [stepIndex]: optText }))}
                    style={{ display: "none" }}
                  />
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: isSelected ? color : "rgba(255,255,255,0.08)",
                    color: isSelected ? "#0a0f1a" : "#94a3b8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 900, flexShrink: 0, transition: "all 0.15s ease",
                  }}>{letters[oIdx] ?? oIdx + 1}</div>
                  <span style={{ fontSize: 15, color: isSelected ? "#f1f5f9" : "#cbd5e1", lineHeight: 1.55, flex: 1, fontWeight: isSelected ? 700 : 500 }}>
                    {optText}
                  </span>
                  {isSelected && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color, fontSize: 20, flexShrink: 0 }}>✓</motion.span>}
                </motion.label>
              );
            })}
          </div>
        );
      })()}

      {/* TRUE / FALSE */}
      {qType === "true_false" && (
        <div style={{ display: "flex", gap: 16 }}>
          {[{ val: "True", emoji: "✅", col: "#34d399" }, { val: "False", emoji: "❌", col: "#f87171" }].map(({ val, emoji, col }) => {
            const isSelected = answers[stepIndex] === val;
            return (
              <motion.label key={val} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                  padding: "28px 36px", borderRadius: 16, cursor: "pointer", flex: 1,
                  background: isSelected ? `${col}18` : "rgba(255,255,255,0.05)",
                  border: `2px solid ${isSelected ? col + "88" : "rgba(255,255,255,0.1)"}`,
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? `0 0 0 4px ${col}18` : "none",
                }}
              >
                <input type="radio" name={`q_${stepIndex}`} value={val} checked={isSelected}
                  onChange={() => setAnswers(a => ({ ...a, [stepIndex]: val }))} style={{ display: "none" }}
                />
                <span style={{ fontSize: 40 }}>{emoji}</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: isSelected ? col : "#94a3b8", transition: "color 0.15s" }}>{val}</span>
                {isSelected && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: 11, color: col, background: `${col}22`, fontWeight: 800, borderRadius: 6, padding: "3px 12px", border: `1px solid ${col}44` }}
                  >Selected ✓</motion.div>
                )}
              </motion.label>
            );
          })}
        </div>
      )}

      {/* FILL IN THE BLANK */}
      {qType === "fill" && (
        <textarea
          autoFocus
          value={answers[stepIndex] ?? ""}
          onChange={e => setAnswers(a => ({ ...a, [stepIndex]: e.target.value }))}
          placeholder="Type your answer in the blank…"
          rows={3}
          style={{
            width: "100%", background: "rgba(255,255,255,0.06)",
            border: `1.5px solid ${(answers[stepIndex] ?? "").trim() ? color + "88" : "rgba(255,255,255,0.14)"}`,
            borderRadius: 12, padding: "16px 20px", fontSize: 15, color: "#f1f5f9",
            resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.65,
            boxSizing: "border-box", transition: "border-color 0.2s", fontWeight: 500,
          }}
        />
      )}

      {/* SHORT ANSWER / ESSAY */}
      {(qType === "short_answer" || qType === "essay") && (
        <div>
          {!photos[stepIndex] ? (
            <textarea
              autoFocus
              value={answers[stepIndex] ?? ""}
              onChange={e => setAnswers(a => ({ ...a, [stepIndex]: e.target.value }))}
              placeholder={qType === "essay" ? "Write your detailed answer here…" : "Type your answer here…"}
              rows={qType === "essay" ? 7 : 4}
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)",
                border: `1.5px solid ${(answers[stepIndex] ?? "").trim() ? color + "88" : "rgba(255,255,255,0.14)"}`,
                borderRadius: 12, padding: "16px 20px", fontSize: 15, color: "#f1f5f9",
                resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.65,
                boxSizing: "border-box", transition: "border-color 0.2s", fontWeight: 500,
              }}
            />
          ) : (
            <div style={{
              width: "100%", background: `${color}12`, border: `1.5px solid ${color}44`,
              borderRadius: 12, padding: "16px 20px", fontSize: 14, color,
              fontFamily: "inherit", lineHeight: 1.65, boxSizing: "border-box",
              display: "flex", alignItems: "center", gap: 10, fontWeight: 700,
            }}>
              <span style={{ fontSize: 22 }}>📷</span>
              <span>Photo attached as your answer — text is not required.</span>
            </div>
          )}
          <PhotoUpload
            color={color}
            currentPhoto={photos[stepIndex] || null}
            onPhotoSelected={(photo) => setPhotos(p => ({ ...p, [stepIndex]: photo }))}
            filePickerOpenRef={filePickerOpenRef}
          />
        </div>
      )}

      {/* Submit error (last question only) */}
      {submitError && isLast && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", color: "#fca5a5", fontSize: 13 }}
        >
          ⚠️ {submitError}
        </motion.div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════
// QuizStepper — FULL SCREEN, one question at a time
// ════════════════════════════════════════════════════════
function QuizStepper({ task, color, onClose, onSubmitted }) {
  const [hw, setHw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState({});   // { [idx]: string }
  const [photos, setPhotos] = useState({});     // { [idx]: { file, preview } }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  const [timeLeft, setTimeLeft] = useState(null);
  const [warnings, setWarnings] = useState(0);
  const [warningMessage, setWarningMessage] = useState(null);
  const [testStarted, setTestStarted] = useState(task?.task_type !== "test");
  const [cameraActive, setCameraActive] = useState(true);
  const [aiReady, setAiReady] = useState(false);
  const [flashcardGatePassed, setFlashcardGatePassed] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const autoSubmitRef = useRef();

  // ── Stable refs so event listeners never need to be re-registered ──
  // These refs always point to the latest values without causing effect re-runs
  const submittingRef = useRef(false);
  const resultRef = useRef(null);
  const warningsRef = useRef(0);
  const filePickerOpenRef = useRef(false); // true while OS file dialog is open

  // Keep refs in sync with state
  useEffect(() => { submittingRef.current = submitting; }, [submitting]);
  useEffect(() => { resultRef.current = result; }, [result]);

  const requestFS = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
        else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request failed", err);
    }
  }, []);

  useEffect(() => {
    if (hw?.task_type === "test" && hw?.time_limit) {
      setTimeLeft(hw.time_limit * 60);
    }
  }, [hw]);

  useEffect(() => {
    if (timeLeft === null || result || submitting) return;
    if (!testStarted) return;
    if (hw?.flashcards?.length > 0 && !flashcardGatePassed) return;

    if (timeLeft <= 0) {
      if (autoSubmitRef.current) autoSubmitRef.current();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, result, submitting, testStarted, flashcardGatePassed, hw]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/student/homework-detail/${task.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then(data => { setHw(data); setLoading(false); })
      .catch(err => { setFetchError(err.message); setLoading(false); });
  }, [task.id]);

  const questions = normaliseQuestions(hw?.questions);
  const total = questions.length;
  const current = questions[step];
  const answeredCount = questions.filter((_, i) =>
    (answers[i] ?? "").trim() !== "" || !!photos[i]
  ).length;
  const currentAnswered = (answers[step] ?? "").trim() !== "" || !!photos[step];
  const allAnswered = total > 0 && answeredCount === total;
  const progress = total > 0 ? ((step + 1) / total) * 100 : 0;

  const goTo = (idx) => {
    setDirection(idx > step ? 1 : -1);
    setStep(idx);
  };
  const goNext = () => step < total - 1 && goTo(step + 1);
  const goPrev = () => step > 0 && goTo(step - 1);

  const handleSubmit = async () => {
    setCameraActive(false); // ✅ Kill camera instantly before submit process starts
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Guard: ensure token exists before sending
      const token = getToken();
      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }

      // Build FormData to support optional image uploads
      const formData = new FormData();
      const answersPayload = questions.map((q, i) => ({
        question_index: i,
        question: q.question || q.text || `Q${i + 1}`,
        answer: answers[i] ?? "",
        type: q.type || "short_answer",
        has_photo: !!photos[i],
      }));

      console.log("[SUBMIT] answers payload:", answersPayload);
      console.log("[SUBMIT] photos:", Object.keys(photos));
      console.log("[SUBMIT] token present:", !!token);

      formData.append("answers", JSON.stringify(answersPayload));
      Object.entries(photos).forEach(([idx, p]) => {
        if (p?.file) {
          formData.append(`photo_${idx}`, p.file);
          console.log(`[SUBMIT] appended photo_${idx}:`, p.file.name, p.file.size, "bytes");
        }
      });

      const res = await fetch(`${API}/student/homework/${task.id}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      console.log("[SUBMIT] response status:", res.status, "body:", data);

      if (!res.ok) {
        // detail can be a string or an array of validation errors
        const detail = data.detail;
        const msg = typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map(e => e.msg || JSON.stringify(e)).join("; ")
            : "Submission failed";
        throw new Error(msg);
      }

      setResult(data);
      onSubmitted(task.id);
    } catch (err) {
      console.error("[SUBMIT] error:", err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    autoSubmitRef.current = handleSubmit;
  });

  // handleViolation uses refs so it is STABLE (never recreated) — this is critical
  // so the fullscreen effect never needs to re-run and re-register its listeners.
  const handleViolation = useCallback((reason = null) => {
    // Use refs to read latest values without stale closures
    if (submittingRef.current || resultRef.current) return;
    // Also ignore if file picker is open
    if (filePickerOpenRef.current) return;

    setWarnings(prev => {
      const next = prev + 1;
      warningsRef.current = next;
      if (next >= 3) {
        alert(`Warning ${next}/3: You have repeatedly violated test rules. The test will now be submitted automatically.`);
        if (autoSubmitRef.current) autoSubmitRef.current();
      } else {
        setWarningMessage(`Warning ${next}/3: ${reason || "Please do not leave the test window or exit fullscreen."} Your test will be automatically submitted on the 3rd warning!`);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← empty deps: stable forever, reads state via refs

  // Nuclear fallback — whenever result is set (any submission path), kill camera
  useEffect(() => {
    if (result) setCameraActive(false);
  }, [result]);

  // Also kill on unmount — covers edge cases like parent closing the overlay
  useEffect(() => {
    return () => setCameraActive(false);
  }, []);

  // Fullscreen Lockdown for Tests
  // This effect runs ONCE when the test starts and NEVER re-runs during the test.
  // All state is read via stable refs so no re-registration is needed.
  useEffect(() => {
    if (task.task_type !== "test") return;
    if (!testStarted) return; // Wait until they click Start Test

    // Request fullscreen on test start
    requestFS();

    let hiddenTimeout = null;

    const handleVisibilityChange = () => {
      // Ignore: file picker open, already submitted, or already submitting
      if (filePickerOpenRef.current) return;
      if (resultRef.current || submittingRef.current) return;
      if (document.hidden) {
        handleViolation("You left the test window.");
        // 15-second auto-submit if they stay away
        hiddenTimeout = setTimeout(() => {
          if (autoSubmitRef.current) autoSubmitRef.current();
          setWarningMessage("You stayed out of the test window for more than 15 seconds. Your test has been automatically submitted.");
        }, 15000);
      } else {
        if (hiddenTimeout) clearTimeout(hiddenTimeout);
      }
    };

    const handleFullscreenChange = () => {
      // Ignore: file picker open, already submitted, or already submitting
      if (filePickerOpenRef.current) return;
      if (resultRef.current || submittingRef.current) return;
      const isFullscreen = document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
      if (!isFullscreen) handleViolation("You exited fullscreen mode.");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      // Cleanup: remove listeners and exit fullscreen when test ends/component unmounts
      if (hiddenTimeout) clearTimeout(hiddenTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.task_type, testStarted]); // ← minimal deps: runs once per test session

  // Seamlessly re-enter fullscreen on any click if we lost it (e.g. due to file picker)
  useEffect(() => {
    const handleAnyClick = () => {
      if (task.task_type !== "test") return;
      // No filePickerOpenRef check here — by the time a click fires,
      // the native picker has already closed, so this is always safe.
      if (testStarted && !document.fullscreenElement) {
        requestFS();
      }
    };
    document.addEventListener("click", handleAnyClick);
    return () => document.removeEventListener("click", handleAnyClick);
  }, [task.task_type, testStarted, requestFS]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (result || loading) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, total, result, loading]);

  const slideVariants = {
    enter: (d) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "#0d1526",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Top bar ── */}
      <div style={{
        padding: "14px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        background: "rgba(255,255,255,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {task.task_type !== "test" ? (
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 10, color: "#e2e8f0",
                fontSize: 13, fontWeight: 700,
                padding: "8px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}
            >
              ← Exit
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to exit? Your test will be submitted with your current answers.")) {
                  if (autoSubmitRef.current) autoSubmitRef.current();
                }
              }}
              style={{
                background: "rgba(239,68,68,0.18)",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 10, color: "#fca5a5",
                fontSize: 13, fontWeight: 700,
                padding: "8px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}
            >
              Exit Test
            </button>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontSize: 11, color, fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.1em",
                background: `${color}22`, borderRadius: 6, padding: "4px 12px",
                border: `1px solid ${color}44`,
              }}>
                {task.subject}
              </span>
              <span style={{
                fontSize: 11, color: "#94a3b8",
                background: "rgba(255,255,255,0.07)", borderRadius: 6, padding: "4px 12px",
                textTransform: "capitalize", fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)",
              }}>
                {task.task_type}
              </span>
              {timeLeft !== null && (
                <span style={{
                  fontSize: 11,
                  color: timeLeft < 60 ? "#ef4444" : "#fbbf24",
                  background: timeLeft < 60 ? "rgba(239,68,68,0.12)" : "rgba(251,191,36,0.12)",
                  borderRadius: 6, padding: "4px 12px",
                  fontWeight: 800, display: "flex", alignItems: "center", gap: 4,
                  border: `1px solid ${timeLeft < 60 ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.3)"}`,
                }}>
                  ⏱️ {formatTime(timeLeft)} remaining
                </span>
              )}
              {hw?.deadline && (() => {
                const dl = formatDeadline(hw.deadline);
                return (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: dl.urgent ? "#fca5a5" : "#64748b",
                  }}>
                    🕐 {dl.label}
                  </span>
                );
              })()}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", marginTop: 6 }}>
              {task.title}
            </div>
          </div>
        </div>

        {/* Progress pill */}
        {!loading && !fetchError && !result && total > 0 && (
          <div style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10, padding: "8px 16px",
            textAlign: "center", minWidth: 72,
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color }}>
              {step + 1}<span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>/{total}</span>
            </div>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
              {answeredCount} answered
            </div>
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      {!loading && !fetchError && !result && total > 0 && (
        <div style={{ height: 3, background: "rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})` }}
          />
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Loading */}
        {loading && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{
                width: 44, height: 44,
                border: `3px solid ${color}33`,
                borderTopColor: color,
                borderRadius: "50%",
              }}
            />
            <div style={{ color: "#94a3b8", fontSize: 14, fontWeight: 700 }}>Loading questions…</div>
          </div>
        )}

        {/* Fetch error */}
        {fetchError && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <div style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 14, padding: "24px 32px",
              color: "#fca5a5", fontSize: 14, maxWidth: 420, textAlign: "center", fontWeight: 700,
            }}>
              ⚠️ {fetchError}
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={onClose}
                  style={{
                    background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 8, padding: "10px 24px", color: "#e2e8f0",
                    fontSize: 13, cursor: "pointer", fontWeight: 700,
                  }}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No questions */}
        {!loading && !fetchError && !result && total === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ fontSize: 48 }}>📭</div>
            <div style={{ fontSize: 15, color: "#e2e8f0", fontWeight: 800 }}>No questions found for this task.</div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Contact your teacher for more information.</div>
          </div>
        )}

        {/* ── RESULT SCREEN ── */}
        {result && (
          <AnimatePresence>
            <SubmissionResult
              result={result}
              onClose={onClose}
              subjectColor={color}
            />
          </AnimatePresence>
        )}

        {/* ── QUESTION AREA ── */}
        {!loading && !fetchError && !result && current && (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* Left: dot sidebar */}
            <div style={{
              width: 68, flexShrink: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", padding: "24px 0",
              borderRight: "1px solid rgba(255,255,255,0.08)",
              overflowY: "auto", gap: 8,
              background: "rgba(255,255,255,0.02)",
            }}>
              {questions.map((_, i) => {
                const isAnswered = (answers[i] ?? "").trim() !== "" || !!photos[i];
                const isCurrent = i === step;
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    title={`Q${i + 1}`}
                    style={{
                      width: 34, height: 34,
                      borderRadius: isCurrent ? 10 : 8,
                      border: `2px solid ${isCurrent ? color : isAnswered ? color + "66" : "rgba(255,255,255,0.12)"}`,
                      background: isCurrent ? color : isAnswered ? `${color}22` : "rgba(255,255,255,0.05)",
                      color: isCurrent ? "#0a0f1a" : isAnswered ? color : "#64748b",
                      fontSize: 11, fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Right: question content */}
            <div style={{
              flex: 1, overflowY: "auto",
              display: "flex", flexDirection: "column",
              padding: "36px 48px",
              maxWidth: 800, margin: "0 auto", width: "100%",
            }}>
              <AnimatePresence custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{ flex: 1 }}
                >
                  <QuestionSlide
                    question={questions[step]}
                    stepIndex={step}
                    color={color}
                    answers={answers}
                    setAnswers={setAnswers}
                    photos={photos}
                    setPhotos={setPhotos}
                    submitError={submitError}
                    total={total}
                    filePickerOpenRef={filePickerOpenRef}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom nav bar ── */}
      {!loading && !fetchError && !result && total > 0 && (
        <div style={{
          padding: "16px 32px",
          borderTop: "1px solid rgba(255,255,255,0.09)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          background: "rgba(255,255,255,0.03)",
          gap: 12,
        }}>
          {/* Navigation Group (Left) */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <motion.button
              whileHover={step > 0 ? { scale: 1.02 } : {}}
              whileTap={step > 0 ? { scale: 0.97 } : {}}
              onClick={goPrev}
              disabled={step === 0}
              style={{
                background: step === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12, padding: "12px 24px",
                fontSize: 13, fontWeight: 700,
                color: step === 0 ? "#334155" : "#cbd5e1",
                cursor: step === 0 ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              ← Back
            </motion.button>

            {step < total - 1 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={goNext}
                style={{
                  background: currentAnswered ? color : "rgba(255,255,255,0.07)",
                  color: currentAnswered ? "#0a0f1a" : "#64748b",
                  border: "none", borderRadius: 12,
                  padding: "12px 28px", fontSize: 13, fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                Next →
              </motion.button>
            ) : (
              <motion.button
                whileHover={allAnswered ? { scale: 1.03 } : {}}
                whileTap={allAnswered ? { scale: 0.97 } : {}}
                onClick={allAnswered && !submitting ? handleSubmit : undefined}
                style={{
                  background: allAnswered ? color : "rgba(255,255,255,0.05)",
                  color: allAnswered ? "#0a0f1a" : "#f1f5f9",
                  border: "none", borderRadius: 12,
                  padding: "12px 32px", fontSize: 13, fontWeight: 800,
                  cursor: allAnswered && !submitting ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 8,
                  boxShadow: allAnswered ? `0 4px 20px ${color}55` : "none",
                }}
              >
                {submitting ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      style={{
                        width: 14, height: 14,
                        border: "2px solid #0a0f1a",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        display: "inline-block",
                      }}
                    />
                    Submitting…
                  </>
                ) : allAnswered ? "Submit Test ✓" : `Submit Test (${answeredCount}/${total} answered)`}
              </motion.button>
            )}
          </div>

          {/* Status Text (Right, clear of camera if in test mode) */}
          <div style={{
            fontSize: 12, fontWeight: 700, textAlign: "right",
            paddingRight: task.task_type === "test" ? 260 : 0
          }}>
            {allAnswered
              ? <span style={{ color: "#34d399" }}>✓ All questions answered</span>
              : <span style={{ color: "#64748b" }}>{total - answeredCount} question{total - answeredCount !== 1 ? "s" : ""} remaining</span>
            }
          </div>
        </div>
      )}

      {/* ── Warning Overlay ── */}
      {warningMessage && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(8,14,26,0.97)", backdropFilter: "blur(12px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 40, textAlign: "center",
        }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>⚠️</div>
          <h2 style={{ color: "#ef4444", fontSize: 24, marginBottom: 12, fontWeight: 900 }}>Test Rule Violation</h2>
          <p style={{ color: "#cbd5e1", fontSize: 16, maxWidth: 500, lineHeight: 1.7, marginBottom: 32, fontWeight: 500 }}>
            {warningMessage}
          </p>
          <button
            onClick={() => {
              setWarningMessage(null);
              requestFS();
            }}
            style={{
              background: "#ef4444", color: "#ffffff", border: "none",
              padding: "14px 32px", borderRadius: 12, fontSize: 15, fontWeight: 800,
              cursor: "pointer", boxShadow: "0 4px 24px rgba(239,68,68,0.5)",
            }}
          >
            Acknowledge & Return to Test
          </button>
        </div>
      )}

      {/* ── AI Proctoring Camera ── */}
      {task.task_type === "test" && cameraActive && !warningMessage && (
        <ProctoringCamera onViolation={handleViolation} onReady={() => setAiReady(true)} filePickerOpenRef={filePickerOpenRef} />
      )}

      {/* ── Pre-test setup overlay ── */}
      {!testStarted && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(8,14,26,0.97)", backdropFilter: "blur(12px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 40, textAlign: "center",
        }}>
          <div style={{ fontSize: 52, marginBottom: 18 }}>🎓</div>
          <h2 style={{ color: "#f1f5f9", fontSize: 26, marginBottom: 12, fontWeight: 900 }}>Test Preparation</h2>
          <p style={{ color: "#94a3b8", fontSize: 15, maxWidth: 500, marginBottom: 32, lineHeight: 1.7, fontWeight: 500 }}>
            This test requires camera access for AI proctoring. Please allow camera permissions in your browser.
          </p>
          <button
            disabled={!aiReady}
            onClick={() => {
              setTestStarted(true);
              requestFS();
            }}
            style={{
              background: aiReady ? color : "rgba(255,255,255,0.08)",
              color: aiReady ? "#0a0f1a" : "#475569",
              border: "none", padding: "16px 36px", borderRadius: 14,
              fontSize: 15, fontWeight: 800, cursor: aiReady ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: aiReady ? `0 8px 28px ${color}44` : "none",
            }}
          >
            {aiReady ? "Start Test & Enter Fullscreen 🚀" : "⏳ Loading AI Models..."}
          </button>
        </div>
      )}

      {/* ── Flashcard Gate Overlay ── */}
      {hw?.flashcards?.length > 0 && testStarted && !flashcardGatePassed && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(8,14,26,0.98)", backdropFilter: "blur(12px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 40, textAlign: "center",
        }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🃏</div>
          <h2 style={{ color: "#f1f5f9", fontSize: 24, marginBottom: 12, fontWeight: 900 }}>Review Your Flashcards</h2>
          <p style={{ color: "#94a3b8", fontSize: 15, maxWidth: 500, marginBottom: 30, fontWeight: 500 }}>
            Read and flip the flashcards below to review key concepts before starting.
          </p>

          {hw.flashcards[currentFlashcardIndex] && (
            <div
              onClick={() => setFlashcardFlipped(!flashcardFlipped)}
              style={{ perspective: 1200, maxWidth: 480, width: "100%", height: 320, marginBottom: 30, cursor: "pointer" }}
            >
              <motion.div
                animate={{ rotateY: flashcardFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", position: "relative" }}
              >
                {/* Front Face */}
                <div style={{
                  backfaceVisibility: "hidden", position: "absolute", inset: 0,
                  background: "#fff", padding: 40, borderRadius: 24,
                  display: "flex", flexDirection: "column", justifyContent: "center",
                  color: "#0f172a", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#8b5cf6", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {`Hint: ${hw.flashcards[currentFlashcardIndex].hint}`}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.5 }}>
                    {hw.flashcards[currentFlashcardIndex].front}
                  </div>
                  <div style={{ marginTop: "auto", fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                    (Click card to flip)
                  </div>
                </div>

                {/* Back Face */}
                <div style={{
                  backfaceVisibility: "hidden", position: "absolute", inset: 0,
                  background: `linear-gradient(135deg, ${color}33, ${color}11)`, border: `1px solid ${color}66`,
                  padding: 40, borderRadius: 24, transform: "rotateY(180deg)",
                  display: "flex", flexDirection: "column", justifyContent: "center",
                  color: "#f8fafc", textAlign: "center", boxShadow: `0 20px 40px ${color}22`
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: color, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Answer
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.5 }}>
                    {hw.flashcards[currentFlashcardIndex].back}
                  </div>
                  <div style={{ marginTop: "auto", fontSize: 12, color: "#071521", fontWeight: 500 }}>
                    (Click to view question)
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {currentFlashcardIndex > 0 && (
              <button
                onClick={() => { setCurrentFlashcardIndex(i => i - 1); setFlashcardFlipped(false); }}
                style={{
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)",
                  color: "#cbd5e1", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                ← Previous
              </button>
            )}
            <div style={{ color: "#64748b", fontSize: 14, fontWeight: 700 }}>
              {currentFlashcardIndex + 1} / {hw.flashcards.length}
            </div>
            {currentFlashcardIndex < hw.flashcards.length - 1 ? (
              <button
                onClick={() => { setCurrentFlashcardIndex(i => i + 1); setFlashcardFlipped(false); }}
                style={{
                  background: color, color: "#0a0f1a", border: "none",
                  padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                Next Card
              </button>
            ) : (
              <button
                onClick={() => setFlashcardGatePassed(true)}
                style={{
                  background: "#34d399", color: "#0a0f1a", border: "none",
                  padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                Proceed to Task
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// HomeworkCard — one card per homework assignment
// ═══════════════════════════════════════════════════════
function HomeworkCard({ task, color, index, onAttempt }) {
  const deadline = formatDeadline(task.deadline);
  const qCount = normaliseQuestions(task.questions).length;

  const now = new Date();
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadlineDate && deadlineDate < now;
  const isTest = task.task_type === "test";

  // Hard-lock: test past due and not submitted
  const isTestLocked = isTest && isOverdue && !task.submitted;
  // Homework past due: allow late submit
  const isHomeworkLate = !isTest && isOverdue && !task.submitted;

  const statusConfig = task.submitted
    ? {
      label: task.submission_status === "late" ? "Submitted Late" : "Submitted",
      color: task.submission_status === "late" ? "#fb923c" : "#34d399",
      bg: task.submission_status === "late" ? "rgba(251,146,60,0.08)" : "rgba(52,211,153,0.08)",
      border: task.submission_status === "late" ? "rgba(251,146,60,0.2)" : "rgba(52,211,153,0.2)",
    }
    : isTestLocked
      ? { label: "🔒 Locked", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" }
      : isHomeworkLate
        ? { label: "⏰ Late", color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" }
        : { label: "Pending", color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: isTestLocked ? "#fff5f5" : "#ffffff",
        border: isTestLocked ? "3px solid #f87171" : "3px solid #071521",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
        boxShadow: isTestLocked ? "4px 4px 0 #fca5a5" : "4px 4px 0 #8bb7d8",
        transition: "all 0.2s",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch", minHeight: 80 }}>
        {/* Color accent */}
        <div style={{
          width: 6,
          background: isTestLocked ? "#f87171" : task.submitted ? "#34d399" : (deadline?.urgent ? "#ef4444" : color),
          flexShrink: 0,
        }} />

        {/* Content */}
        <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 15, fontWeight: 800,
                color: isTestLocked ? "#94a3b8" : "#071521",
                marginBottom: 6, lineHeight: 1.4,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {task.title}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{
                  fontSize: 11, fontWeight: 800,
                  color: "#071521",
                  background: `${color}25`,
                  border: `2px solid ${color}`,
                  borderRadius: 6, padding: "1px 8px",
                  textTransform: "capitalize",
                }}>
                  {task.task_type}
                </span>
                {task.task_type === "speaking" ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6d28d9", background: "#ede9fe", border: "2px solid #a78bfa", borderRadius: 6, padding: "1px 8px" }}>
                    🎤 Audio
                  </span>
                ) : qCount > 0 ? (
                  <span style={{ fontSize: 11, color: "#1C3F57", fontWeight: 700 }}>
                    {qCount} Q{qCount !== 1 ? "s" : ""}
                  </span>
                ) : null}
                {task.teacher_name && (
                  <span style={{ fontSize: 11, color: "#3F6E8F", fontWeight: 700 }}>
                    · {task.teacher_name}
                  </span>
                )}
              </div>
            </div>

            {/* Status badge */}
            <span style={{
              fontSize: 11, fontWeight: 900,
              color: statusConfig.color === "#34d399" ? "#065f46" : statusConfig.color === "#fb923c" ? "#7c2d12" : "#7f1d1d",
              background: statusConfig.bg,
              border: `2px solid ${statusConfig.color}`,
              borderRadius: 99, padding: "3px 12px",
              flexShrink: 0,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {statusConfig.label}
            </span>
          </div>

          {/* Bottom row: deadline + CTA */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            {deadline ? (
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: deadline.urgent ? "#dc2626" : "#3F6E8F",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                🕐 {deadline.label}
              </div>
            ) : <div />}

            {task.submitted ? (
              <div style={{
                background: "#d1fae5", border: "2px solid #34d399",
                borderRadius: 8, padding: "6px 14px",
                fontSize: 12, fontWeight: 800, color: "#065f46",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                ✓ Submitted
              </div>
            ) : isTestLocked ? (
              <div style={{
                background: "#fee2e2", border: "2px solid #f87171",
                borderRadius: 8, padding: "6px 14px",
                fontSize: 12, fontWeight: 800, color: "#991b1b",
              }}>
                🔒 Locked
              </div>
            ) : isHomeworkLate ? (
              <motion.button
                whileHover={{ y: -2, boxShadow: "5px 5px 0 #7c2d12" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onAttempt(task)}
                style={{
                  background: "#fed7aa", color: "#7c2d12",
                  border: "3px solid #c2410c",
                  borderRadius: 8, padding: "8px 18px",
                  fontSize: 12, fontWeight: 900, cursor: "pointer",
                  boxShadow: "3px 3px 0 #c2410c",
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                ⚠️ Submit Late →
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ y: -2, boxShadow: `5px 5px 0 ${color}` }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onAttempt(task)}
                style={{
                  background: color, color: "#071521",
                  border: `3px solid #071521`,
                  borderRadius: 8, padding: "8px 18px",
                  fontSize: 12, fontWeight: 900, cursor: "pointer",
                  boxShadow: "3px 3px 0 #071521",
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.18s",
                }}
              >
                {task.task_type === "test" ? "Start Test →"
                  : task.task_type === "speaking" ? "🎤 Speak →"
                    : "Start Task →"}
              </motion.button>
            )}
          </div>

          {isTestLocked && (
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#991b1b",
              background: "#fee2e2", border: "2px solid #fca5a5",
              borderRadius: 8, padding: "8px 12px", lineHeight: 1.5,
            }}>
              ⛔ This test has passed its deadline. Score recorded as <strong>0 / F</strong>.
            </div>
          )}
          {isHomeworkLate && (
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#92400e",
              background: "#fef3c7", border: "2px solid #fbbf24",
              borderRadius: 8, padding: "8px 12px", lineHeight: 1.5,
            }}>
              ⚠️ Past due — late submissions are accepted but flagged.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// SubjectSection — groups homework by subject
// ═══════════════════════════════════════════════════════
function SubjectSection({ subject, index, onAttempt }) {
  const [open, setOpen] = useState(subject.unsubmitted > 0);

  const PASTEL_BG = ["#d8e8f4", "#f1d8e6", "#fff0b8", "#d1fae5", "#ede9fe", "#fce7f3"];
  const SHADOW_COLORS = ["#8bb7d8", "#d8a0c4", "#f4d98e", "#6ee7b7", "#c4b5fd", "#f9a8d4"];
  const bg = PASTEL_BG[index % PASTEL_BG.length];
  const shadow = SHADOW_COLORS[index % SHADOW_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: open ? bg : "#ffffff",
        border: "4px solid #071521",
        borderRadius: 12, overflow: "hidden", marginBottom: 16,
        boxShadow: `6px 6px 0 ${shadow}`,
        transition: "background 0.2s",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Subject header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 22px", cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 10,
            background: "#ffffff",
            border: "3px solid #071521",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: "2px 2px 0 #071521",
          }}>
            {subject.icon}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#071521", fontFamily: "'Sora', sans-serif" }}>
              {subject.name}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1C3F57", marginTop: 2 }}>
              {subject.tasks} Assignment{subject.tasks !== 1 ? "s" : ""}
              {subject.unsubmitted > 0 && (
                <span style={{ color: "#c2410c", fontWeight: 900 }}> · {subject.unsubmitted} pending</span>
              )}
              {subject.unsubmitted === 0 && subject.tasks > 0 && (
                <span style={{ color: "#15803d", fontWeight: 900 }}> · All done ✓</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {subject.unsubmitted > 0 && (
            <div style={{
              background: "#ef4444", color: "#ffffff",
              fontSize: 11, fontWeight: 900,
              borderRadius: 99, padding: "4px 12px",
              border: "2px solid #071521",
              boxShadow: "2px 2px 0 #071521",
            }}>
              {subject.unsubmitted} due
            </div>
          )}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            style={{ color: "#071521", fontSize: 14 }}
          >▼</motion.span>
        </div>
      </div>

      {/* Homework list */}
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
            <div style={{ borderTop: "3px solid #071521", padding: "16px 18px", background: "#ffffff" }}>
              {(() => {
                const pending = subject.homeworkList.filter(h => !h.submitted);
                const activePending = pending.filter(() => true);
                return activePending.length === 0 ? (
                  <div style={{ color: "#1C3F57", fontSize: 13, fontWeight: 800, padding: "16px 0", textAlign: "center" }}>
                    ✓ All tasks submitted for this subject.
                  </div>
                ) : (
                  <>
                    {activePending.map((task, i) => (
                      <HomeworkCard
                        key={task.id}
                        task={task}
                        color={subject.color}
                        index={i}
                        onAttempt={onAttempt}
                      />
                    ))}
                  </>
                );
              })()}
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
  const [attemptTask, setAttemptTask] = useState(null);

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
        // Group by subject — each homework stays as its OWN card
        const grouped = {};
        for (const hw of (data.homework || [])) {
          const key = (hw.subject || "General").trim();
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

          // Each hw is pushed as its own separate card — NOT merged
          grouped[key].homeworkList.push({
            id: hw._id || hw.id,
            title: hw.title || hw.topic || `${key} Task`,
            subject: key,
            task_type: hw.task_type || "homework",
            deadline: hw.deadline,
            submitted: hw.submitted || false,
            submission_status: hw.submission_status,
            submission_score: hw.submission_score,
            teacher_name: hw.teacher_name,
            grade: hw.grade,
            questions: hw.questions, // may be partial — full fetch on quiz start
          });
        }

        const sorted = Object.values(grouped).map(s => ({
          ...s,
          homeworkList: [
            ...s.homeworkList.filter(h => !h.submitted),
            ...s.homeworkList.filter(h => h.submitted),
          ],
        }));

        setSubjects(sorted);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load homework. Make sure you're enrolled in a class.");
        setLoading(false);
      });
  }, []);

  useEffect(() => { loadHomework(); }, [loadHomework]);

  const handleSubmitted = useCallback((homeworkId) => {
    setSubjects(prev =>
      prev.map(subj => ({
        ...subj,
        unsubmitted: subj.homeworkList.some(h => h.id === homeworkId && !h.submitted)
          ? Math.max(0, subj.unsubmitted - 1)
          : subj.unsubmitted,
        homeworkList: subj.homeworkList.map(h =>
          h.id === homeworkId ? { ...h, submitted: true } : h
        ),
      }))
    );
  }, []);

  const totalPending = subjects.reduce((s, sub) => s + sub.unsubmitted, 0);

  if (loading) return (
    <div style={{ padding: "48px 40px", color: "#64748b", display: "flex", alignItems: "center", gap: 14 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 20, height: 20, border: "2.5px solid #1e293b", borderTopColor: "#60a5fa", borderRadius: "50%" }}
      />
      Loading subjects…
    </div>
  );

  return (
    <>
      <div style={{ padding: "36px 36px 60px", maxWidth: 820, fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&family=Sora:wght@600;700;800;900&display=swap');
          * { box-sizing: border-box; }
        `}</style>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 28 }}
        >
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 24px",
            background: "linear-gradient(135deg, #ffe792, #d8e8f4)",
            border: "4px solid #071521",
            borderRadius: 12,
            boxShadow: "6px 6px 0 #d8a0c4",
            marginBottom: 24,
          }}>
            <div>
              <h1 style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 900, fontSize: 22,
                color: "#071521", margin: "0 0 6px",
              }}>
                📋 Tasks Assigned
              </h1>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1C3F57" }}>
                {totalPending > 0
                  ? <><span style={{ color: "#c2410c", fontWeight: 900 }}>{totalPending} pending</span>{" task"}{totalPending !== 1 ? "s" : ""} to complete</>
                  : <span style={{ color: "#15803d", fontWeight: 900 }}>All caught up ✓</span>
                }
              </div>
            </div>
          </div>
        </motion.div>

        {subjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: "center", padding: "60px 0",
              background: "#ffffff",
              border: "4px dashed #071521",
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#071521", fontFamily: "'Sora', sans-serif" }}>No homework assigned yet.</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8, color: "#3F6E8F" }}>
              Check back after your teacher assigns tasks.
            </div>
          </motion.div>
        ) : (() => {
          const now = new Date();
          // Only show subjects that have at least one non-overdue, non-submitted task
          const activeSubjects = subjects.filter(subject =>
            subject.homeworkList.some(h => {
              if (h.submitted) return false;
              if (!h.deadline) return true;
              const d = new Date(h.deadline);
              return isNaN(d) || d >= now;
            })
          );
          return activeSubjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ color: "#071521", textAlign: "center", padding: "80px 0" }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#34d399" }}>All tasks submitted!</div>
              <div style={{ fontSize: 13, marginTop: 8, color: "#071521" }}>
                Head to <strong style={{ color: "#60a5fa" }}>Tasks Submitted</strong> to view your results.
              </div>
            </motion.div>
          ) : (
            activeSubjects.map((subject, i) => (
              <SubjectSection
                key={subject.id}
                subject={subject}
                index={i}
                onAttempt={setAttemptTask}
              />
            ))
          );
        })()}
      </div>

      {/* Full-screen Task overlay — routes by type */}
      <AnimatePresence>
        {attemptTask && attemptTask.task_type === "speaking" ? (
          <SpeakingTask
            key={attemptTask.id}
            task={attemptTask}
            color={getMeta(attemptTask.subject).color}
            onClose={() => setAttemptTask(null)}
            onSubmitted={handleSubmitted}
          />
        ) : attemptTask ? (
          <QuizStepper
            key={attemptTask.id}
            task={attemptTask}
            color={getMeta(attemptTask.subject).color}
            onClose={() => setAttemptTask(null)}
            onSubmitted={handleSubmitted}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}