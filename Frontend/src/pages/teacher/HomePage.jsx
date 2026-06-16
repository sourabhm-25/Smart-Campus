import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function Typewriter({ words }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const timeout = useRef(null);

  useEffect(() => {
    const word = words[index % words.length];
    if (!deleting && displayed.length < word.length) {
      timeout.current = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === word.length) {
      timeout.current = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout.current = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
    } else {
      setDeleting(false);
      setIndex((i) => i + 1);
    }
    return () => clearTimeout(timeout.current);
  }, [displayed, deleting, index, words]);

  return (
    <span style={{ color: "#c94fab" }}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.55, repeat: Infinity, repeatType: "reverse" }}
        style={{ display: "inline-block", width: 3, height: "0.8em", background: "#c94fab", marginLeft: 3, borderRadius: 2, verticalAlign: "middle" }}
      />
    </span>
  );
}



export default function TeacherHomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "32px", minHeight: "100%", fontFamily: "'DM Sans', sans-serif", color: "#071521", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        button { cursor: pointer; font-family: inherit; }
        .teacher-dashboard-page {
          min-height: 100%;
          background:
            radial-gradient(circle at 12% 10%, rgba(216,160,196,0.26), transparent 26%),
            radial-gradient(circle at 86% 18%, rgba(139,183,216,0.28), transparent 30%);
        }
        .teacher-home-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(220px, 340px);
          align-items: center;
          gap: 34px;
          padding: 54px 34px;
          max-width: 1080px;
          margin: 48px auto 36px;
          border: 4px solid #273c75;
          border-radius: 8px;
          background: linear-gradient(135deg, #ffe792, #d8e8f4);
          box-shadow: 12px 12px 0 #d8a0c4;
        }
        
        @media (max-width: 900px) {
          .teacher-home-hero { grid-template-columns: 1fr; margin: 18px 18px 30px; padding: 34px 24px; }
          .teacher-home-visual { max-width: 220px; justify-self: center; }
          .teacher-stat-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .teacher-home-hero { margin: 12px 14px 24px; padding: 24px 18px; box-shadow: 7px 7px 0 #d8a0c4; }
          .teacher-home-actions { width: 100%; }
          .teacher-home-actions button { width: 100%; }
        }
      `}</style>

      <div className="teacher-home-shell">
        <section className="teacher-home-hero">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#ffffff",
                border: "3px solid #273c75",
                borderRadius: 8,
                padding: "7px 18px",
                fontSize: 11,
                fontWeight: 900,
                color: "#273c75",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 28,
              }}>
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }}
                style={{ width: 7, height: 7, borderRadius: "50%", background: "#d8a0c4", boxShadow: "0 0 10px #d8a0c4", display: "inline-block" }}
              />
              AI-Powered Classroom Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(40px, 6.5vw, 76px)",
                lineHeight: 1.06,
                letterSpacing: 0,
                color: "#273c75",
                marginBottom: 14,
              }}>
              Smart Campus
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.18, ease: [0.25, 1, 0.5, 1] }}
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(26px, 4.5vw, 52px)",
                lineHeight: 1.12,
                letterSpacing: 0,
                marginBottom: 24,
                minHeight: "1.3em",
                color: "#273c75",
              }}>
              From Topic to <Typewriter words={["Task.", "Test.", "Growth.", "Impact."]} />
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.55 }}
              style={{
                fontSize: "clamp(14px, 1.6vw, 17px)",
                color: "#334155",
                lineHeight: 1.8,
                maxWidth: 560,
                marginBottom: 34,
                fontWeight: 800,
              }}>
              Instantly turn any textbook concept into an interactive, curriculum-aligned
              learning adventure for your students, all in seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="teacher-home-actions"
              style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "flex-start" }}>
              <motion.button
                whileHover={{ y: -3, boxShadow: "6px 6px 0 #273c75" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/teacher/task")}
                style={{
                  background: "#ffffff",
                  border: "4px solid #273c75",
                  color: "#273c75",
                  borderRadius: 8,
                  padding: "15px 34px",
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "0.01em",
                }}>
                Create a Task
              </motion.button>

              <motion.button
                whileHover={{ y: -3, boxShadow: "6px 6px 0 #273c75" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/login")}
                style={{
                  background: "#f1d8e6",
                  border: "4px solid #273c75",
                  color: "#273c75",
                  borderRadius: 8,
                  padding: "15px 34px",
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                See How It Works
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            className="teacher-home-visual"
            initial={{ opacity: 0, rotate: 2, scale: 0.92 }}
            animate={{ opacity: 1, rotate: -1, scale: 1 }}
            transition={{ delay: 0.24, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            style={{ display: "grid", placeItems: "center", justifySelf: "end" }}>
            <img src="/dashboard-elements/graduation-stack.png" alt="" aria-hidden="true" style={{ width: "min(100%, 280px)", objectFit: "contain", filter: "drop-shadow(10px 12px 0 rgba(39,60,117,0.14))" }} />
          </motion.div>
        </section>

       
      </div>
    </div>
  );
}
