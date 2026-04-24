import { useNavigate, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* ── TYPEWRITER ── */
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
    <span style={{ color: "#818cf8" }}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.55, repeat: Infinity, repeatType: "reverse" }}
        style={{ display: "inline-block", width: 3, height: "0.8em", background: "#818cf8", marginLeft: 3, borderRadius: 2, verticalAlign: "middle" }}
      />
    </span>
  );
}

/* ── FLOATING ORB ── */
function Orb({ size, top, left, color, duration, delay }) {
  return (
    <motion.div
      animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
      style={{
        position: "absolute", top, left,
        width: size, height: size, borderRadius: "50%",
        pointerEvents: "none",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(72px)",
      }}
    />
  );
}

/* ── FEATURE PILL ── */
function FeaturePill({ icon, text, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 16px",
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 99,
        fontSize: 13, color: "#94a3b8", fontWeight: 500,
        backdropFilter: "blur(8px)",
      }}>
      <span>{icon}</span>{text}
    </motion.div>
  );
}

/* ── STAT ── */
function Stat({ value, label, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 34, fontWeight: 800, color, letterSpacing: "-0.04em", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#475569", fontWeight: 500, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
    </motion.div>
  );
}

const navLinks = [
  { label: "Home", to: "/teacher" },
  { label: "Task", to: "/teacher/task" },
  { label: "Test", to: "/teacher/test" },
  { label: "Kanban", to: "/teacher/kanban" },
];

export default function TeacherHomePage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 80% 60% at 50% 0%, #1e1b4b 0%, #0f0e23 55%, #080714 100%)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e2e8f0",
      position: "relative",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Sora:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        .nav-link {
          font-size: 14px; font-weight: 500; color: #64748b;
          padding: 7px 16px; border-radius: 99px;
          transition: color 0.2s, background 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-link:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }
        .nav-link.active { color: #c7d2fe; background: rgba(99,102,241,0.15); }
      `}</style>

      {/* ── BACKGROUND ORBS ── */}
      <Orb size="600px" top="-8%" left="8%" color="rgba(99,102,241,0.2)" duration={16} delay={0} />
      <Orb size="400px" top="45%" left="58%" color="rgba(139,92,246,0.13)" duration={20} delay={5} />
      <Orb size="300px" top="65%" left="-5%" color="rgba(96,165,250,0.09)" duration={14} delay={2} />

      {/* Grid lines */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.04 }}>
        <defs>
          <pattern id="tgrid" width="72" height="72" patternUnits="userSpaceOnUse">
            <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#a5b4fc" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tgrid)" />
      </svg>

      <div style={{ position: "relative", zIndex: 2 }}>

        {/* ── NAVBAR ── */}
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px 40px",
          }}>

          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 99,
            padding: "6px 8px 6px 14px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}>
            {/* Logo mark */}
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 6 }}
              style={{ fontSize: 20, marginRight: 8, cursor: "pointer" }}
              onClick={() => navigate("/teacher")}>
              🎓
            </motion.div>

            {/* Links */}
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/teacher"}
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                {link.label}
              </NavLink>
            ))}

            {/* Get Started CTA */}
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 8px 28px rgba(99,102,241,0.45)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/login")}
              style={{
                marginLeft: 8,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none", color: "#fff",
                borderRadius: 99, padding: "9px 22px",
                fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                letterSpacing: "0.01em",
              }}>
              Get Started
            </motion.button>
          </div>
        </motion.nav>

        {/* ── HERO ── */}
        <section style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center",
          padding: "80px 24px 80px",
          maxWidth: 860, margin: "0 auto",
        }}>

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.28)",
              borderRadius: 99, padding: "7px 18px",
              fontSize: 11, fontWeight: 700, color: "#a5b4fc",
              letterSpacing: "0.08em", textTransform: "uppercase",
              marginBottom: 40,
            }}>
            <motion.span
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 10px #6366f1", display: "inline-block" }}
            />
            AI-Powered Classroom Platform
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
            style={{
              fontFamily: "'Sora', sans-serif", fontWeight: 800,
              fontSize: "clamp(40px, 6.5vw, 76px)",
              lineHeight: 1.06, letterSpacing: "-0.04em",
              color: "#fff", marginBottom: 14,
            }}>
            Smart Campus
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.25, 1, 0.5, 1] }}
            style={{
              fontFamily: "'Sora', sans-serif", fontWeight: 800,
              fontSize: "clamp(26px, 4.5vw, 52px)",
              lineHeight: 1.12, letterSpacing: "-0.035em",
              marginBottom: 32, minHeight: "1.3em",
              color: "#e2e8f0",
            }}>
            From Topic to{" "}
            <Typewriter words={["Task.", "Test.", "Growth.", "Impact."]} />
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.55 }}
            style={{
              fontSize: "clamp(14px, 1.6vw, 17px)",
              color: "#475569", lineHeight: 1.8,
              maxWidth: 520, marginBottom: 48, fontWeight: 400,
            }}>
            Instantly turn any textbook concept into an interactive,
            curriculum-aligned learning adventure for your students —
            all in seconds.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 56 }}>

            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 14px 44px rgba(99,102,241,0.5)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/teacher/task")}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                border: "none", color: "#fff", borderRadius: 14,
                padding: "15px 34px", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 4px 24px rgba(99,102,241,0.32)",
                letterSpacing: "0.01em",
              }}>
              ⚡ Create a Task
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, borderColor: "rgba(129,140,248,0.5)", color: "#c7d2fe" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/login")}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#94a3b8", borderRadius: 14,
                padding: "15px 34px", fontSize: 15, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                backdropFilter: "blur(8px)",
                transition: "border-color 0.2s, color 0.2s",
              }}>
              See How It Works →
            </motion.button>
          </motion.div>

          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 64 }}>
            {[
              { icon: "🧠", text: "AI Question Generator", delay: 0.5 },
              { icon: "📊", text: "Kanban Task Tracking", delay: 0.56 },
              { icon: "📝", text: "Homework & Tests", delay: 0.62 },
              { icon: "🎯", text: "Curriculum Aligned", delay: 0.68 },
              { icon: "⚡", text: "Instant Deployment", delay: 0.74 },
            ].map((f) => <FeaturePill key={f.text} {...f} />)}
          </div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.82, duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
            style={{
              width: "100%", maxWidth: 600, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.35), transparent)",
              marginBottom: 48, transformOrigin: "center",
            }}
          />

          {/* Stats */}
          <div style={{ display: "flex", gap: 64, justifyContent: "center", flexWrap: "wrap" }}>
            <Stat value="10x" label="Faster task creation" color="#a5b4fc" delay={0.9} />
            <Stat value="100%" label="Curriculum aligned" color="#34d399" delay={0.96} />
            <Stat value="3 min" label="From topic to task" color="#fb923c" delay={1.02} />
          </div>
        </section>
      </div>

      {/* Bottom glow */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 1, pointerEvents: "none",
        background: "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.4) 40%, rgba(139,92,246,0.4) 60%, transparent 100%)",
      }} />
    </div>
  );
}