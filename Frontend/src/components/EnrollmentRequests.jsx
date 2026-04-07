import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";
const POLL_INTERVAL = 10000; // 10 seconds

const getToken = () => localStorage.getItem("access_token");
const getRole = () => localStorage.getItem("role");

const EnrollmentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const pollRef = useRef(null);

  // ── Fetch (silent=true for polling so it doesn't flash loading state) ──
  const fetchRequests = async (silent = false) => {
    // Only fetch if user is a teacher
    if (getRole() !== "teacher") {
      setRequests([]);
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/teacher/enrollment-requests`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setRequests(res.data.requests || []);
      setError("");
    } catch (err) {
      // Silently ignore 403 — means token belongs to a non-teacher
      if (err.response?.status === 403 || err.response?.status === 401) {
        setRequests([]);
        setError("");
      } else {
        setError(err.response?.data?.detail || "Failed to load requests");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Initial fetch + auto-polling ──
  useEffect(() => {
    fetchRequests();

    pollRef.current = setInterval(() => {
      fetchRequests(true); // silent poll
    }, POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, []);

  // ── Auto-clear success message after 4s ──
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // ── Actions ──
  const handleAccept = async (requestId, subject) => {
    setActionLoading((p) => ({ ...p, [requestId]: "accepting" }));
    setSuccessMsg("");
    try {
      const res = await axios.post(
        `${API_BASE}/teacher/enrollment-requests/${requestId}/accept`,
        { subject },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setSuccessMsg(res.data.message);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to accept");
    } finally {
      setActionLoading((p) => ({ ...p, [requestId]: false }));
    }
  };

  const handleReject = async (requestId) => {
    setActionLoading((p) => ({ ...p, [requestId]: "rejecting" }));
    setSuccessMsg("");
    try {
      const res = await axios.post(
        `${API_BASE}/teacher/enrollment-requests/${requestId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setSuccessMsg(res.data.message);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reject");
    } finally {
      setActionLoading((p) => ({ ...p, [requestId]: false }));
    }
  };

  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Don't render at all for non-teachers
  if (getRole() !== "teacher") return null;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-10 px-4">
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-mentorship-purple/20 animate-pulse" />
            <div className="h-5 w-44 rounded-md bg-white/10 animate-pulse" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-white/[0.03] mb-3 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-10 px-4">
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-mentorship-purple/15 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-mentorship-purple text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                group_add
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Enrollment Requests
              </h2>
              {requests.length > 0 && (
                <p className="text-xs text-mentorship-purple font-medium mt-0.5">
                  {requests.length} pending
                </p>
              )}
            </div>
          </div>

          {/* Live dot indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              Live
            </span>
          </div>
        </div>

        {/* ── Toasts ── */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ── */}
        {requests.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-3">
              how_to_reg
            </span>
            <p className="text-slate-400 text-sm font-medium">No pending requests</p>
            <p className="text-slate-600 text-xs mt-1">
              New student requests will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {requests.map((req, idx) => {
                const isAccepting = actionLoading[req.id] === "accepting";
                const isRejecting = actionLoading[req.id] === "rejecting";
                const busy = isAccepting || isRejecting;

                return (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4"
                  >
                    {/* ── Top row: Avatar + Name + Time ── */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-scholar-blue/40 to-mentorship-purple/30 flex items-center justify-center shrink-0 ring-2 ring-white/[0.06]">
                        <span className="text-sm font-bold text-white">
                          {req.student_name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>

                      {/* Name & email */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-white leading-tight truncate">
                          {req.student_name || "Unknown Student"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {req.student_email}
                        </p>
                      </div>

                      {/* Time badge */}
                      <span className="text-[11px] text-slate-500 font-medium shrink-0 bg-white/[0.03] px-2 py-1 rounded-md">
                        {timeAgo(req.requested_at)}
                      </span>
                    </div>

                    {/* ── Tags row ── */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3 ml-[52px]">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/70 text-[11px] font-medium text-slate-300">
                        <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>apartment</span>
                        {req.school}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-mentorship-purple/10 text-[11px] font-medium text-mentorship-purple">
                        <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>class</span>
                        Grade {req.grade}
                      </span>
                    </div>

                    {/* ── Actions row ── */}
                    <div className="flex items-center gap-2 ml-[52px]">
                      {/* Accept buttons — one per subject */}
                      {req.my_subjects?.map((subj) => (
                        <button
                          key={subj}
                          onClick={() => handleAccept(req.id, subj)}
                          disabled={busy}
                          className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                            ${busy
                              ? "opacity-40 cursor-not-allowed bg-slate-800 text-slate-500"
                              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/15 hover:border-emerald-500/30 active:scale-95"
                            }
                          `}
                        >
                          {isAccepting ? (
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>check</span>
                          )}
                          Accept · {subj}
                        </button>
                      ))}

                      {/* Reject */}
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={busy}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                          ${busy
                            ? "opacity-40 cursor-not-allowed bg-slate-800 text-slate-500"
                            : "bg-white/[0.03] text-slate-500 hover:bg-red-500/10 hover:text-red-400 border border-white/[0.05] hover:border-red-500/20 active:scale-95"
                          }
                        `}
                      >
                        {isRejecting ? (
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>close</span>
                        )}
                        Decline
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollmentRequests;
