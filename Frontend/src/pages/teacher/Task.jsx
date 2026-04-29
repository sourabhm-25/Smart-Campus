import React, { useState, useEffect } from "react";
import axios from "axios";
import Lottie from "lottie-react";
import bookLoader from "../../assets/Book_Loader.json";

/* ─── inline styles (no Tailwind dependency for custom tokens) ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@400;500&display=swap');

  .task-root {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f5f0ff 100%);
    font-family: 'DM Sans', sans-serif;
    padding: 48px 16px 80px;
  }

  .task-container { max-width: 860px; margin: 0 auto; }

  /* ── header ── */
  .task-header { text-align: center; margin-bottom: 40px; }
  .task-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; font-size: 12px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 6px 14px; border-radius: 100px; margin-bottom: 16px;
  }
  .task-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(2rem, 5vw, 2.75rem);
    font-weight: 800; color: #0f0f1a;
    letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 10px;
  }
  .task-subtitle { color: #64748b; font-size: 15px; }

  /* ── card ── */
  .card {
    background: #ffffff;
    border: 1px solid rgba(99,102,241,0.1);
    border-radius: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(99,102,241,0.06);
    padding: 32px;
    margin-bottom: 20px;
    animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }
  .card.delay-1 { animation-delay: 0.05s; }
  .card.delay-2 { animation-delay: 0.10s; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .card-section-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: #94a3b8; margin-bottom: 20px;
  }

  /* ── form controls ── */
  .field-label {
    display: block; font-size: 13px; font-weight: 600;
    color: #374151; margin-bottom: 6px;
  }
  .field-input, .field-select {
    width: 100%; padding: 12px 14px;
    border: 1.5px solid #e5e7eb; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: #111827;
    background: #fafafa;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    outline: none; box-sizing: border-box;
  }
  .field-input:focus, .field-select:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    background: #fff;
  }
  .field-select { cursor: pointer; }

  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .row-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }
  @media (max-width: 640px) {
    .row-2, .row-3, .row-4 { grid-template-columns: 1fr; }
  }

  /* ── defaults pill strip ── */
  .defaults-bar {
    background: linear-gradient(135deg, #eef2ff, #f5f3ff);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 12px; padding: 14px 18px;
    display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
  }
  .defaults-label { font-size: 12px; font-weight: 700; color: #6366f1; margin-right: 4px; }
  .pill {
    font-size: 12px; font-weight: 600; padding: 4px 12px;
    border-radius: 100px; letter-spacing: 0.02em;
  }
  .pill-blue   { background:#dbeafe; color:#1d4ed8; }
  .pill-orange { background:#ffedd5; color:#c2410c; }
  .pill-teal   { background:#ccfbf1; color:#0f766e; }
  .pill-purple { background:#ede9fe; color:#7c3aed; }

  /* ── custom section ── */
  .custom-toggle {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 13px 16px; background: #f8fafc;
    border: 1.5px solid #e5e7eb; border-radius: 12px;
    font-size: 13px; font-weight: 600; color: #475569; cursor: pointer;
    transition: background 0.15s, border-color 0.15s; text-align: left;
  }
  .custom-toggle:hover { background:#f1f5ff; border-color: #c7d2fe; }
  .custom-toggle.open  { border-color:#6366f1; background:#f5f3ff; color:#6366f1; border-radius: 12px 12px 0 0; }
  .custom-body {
    background: #fafafa; border: 1.5px solid #e5e7eb;
    border-top: none; border-radius: 0 0 12px 12px;
    padding: 20px; animation: fadeUp 0.25s ease both;
  }

  /* ── generate button ── */
  .btn-generate {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 32px; border-radius: 12px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700; letter-spacing: 0.02em;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; border: none; cursor: pointer;
    box-shadow: 0 4px 20px rgba(99,102,241,0.35);
    transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s, opacity 0.2s;
  }
  .btn-generate:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.45); }
  .btn-generate:active:not(:disabled) { transform: translateY(0); }
  .btn-generate:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── loader ── */
  .loader-wrap { display: flex; flex-direction: column; align-items: center; padding: 24px 0 16px; gap: 14px; }
  .loader-text-wrap {
    height: 26px; display: flex; justify-content: center; align-items: center; overflow: hidden;
  }
  .loader-text { 
    font-size: 15px; 
    color: #475569; 
    font-weight: 600; 
    letter-spacing: 0.02em;
    animation: elegantSlideFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .loader-text-accent {
    background: linear-gradient(135deg, #6366f1, #d946ef);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-right: 6px;
    background-size: 200% 200%;
    animation: gradientShift 2.5s ease infinite;
  }
  @keyframes elegantSlideFade {
    0% { opacity: 0; transform: translateY(12px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* ── error banner ── */
  .error-banner {
    background: #fef2f2; border-left: 4px solid #ef4444;
    border-radius: 8px; padding: 14px 18px; font-size: 14px; color: #b91c1c; font-weight: 500;
  }

  /* ── questions section ── */
  .section-heading {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: clamp(1.3rem, 3vw, 1.6rem); font-weight: 800;
    color: #0f0f1a; letter-spacing: -0.02em; margin-bottom: 20px;
  }

  .q-card {
    border-radius: 14px; padding: 20px 22px; margin-bottom: 12px;
    border-left: 4px solid transparent;
  }
  .q-card.blue   { background:#eff6ff; border-color:#3b82f6; }
  .q-card.orange { background:#fff7ed; border-color:#f97316; }
  .q-card.teal   { background:#f0fdfa; border-color:#14b8a6; }
  .q-card.purple { background:#faf5ff; border-color:#a855f7; }

  .q-question { font-weight: 600; color: #1e293b; font-size: 14px; margin-bottom: 10px; line-height: 1.55; }
  .q-options   { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .q-option    { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:13px; color:#374151; }
  .q-answer    { font-size: 13px; color: #475569; font-weight: 600; }
  .q-answer span { color: #059669; }

  /* ── assign panel ── */
  .assign-panel {
    background: linear-gradient(135deg, #0f0f1a 0%, #1e1b4b 100%);
    border-radius: 20px; padding: 36px 32px;
    box-shadow: 0 20px 60px rgba(99,102,241,0.25);
    animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s both;
  }
  .assign-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 22px; font-weight: 800; color: #fff;
    margin-bottom: 6px; letter-spacing: -0.02em;
  }
  .assign-sub { color: #94a3b8; font-size: 14px; margin-bottom: 28px; }

  .assign-target {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;
  }
  .assign-target-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .assign-target-label { font-size: 11px; font-weight: 700; color: #6366f1; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 2px; }
  .assign-target-value { font-size: 15px; font-weight: 600; color: #fff; }
  .assign-target-no-class { font-size: 13px; color: #f87171; font-style: italic; }

  .assign-row { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: flex-end; }
  @media (max-width: 540px) { .assign-row { grid-template-columns: 1fr; } }

  .field-label-dark { display: block; font-size: 13px; font-weight: 600; color: #94a3b8; margin-bottom: 6px; }
  .field-input-dark {
    width: 100%; padding: 12px 14px;
    border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: #fff;
    background: rgba(255,255,255,0.07);
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none; box-sizing: border-box;
    color-scheme: dark;
  }
  .field-input-dark:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
  }

  .btn-send {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 28px; border-radius: 12px; white-space: nowrap;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; border: none; cursor: pointer;
    box-shadow: 0 4px 20px rgba(99,102,241,0.4);
    transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s, opacity 0.2s;
  }
  .btn-send:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.55); }
  .btn-send:active:not(:disabled) { transform: translateY(0); }
  .btn-send:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-send.success { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 20px rgba(16,185,129,0.4); }

  .save-result {
    margin-top: 16px; padding: 14px 18px; border-radius: 10px;
    font-size: 14px; font-weight: 500; text-align: center;
  }
  .save-result.ok  { background: rgba(16,185,129,0.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.25); }
  .save-result.err { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.25); }

  /* ── q-type header card ── */
  .q-type-card { border-radius: 16px; padding: 24px; margin-bottom: 16px; }
  .q-type-card.blue   { background: #eff6ff; }
  .q-type-card.orange { background: #fff7ed; }
  .q-type-card.teal   { background: #f0fdfa; }
  .q-type-card.purple { background: #faf5ff; }
  .q-type-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:16px; font-weight:800; margin-bottom:14px; }
  .q-type-title.blue   { color:#1d4ed8; }
  .q-type-title.orange { color:#c2410c; }
  .q-type-title.teal   { color:#0f766e; }
  .q-type-title.purple { color:#7c3aed; }

  @media (max-width: 640px) {
    .q-options { grid-template-columns: 1fr; }
    .assign-panel { padding: 24px 18px; }
    .card { padding: 22px 18px; }
  }
`;

export default function Task() {
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState("");
  const [taskType, setTaskType] = useState("homework");
  const [testTime, setTestTime] = useState(30);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // ── Speaking-specific state ──
  const [speakingPassage, setSpeakingPassage] = useState("");
  const [speakingSaved, setSpeakingSaved] = useState(false);
  const [speakingSaving, setSpeakingSaving] = useState(false);
  const [speakingError, setSpeakingError] = useState(null);
  const isSpeaking = taskType === "speaking" && subject.toLowerCase() === "english";

  const loadingMessages = [
    "Collecting textbook knowledge...",
    "Processing context via RAG...",
    "Analyzing grade-level complexity...",
    "Drafting curriculum-aligned questions...",
    "Refining multiple choice options...",
    "Finalizing assessment structure..."
  ];

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 4500); 
    } else {
      setLoadingMsgIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedClass, setSelectedClass] = useState(null); // full class object
  const [deadline, setDeadline] = useState("");

  const [defaults, setDefaults] = useState(null);
  const [customShortAnswer, setCustomShortAnswer] = useState("");
  const [customMcq, setCustomMcq] = useState("");
  const [customFillInBlanks, setCustomFillInBlanks] = useState("");
  const [customTrueFalse, setCustomTrueFalse] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  // Reset speaking form when type changes away from speaking
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingPassage("");
      setSpeakingSaved(false);
      setSpeakingError(null);
    }
  }, [isSpeaking]);

  const grades = ["1","2","3","4","5","6","7","8","9","10"];
  const subjects = ["Mathematics","Science","English","History","Geography"];

  // Fetch teacher classes once
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const res = await axios.get("http://127.0.0.1:8000/teacher/my-classes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const classes = res.data.classes || [];
        setTeacherClasses(classes);
        // Auto-set grade to the teacher's first class grade (normalized)
        if (classes.length > 0) {
          const firstGrade = String(classes[0].grade).replace(/(st|nd|rd|th)$/i, "").trim();
          setGrade(firstGrade);
        }
      } catch (err) {
        console.error("Failed to fetch teacher classes:", err);
      }
    };
    fetchClasses();
  }, []);

  // Normalize grade string: strip ordinal suffixes "5th" → "5", "3rd" → "3"
  const normalizeGrade = (g) => String(g).replace(/(st|nd|rd|th)$/i, "").trim();

  // Auto-select class whenever grade or teacherClasses changes
  useEffect(() => {
    if (!teacherClasses.length) return;
    const match = teacherClasses.find(
      (cls) => normalizeGrade(cls.grade) === normalizeGrade(grade)
    );
    if (match) {
      setSelectedClassId(match.id);
      setSelectedClass(match);
      // Auto-set subject to the teacher's first subject for this class
      if (match.my_subjects?.length > 0) {
        setSubject(match.my_subjects[0]);
      }
    } else {
      setSelectedClassId("");
      setSelectedClass(null);
    }
  }, [grade, teacherClasses]);

  // Fetch defaults when grade changes
  useEffect(() => {
    if (!grade) return;
    const fetchDefaults = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/question-defaults/${grade}`);
        setDefaults(res.data.defaults);
      } catch {
        setDefaults(null);
      }
    };
    fetchDefaults();
  }, [grade]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!grade || !subject || !topic.trim()) return;
    setLoading(true);
    setError(null);
    setQuestions(null);
    setSaveResult(null);

    try {
      const body = { topic: topic.trim(), grade, subject, task_type: taskType };
      if (taskType === "test") body.time_limit = parseInt(testTime);
      if (customShortAnswer !== "")     body.custom_short_answer      = parseInt(customShortAnswer);
      if (customMcq !== "")            body.custom_mcq               = parseInt(customMcq);
      if (customFillInBlanks !== "")   body.custom_fill_in_the_blanks = parseInt(customFillInBlanks);
      if (customTrueFalse !== "" && customTrueFalse !== "0") body.custom_true_false = parseInt(customTrueFalse);

      const res = await axios.post("http://127.0.0.1:8000/generate-task", body);
      if (res.data.retrieval_info?.chunks) {
        console.log("📄 Pinecone Chunks:", res.data.retrieval_info.chunks);
      }
      setQuestions(res.data.questions_json);
    } catch (err) {
      console.error(err);
      setError("Failed to generate questions. Please check your server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignHomework = async () => {
    if (!questions) return;
    if (!selectedClassId) {
      setSaveResult({ success: false, message: "No class found for Grade " + grade + ". Please ensure this grade exists in your classes." });
      return;
    }
    if (!deadline) {
      setSaveResult({ success: false, message: "Please set a deadline before sending." });
      return;
    }
    setSaving(true);
    setSaveResult(null);
    try {
      const token = localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        class_id: selectedClassId,
        subject,
        title: topic.trim(),
        description: `Task generated for ${topic}`,
        questions,
        deadline: deadline + "T23:59:00",
        task_type: taskType,
      };
      if (taskType === "test") {
        payload.time_limit = parseInt(testTime);
      }
      const res = await axios.post("http://127.0.0.1:8000/teacher/assign-homework", payload, { headers });
      setSaveResult({ success: true, message: res.data.message });
    } catch (err) {
      console.error(err);
      setSaveResult({ success: false, message: err.response?.data?.detail || "Failed to assign homework." });
    } finally {
      setSaving(false);
    }
  };

  // ── Speaking homework assign handler ──
  const handleAssignSpeaking = async () => {
    if (!speakingPassage.trim()) {
      setSpeakingError("Please write the speaking prompt/passage.");
      return;
    }
    if (!selectedClassId) {
      setSpeakingError("No class found for Grade " + grade + ". Please ensure this grade exists.");
      return;
    }
    if (!deadline) {
      setSpeakingError("Please set a deadline.");
      return;
    }
    setSpeakingSaving(true);
    setSpeakingError(null);
    setSpeakingSaved(false);
    try {
      const token = localStorage.getItem("access_token");
      const deadlineUnix = new Date(deadline + "T23:59:00").getTime() / 1000;
      const formData = new FormData();
      formData.append("class_id", selectedClassId);
      formData.append("subject", subject);
      formData.append("topic", topic.trim() || "Speaking Task");
      formData.append("grade", grade);
      formData.append("passage", speakingPassage.trim());
      formData.append("deadline_unix", deadlineUnix.toString());

      const res = await fetch("http://127.0.0.1:8000/speaking/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to assign speaking homework.");
      setSpeakingSaved(true);
    } catch (err) {
      setSpeakingError(err.message);
    } finally {
      setSpeakingSaving(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="task-root">
        <div className="task-container">

          {/* ── Header ── */}
          <div className="task-header">
            <div className="task-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Task Generator
            </div>
            <h1 className="task-title">Create &amp; Assign Tasks</h1>
            <p className="task-subtitle">Generate curriculum-aligned questions and send them directly to your class</p>
          </div>

          {/* ── Form Card ── */}
          <div className="card">
            <p className="card-section-title">📝 Task Configuration</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Topic */}
              <div>
                <label className="field-label" htmlFor="topic-input">Topic</label>
                <input
                  id="topic-input"
                  type="text"
                  className="field-input"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Water Cycle, Fractions, Cube Roots…"
                  required
                />
              </div>

              {/* Grade + Subject + Task Type */}
              <div className={taskType === "test" ? "row-4" : "row-3"}>
                <div>
                  <label className="field-label" htmlFor="grade-select">Grade</label>
                  <select
                    id="grade-select"
                    className="field-select"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    required
                  >
                    {/* Only show grades the teacher actually has classes for */}
                    {teacherClasses.length === 0 && (
                      <option value="">Loading classes…</option>
                    )}
                    {teacherClasses.map((cls) => {
                      const norm = String(cls.grade).replace(/(st|nd|rd|th)$/i, "").trim();
                      return <option key={cls.id} value={norm}>Grade {norm} — {cls.school}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="subject-select">Subject</label>
                  <select
                    id="subject-select"
                    className="field-select"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  >
                    {/* Show subjects this teacher teaches for the selected grade */}
                    {(selectedClass?.my_subjects?.length > 0
                      ? selectedClass.my_subjects
                      : subjects
                    ).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="tasktype-select">Task Type</label>
                  <select
                    id="tasktype-select"
                    className="field-select"
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    required
                  >
                    <option value="homework">Homework</option>
                    <option value="test">Test</option>
                    {subject.toLowerCase() === "english" && (
                      <option value="speaking">🎤 Speaking Task</option>
                    )}
                  </select>
                </div>
                {taskType === "test" && (
                  <div>
                    <label className="field-label" htmlFor="time-input">Time Limit (mins)</label>
                    <input
                      id="time-input"
                      type="number"
                      min="1"
                      className="field-input"
                      value={testTime}
                      onChange={(e) => setTestTime(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Defaults bar */}
              {defaults && (
                <div className="defaults-bar">
                  <span className="defaults-label">Grade {grade} defaults →</span>
                  <span className="pill pill-blue">Short Answer: {defaults.short_answer}</span>
                  <span className="pill pill-orange">MCQ: {defaults.mcq}</span>
                  <span className="pill pill-teal">Fill-in-Blank: {defaults.fill_in_the_blanks}</span>
                  {defaults.true_false > 0 && (
                    <span className="pill pill-purple">True/False: {defaults.true_false}</span>
                  )}
                </div>
              )}

              {/* Custom counts accordion */}
              <div>
                <button
                  type="button"
                  className={`custom-toggle${showCustom ? " open" : ""}`}
                  onClick={() => setShowCustom((v) => !v)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
                    </svg>
                    Customize Question Counts <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
                  </span>
                  <span style={{ fontSize: 11 }}>{showCustom ? "▲" : "▼"}</span>
                </button>
                {showCustom && (
                  <div className="custom-body">
                    <div className="row-2" style={{ gap: 14 }}>
                      {[
                        { label: "Short Answer", val: customShortAnswer, set: setCustomShortAnswer, max: 10 },
                        { label: "MCQ",           val: customMcq,         set: setCustomMcq,         max: 20 },
                        { label: "Fill-in-Blank", val: customFillInBlanks,set: setCustomFillInBlanks, max: 10 },
                        { label: "True / False",  val: customTrueFalse,  set: setCustomTrueFalse,   max: 10, placeholder: "0 (excluded by default)" },
                      ].map(({ label, val, set, max, placeholder }) => (
                        <div key={label}>
                          <label className="field-label" style={{ fontSize: 12 }}>{label}</label>
                          <input
                            type="number" min="0" max={max}
                            className="field-input" style={{ fontSize: 13, padding: "10px 12px" }}
                            value={val} onChange={(e) => set(e.target.value)}
                            placeholder={placeholder || "Leave blank for default"}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit — hidden for speaking type (uses its own flow) */}
              {!isSpeaking && (
              <div style={{ paddingTop: 4 }}>
                <button type="submit" className="btn-generate" disabled={loading}>
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 01-9 9"/>
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      Generate Questions
                    </>
                  )}
                </button>
              </div>
              )}
            </form>

            {/* Loader */}
            {loading && (
              <div className="loader-wrap">
                <div style={{ width: 160 }}><Lottie animationData={bookLoader} loop /></div>
                <div className="loader-text-wrap">
                  <p key={loadingMsgIdx} className="loader-text">
                    <span className="loader-text-accent">✧</span> 
                    {loadingMessages[loadingMsgIdx]}
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && <div className="error-banner" style={{ marginTop: 20 }}>{error}</div>}
          </div>

          {/* ── Speaking Homework Builder ── */}
          {isSpeaking && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card delay-1">
                <p className="card-section-title">🎤 Speaking Task Configuration</p>
                <div style={{ marginBottom: 16 }}>
                  <label className="field-label" htmlFor="speaking-passage">
                    Speaking Prompt / Passage
                    <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
                      This is what the student will be asked to speak about
                    </span>
                  </label>
                  <textarea
                    id="speaking-passage"
                    rows={5}
                    className="field-input"
                    style={{ resize: "vertical", lineHeight: 1.65 }}
                    value={speakingPassage}
                    onChange={e => { setSpeakingPassage(e.target.value); setSpeakingSaved(false); }}
                    placeholder="e.g. Tell me about India in 3-4 lines.&#10;or: Describe your favourite season and why you like it."
                  />
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                    {speakingPassage.length} characters · Students will see this prompt and record their voice.
                  </div>
                </div>

                {/* Example prompts */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Example Prompts</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      "Tell me about India in 3-4 lines.",
                      "Describe your favourite season.",
                      "Talk about your family.",
                      "What is your favourite subject and why?",
                      "Describe a festival you celebrate.",
                    ].map(ex => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => { setSpeakingPassage(ex); setSpeakingSaved(false); }}
                        style={{
                          fontSize: 12, fontWeight: 500,
                          padding: "5px 12px", borderRadius: 100,
                          background: speakingPassage === ex ? "#6366f1" : "#eef2ff",
                          color: speakingPassage === ex ? "#fff" : "#4f46e5",
                          border: "1.5px solid #c7d2fe",
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview card */}
              {speakingPassage.trim() && (
                <div style={{
                  background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
                  border: "1.5px solid #86efac",
                  borderRadius: 16, padding: "20px 24px",
                }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 10, letterSpacing: "0.07em", textTransform: "uppercase" }}>Preview — What Students Will See</div>
                  <div style={{ fontSize: 14, color: "#166534", lineHeight: 1.7, fontStyle: "italic" }}>🎤 "{speakingPassage}"</div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "#4ade80" }}>Students will tap Record, speak for up to 3 minutes, then submit. Gemini AI scores pronunciation, fluency, grammar, confidence, and content.</div>
                </div>
              )}

              {/* Assign panel */}
              <div className="assign-panel">
                <p className="assign-title">Send Speaking Task to Students</p>
                <p className="assign-sub">Set a deadline and send this speaking task to your class.</p>

                <div className="assign-target">
                  <div className="assign-target-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  </div>
                  <div>
                    <p className="assign-target-label">Speaking Task for</p>
                    {selectedClass ? (
                      <p className="assign-target-value">
                        {selectedClass.school} — Grade {selectedClass.grade}
                        <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.6 }}>
                          {selectedClass.student_count} student{selectedClass.student_count !== 1 ? "s" : ""}
                        </span>
                      </p>
                    ) : (
                      <p className="assign-target-no-class">No class found for Grade {grade}</p>
                    )}
                  </div>
                </div>

                <div className="assign-row">
                  <div>
                    <label className="field-label-dark" htmlFor="speaking-deadline">Deadline Date</label>
                    <input
                      id="speaking-deadline"
                      type="date"
                      className="field-input-dark"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleAssignSpeaking}
                    disabled={speakingSaving || speakingSaved || !speakingPassage.trim()}
                    className={`btn-send${speakingSaved ? " success" : ""}`}
                  >
                    {speakingSaving ? (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 01-9 9"/></svg> Sending…</>
                    ) : speakingSaved ? (
                      <><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> Sent!</>
                    ) : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> Send Speaking Task</>
                    )}
                  </button>
                </div>

                {speakingError && (
                  <div className="save-result err" style={{ marginTop: 14 }}>{speakingError}</div>
                )}
                {speakingSaved && (
                  <div className="save-result ok" style={{ marginTop: 14 }}>
                    ✓ Speaking homework assigned to {selectedClass?.student_count || 0} students successfully!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Questions ── */}
          {questions && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 className="section-heading">Generated Questions</h2>

              {/* Short Answer */}
              {questions.short_answer?.length > 0 && (
                <div className="q-type-card blue">
                  <p className="q-type-title blue">Short Answer</p>
                  {questions.short_answer.map((q, i) => (
                    <div key={i} className="q-card blue">
                      <p className="q-question">{i + 1}. {q.question}</p>
                      <p className="q-answer">Answer: <span>{q.answer}</span></p>
                    </div>
                  ))}
                </div>
              )}

              {/* MCQ */}
              {questions.mcq?.length > 0 && (
                <div className="q-type-card orange">
                  <p className="q-type-title orange">Multiple Choice</p>
                  {questions.mcq.map((q, i) => (
                    <div key={i} className="q-card orange">
                      <p className="q-question">{i + 1}. {q.question}</p>
                      <div className="q-options">
                        {Object.entries(q.options).map(([k, v]) => (
                          <div key={k} className="q-option">{k}: {v}</div>
                        ))}
                      </div>
                      <p className="q-answer">Answer: <span>{q.answer}</span></p>
                    </div>
                  ))}
                </div>
              )}

              {/* Fill in the Blanks */}
              {questions.fill_in_the_blanks?.length > 0 && (
                <div className="q-type-card teal">
                  <p className="q-type-title teal">Fill in the Blanks</p>
                  {questions.fill_in_the_blanks.map((q, i) => (
                    <div key={i} className="q-card teal">
                      <p className="q-question">{i + 1}. {q.question}</p>
                      <p className="q-answer">Answer: <span>{q.answer}</span></p>
                    </div>
                  ))}
                </div>
              )}

              {/* True/False */}
              {questions.true_false?.length > 0 && (
                <div className="q-type-card purple">
                  <p className="q-type-title purple">True / False</p>
                  {questions.true_false.map((q, i) => (
                    <div key={i} className="q-card purple">
                      <p className="q-question">{i + 1}. {q.question}</p>
                      <p className="q-answer">Answer: <span>{q.answer}</span></p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Assign Panel ── */}
              <div className="assign-panel">
                <p className="assign-title">Send to Students</p>
                <p className="assign-sub">Review the questions above, then set a deadline to send this {taskType} to your class.</p>

                {/* Read-only class display */}
                <div className="assign-target">
                  <div className="assign-target-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <p className="assign-target-label">Sending to</p>
                    {selectedClass ? (
                      <p className="assign-target-value">
                        {selectedClass.school} — Grade {selectedClass.grade}
                        <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.6 }}>
                          {selectedClass.student_count} student{selectedClass.student_count !== 1 ? "s" : ""}
                        </span>
                      </p>
                    ) : (
                      <p className="assign-target-no-class">
                        No class found for Grade {grade} — please check your class assignments
                      </p>
                    )}
                  </div>
                </div>

                {/* Deadline + Send */}
                <div className="assign-row">
                  <div>
                    <label className="field-label-dark" htmlFor="deadline-input">Deadline Date</label>
                    <input
                      id="deadline-input"
                      type="date"
                      className="field-input-dark"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleAssignHomework}
                    disabled={saving || saveResult?.success}
                    className={`btn-send${saveResult?.success ? " success" : ""}`}
                  >
                    {saving ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 01-9 9"/>
                        </svg>
                        Sending…
                      </>
                    ) : saveResult?.success ? (
                      <>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        Sent!
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        Send to Students
                      </>
                    )}
                  </button>
                </div>

                {saveResult && (
                  <div className={`save-result ${saveResult.success ? "ok" : "err"}`}>
                    {saveResult.message}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
