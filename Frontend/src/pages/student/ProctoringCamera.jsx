/**
 * ProctoringCamera.jsx — Dual-layer AI Proctoring
 * ─────────────────────────────────────────────────
 *
 * Layer 1 · Browser  (TF.js)  — face presence & count      every 3 s
 * Layer 2 · Backend  (YOLOv8s) — phone & multi-person       every 1.5 s
 *
 * Gaze Detection Fix
 *   • Requires 4 CONSECUTIVE "looking away" detections before adding risk.
 *     A single frame where the nose ratio is off will NOT trigger anything.
 *   • Wider threshold: ratio must be > 5.5 or < 0.18 (was 4 / 0.25).
 *   • Ratio is computed on the RAW (un-mirrored) video keypoints, which is
 *     correct — CSS scaleX(-1) only affects the display, not the data.
 *
 * Risk Score Engine
 *   • Decays by ×0.90 per face-check cycle (every 3 s) → clears naturally.
 *   • Violation is only triggered at 70 + (then reset to 35 to avoid spam).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';

// ── Config ─────────────────────────────────────────────────────────────────
const BACKEND_URL      = "http://localhost:8000";
const YOLO_INTERVAL_MS = 1500;
const FACE_INTERVAL_MS = 3000;

const RISK_DECAY       = 0.90;   // per face-check cycle

// Risk weights
const W_PHONE          = 45;
const W_MULTI_YOLO     = 30;
const W_NO_FACE        = 18;
const W_MULTI_FACE     = 25;
const W_GAZE           = 12;     // per cycle; needs 4 consecutive → 48 pts

// Thresholds
const GAZE_RATIO_HI    = 5.5;    // nose:leftEye / nose:rightEye > this = turned
const GAZE_RATIO_LO    = 0.18;   // below this = turned other way
const GAZE_CONSEC_REQ  = 4;      // consecutive "away" detections before flagging
const RISK_WARN        = 40;
const RISK_TRIGGER     = 70;

export default function ProctoringCamera({ onViolation, onReady, onRiskUpdate }) {
  const videoRef         = useRef(null);
  const loopActive       = useRef(true);
  const yoloTimerRef     = useRef(null);
  const onViolationRef   = useRef(onViolation);
  const onRiskRef        = useRef(onRiskUpdate);
  const riskScore        = useRef(0);
  const lastCheckTime    = useRef(Date.now());
  const gazeAwayStreak   = useRef(0);   // consecutive gaze-away detections

  const [statusFace,  setStatusFace]  = useState("Initializing…");
  const [statusYolo,  setStatusYolo]  = useState("⏳ Loading YOLOv8s…");
  const [riskLevel,   setRiskLevel]   = useState("normal");
  const [phoneFlash,  setPhoneFlash]  = useState(false);

  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
  useEffect(() => { onRiskRef.current      = onRiskUpdate; }, [onRiskUpdate]);

  // ── Risk helper ────────────────────────────────────────────────────────
  const addRisk = useCallback((pts, msg) => {
    riskScore.current = Math.min(100, riskScore.current + pts);
    const score = riskScore.current;
    const level = score >= RISK_TRIGGER ? "alert"
                : score >= RISK_WARN    ? "warning"
                :                         "normal";
    setRiskLevel(level);
    onRiskRef.current?.(score, level);

    if (score >= RISK_TRIGGER) {
      onViolationRef.current?.(msg);
      riskScore.current = 35;           // partial reset — avoid spam
    }
  }, []);

  // ── Layer 2: YOLO frame sender ─────────────────────────────────────────
  const sendFrameToYolo = useCallback(async () => {
    if (!videoRef.current || !loopActive.current) return;
    const vid = videoRef.current;
    if (!vid.videoWidth || !vid.videoHeight) return;

    // Resize to 640×480 max — keeps payload small, YOLO still works well
    const W = Math.min(vid.videoWidth,  640);
    const H = Math.min(vid.videoHeight, 480);
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    canvas.getContext("2d").drawImage(vid, 0, 0, W, H);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const fd = new FormData();
      fd.append("frame", blob, "frame.jpg");

      try {
        const res = await fetch(`${BACKEND_URL}/detect-cheating`, {
          method: "POST", body: fd,
          signal: AbortSignal.timeout(5000),   // 5 s hard timeout
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => res.status);
          setStatusYolo(`Backend error ${res.status}`);
          console.error("[YOLO] HTTP error:", txt);
          return;
        }

        const data = await res.json();

        // Model still warming up — show progress, don't treat as error
        if (data.status === "loading") {
          setStatusYolo("⏳ YOLOv8s warming up…");
          return;
        }

        if (data.phoneDetected) {
          setPhoneFlash(true);
          setTimeout(() => setPhoneFlash(false), 4000);
          addRisk(W_PHONE, "📱 Mobile phone detected during test!");
        }

        if (data.multiplePersons) {
          addRisk(W_MULTI_YOLO, "👥 Multiple people visible — only you should be present!");
        }

        setStatusYolo(
          data.phoneDetected   ? "⚠️ Phone Detected!" :
          data.multiplePersons ? "⚠️ Multiple people!" :
          `✓ YOLOv8s (${data.personCount} person${data.personCount !== 1 ? "s" : ""})`
        );

      } catch (err) {
        if (err.name === "TimeoutError") {
          setStatusYolo("Backend: timeout");
        } else {
          setStatusYolo("Backend: offline");
        }
      }
    }, "image/jpeg", 0.72);
  }, [addRisk]);

  // ── Layer 1: TF.js face-detection loop ────────────────────────────────
  useEffect(() => {
    let detector;

    const init = async () => {
      try {
        setStatusFace("Requesting camera…");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;

        setStatusFace("Loading face AI…");
        await tf.ready();
        await new Promise(r => setTimeout(r, 100));

        detector = await faceDetection.createDetector(
          faceDetection.SupportedModels.MediaPipeFaceDetector,
          { runtime: "tfjs", maxFaces: 3 }
        );

        setStatusFace("Proctoring Active");
        if (onReady) onReady();

        // Start YOLO interval after camera is ready
        yoloTimerRef.current = setInterval(sendFrameToYolo, YOLO_INTERVAL_MS);
        // Poll health until backend confirms model ready
        pollBackendHealth();

        lastCheckTime.current = Date.now();
        faceLoop();
      } catch (err) {
        console.error("Proctoring init error:", err);
        setStatusFace("Camera Error");
      }
    };

    const pollBackendHealth = async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/detect-cheating/health`);
        const d = await r.json();
        if (d.status === "ok") {
          setStatusYolo("✓ YOLOv8s ready");
        } else if (d.status === "loading") {
          setStatusYolo("⏳ YOLOv8s loading…");
          setTimeout(pollBackendHealth, 3000);   // retry in 3 s
        } else {
          setStatusYolo(`Backend: ${d.detail ?? d.status}`);
        }
      } catch {
        setStatusYolo("Backend: offline");
        setTimeout(pollBackendHealth, 5000);
      }
    };

    const faceLoop = async () => {
      if (!loopActive.current) return;

      if (videoRef.current?.readyState === 4) {
        const now    = Date.now();
        let delta    = (now - lastCheckTime.current) / 1000;
        lastCheckTime.current = now;
        if (delta > 5) delta = 3;

        // Natural risk decay each cycle
        riskScore.current = Math.max(0, riskScore.current * RISK_DECAY);

        try {
          const faces = await detector.estimateFaces(videoRef.current);

          // ── Multiple faces ─────────────────────────────────────────────
          if (faces.length > 1) {
            addRisk(W_MULTI_FACE, "👥 Multiple faces detected — no assistance allowed!");
          }

          // ── No face ────────────────────────────────────────────────────
          if (faces.length === 0) {
            addRisk(W_NO_FACE, "🚫 Your face is not visible. Please stay in front of the camera.");
          }

          // ── Gaze heuristic ─────────────────────────────────────────────
          // Requires GAZE_CONSEC_REQ consecutive frames before adding risk.
          // Single-frame blips (blinks, pose jitter) are ignored entirely.
          if (faces.length >= 1) {
            const kp       = faces[0].keypoints ?? [];
            const nose     = kp.find(k => k.name === "noseTip");
            const leftEye  = kp.find(k => k.name === "leftEye");
            const rightEye = kp.find(k => k.name === "rightEye");

            if (nose && leftEye && rightEye) {
              const d_L  = Math.abs(nose.x - leftEye.x);
              const d_R  = Math.abs(nose.x - rightEye.x);
              const ratio = d_L / (d_R + 0.001);

              const lookingAway = ratio > GAZE_RATIO_HI || ratio < GAZE_RATIO_LO;

              if (lookingAway) {
                gazeAwayStreak.current += 1;
                if (gazeAwayStreak.current >= GAZE_CONSEC_REQ) {
                  addRisk(W_GAZE, "👀 Please keep your eyes on the screen!");
                  gazeAwayStreak.current = 0;   // reset after flagging
                }
              } else {
                // Reset streak the moment they look back
                gazeAwayStreak.current = 0;
              }
            }
          }
        } catch (e) {
          console.warn("Face detection loop error:", e);
        }
      }

      setTimeout(faceLoop, FACE_INTERVAL_MS);
    };

    init();

    return () => {
      loopActive.current = false;
      clearInterval(yoloTimerRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [addRisk, sendFrameToYolo]);

  // ── Visual theme ────────────────────────────────────────────────────────
  const theme = {
    normal:  { border: "rgba(52,211,153,0.45)",  badge: "#34d399", bg: "#050e0a" },
    warning: { border: "rgba(251,146,60,0.65)",  badge: "#fb923c", bg: "#110a03" },
    alert:   { border: "rgba(248,113,113,0.80)", badge: "#f87171", bg: "#130404" },
  }[riskLevel];

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20,
      width: 234, zIndex: 9998,
      display: "flex", flexDirection: "column", gap: 5,
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Phone alert flash */}
      {phoneFlash && (
        <div style={{
          background: "rgba(248,113,113,0.15)",
          border: "1.5px solid rgba(248,113,113,0.7)",
          borderRadius: 9, padding: "8px 12px",
          fontSize: 12, fontWeight: 800, color: "#f87171",
          textAlign: "center", letterSpacing: "0.5px",
          animation: "procPulse 0.5s ease-in-out infinite alternate",
        }}>
          📱 PHONE DETECTED — PUT IT AWAY
        </div>
      )}

      {/* Camera widget */}
      <div style={{
        background: theme.bg, borderRadius: 14,
        border: `1.5px solid ${theme.border}`,
        overflow: "hidden",
        boxShadow: `0 8px 28px rgba(0,0,0,0.6)`,
        transition: "border-color 0.4s, background 0.4s",
      }}>

        {/* Face-layer status */}
        <div style={{
          padding: "5px 11px", fontSize: 10, fontWeight: 700,
          color: theme.badge, textAlign: "center",
          background: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          {riskLevel === "normal"  && "🟢"}
          {riskLevel === "warning" && "🟡"}
          {riskLevel === "alert"   && "🔴"}
          {statusFace}
        </div>

        {/* Live feed */}
        <video
          ref={videoRef} autoPlay playsInline muted
          style={{
            width: "100%", height: 132, objectFit: "cover",
            transform: "scaleX(-1)", display: "block",
          }}
        />

        {/* YOLO status strip */}
        <div style={{
          padding: "4px 10px", fontSize: 9, fontWeight: 600,
          color: statusYolo.includes("⚠️")      ? "#fb923c"
               : statusYolo.includes("error")   ? "#f87171"
               : statusYolo.includes("offline") ? "#f87171"
               : statusYolo.includes("⏳")       ? "#fb923c"
               :                                   "#475569",
          textAlign: "center",
          background: "rgba(0,0,0,0.35)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          letterSpacing: "0.3px",
        }}>
          {statusYolo}
        </div>
      </div>

      {/* Risk score bar */}
      <div style={{
        background: "rgba(5,8,18,0.85)",
        borderRadius: 9, padding: "6px 10px",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 700 }}>
          <span style={{ color: "#334155", letterSpacing: "0.5px" }}>RISK SCORE</span>
          <span style={{ color: theme.badge }}>
            {riskLevel === "normal"  ? "Normal"     : ""}
            {riskLevel === "warning" ? "Suspicious" : ""}
            {riskLevel === "alert"   ? "⚠ Flagged"  : ""}
          </span>
        </div>
        <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            width: `${Math.min(100, riskScore.current)}%`,
            background:
              riskLevel === "alert"   ? "linear-gradient(90deg,#f87171,#dc2626)" :
              riskLevel === "warning" ? "linear-gradient(90deg,#fb923c,#ea580c)" :
                                        "linear-gradient(90deg,#34d399,#059669)",
            transition: "width 0.6s ease, background 0.4s",
          }} />
        </div>
      </div>

      <style>{`
        @keyframes procPulse {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0.72; transform: scale(1.015); }
        }
      `}</style>
    </div>
  );
}
