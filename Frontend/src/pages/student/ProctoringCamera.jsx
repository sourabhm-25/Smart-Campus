import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';

export default function ProctoringCamera({ onViolation, onReady }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Initializing AI...");
  const noFaceTime = useRef(0);
  const lookingAwayTime = useRef(0);
  const lastCheckTime = useRef(Date.now());
  const loopActive = useRef(true);
  const onViolationRef = useRef(onViolation);

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    let detector;

    const initModels = async () => {
      try {
        setStatus("Requesting Camera...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStatus("Loading AI Models...");
        // Set WebGL backend if available, otherwise WASM/CPU will be used
        await tf.ready();
        
        // Small delay to allow React to paint the "Loading..." status before heavy WebGL compile
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = { runtime: 'tfjs', maxFaces: 2 };
        detector = await faceDetection.createDetector(model, detectorConfig);

        setStatus("Proctoring Active");
        if (onReady) onReady();
        lastCheckTime.current = Date.now(); // Reset time right before loop
        checkLoop();
      } catch (err) {
        console.error("Proctoring error:", err);
        setStatus("Camera Error");
      }
    };

    const checkLoop = async () => {
      if (!loopActive.current) return;
      if (videoRef.current && videoRef.current.readyState === 4) {
        const now = Date.now();
        let deltaSec = (now - lastCheckTime.current) / 1000;
        lastCheckTime.current = now;

        // Cap deltaSec to prevent massive jumps if the thread was blocked or tab suspended
        if (deltaSec > 5) deltaSec = 3;

        try {
          // 1. Detect Faces
          const faces = await detector.estimateFaces(videoRef.current);
          
          if (faces.length > 1) {
            onViolationRef.current("Multiple faces detected in frame! No one is allowed to help you.");
          }

          if (faces.length === 0) {
            noFaceTime.current += deltaSec;
            if (noFaceTime.current > 10) {
              onViolationRef.current("No face detected for more than 10 seconds. Did you leave your seat?");
              noFaceTime.current = 0; // reset to avoid spamming
            }
          } else {
            noFaceTime.current = 0;
            
            // 3. Head Pose Heuristics (using the first face)
            const face = faces[0];
            if (face.keypoints) {
              const nose = face.keypoints.find(k => k.name === 'noseTip');
              const leftEye = face.keypoints.find(k => k.name === 'leftEye');
              const rightEye = face.keypoints.find(k => k.name === 'rightEye');
              
              if (nose && leftEye && rightEye) {
                const noseToLeft = Math.abs(nose.x - leftEye.x);
                const noseToRight = Math.abs(nose.x - rightEye.x);

                // If nose is closer to one eye by a large margin, head is turned significantly
                const ratio = noseToLeft / (noseToRight + 0.0001);
                
                if (ratio > 4 || ratio < 0.25) {
                  lookingAwayTime.current += deltaSec;
                  if (lookingAwayTime.current > 15) {
                    onViolationRef.current("Looking away from screen for more than 15 seconds!");
                    lookingAwayTime.current = 0;
                  }
                } else {
                  lookingAwayTime.current = 0;
                }
              }
            }
          }
        } catch (e) {
          console.warn("Detection error", e);
        }
      }

      // Check every 3000ms to save CPU
      setTimeout(checkLoop, 3000);
    };

    initModels();

    return () => {
      loopActive.current = false;
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      width: 220, height: 160,
      background: '#080e1a', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden',
      zIndex: 9998, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)', padding: '6px 12px',
        fontSize: 11, color: status === "Proctoring Active" ? "#34d399" : "#fb923c",
        fontWeight: 600, textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        {status === "Proctoring Active" ? "🟢 Proctoring Active" : status}
      </div>
      <video 
        ref={videoRef} autoPlay playsInline muted 
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
      />
    </div>
  );
}
