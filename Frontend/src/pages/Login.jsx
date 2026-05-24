import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import googleIcon from "../assets/google-icon.svg";

const API_BASE = "http://127.0.0.1:8000";
const GOOGLE_CLIENT_ID = "943401305975-ptt23gauoh47c3lcn22usn3orrmfrnhh.apps.googleusercontent.com";

const AVAILABLE_SUBJECTS = [
  "Mathematics", "Science", "English", "Hindi", "History",
  "Geography", "Computer Science", "Art & Design", "Physical Education",
  "Social Studies", "Physics", "Chemistry", "Biology",
];

const GRADES = [
  "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th",
];

const roles = [
  {
    id: "student",
    label: "Student",
    icon: "school",
    color: "scholar-blue",
    description: "Access courses, submit assignments, and track academic growth.",
    portal: "Scholar Portal",
  },
  {
    id: "teacher",
    label: "Teacher",
    icon: "co_present",
    color: "mentorship-purple",
    description: "Manage virtual classrooms, grading, and student mentorship tools.",
    portal: "Mentorship Dashboard",
  },
  {
    id: "parent",
    label: "Parent",
    icon: "family_restroom",
    color: "support-teal",
    description: "Monitor progress, view attendance, and coordinate with educators.",
    portal: "Support Center",
  },
];

const colorMap = {
  "scholar-blue": {
    bg: "bg-scholar-blue/20",
    text: "text-scholar-blue",
    hoverBg: "hover:bg-scholar-blue/10",
    hoverBorder: "hover:border-scholar-blue/40",
    border: "border-scholar-blue/20",
    selectedBg: "bg-scholar-blue/15",
    selectedBorder: "border-scholar-blue/50",
    indicator: "bg-scholar-blue",
  },
  "mentorship-purple": {
    bg: "bg-mentorship-purple/20",
    text: "text-mentorship-purple",
    hoverBg: "hover:bg-mentorship-purple/10",
    hoverBorder: "hover:border-mentorship-purple/40",
    border: "border-mentorship-purple/20",
    selectedBg: "bg-mentorship-purple/15",
    selectedBorder: "border-mentorship-purple/50",
    indicator: "bg-mentorship-purple",
  },
  "support-teal": {
    bg: "bg-support-teal/20",
    text: "text-support-teal",
    hoverBg: "hover:bg-support-teal/10",
    hoverBorder: "hover:border-support-teal/40",
    border: "border-support-teal/20",
    selectedBg: "bg-support-teal/15",
    selectedBorder: "border-support-teal/50",
    indicator: "bg-support-teal",
  },
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // --- State ---
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  // Sync state with URL search parameters
  useEffect(() => {
    const paramRole = searchParams.get("role");
    const paramMode = searchParams.get("mode");
    if (paramRole) {
      setRole(paramRole);
      setStep(2);
    } else {
      setRole("");
      setStep(1);
    }
    setIsRegister(paramMode === "register");
  }, [searchParams]);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Role-specific registration fields
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [selectedGrades, setSelectedGrades] = useState([]);  // Teacher multi-grade
  const [subjects, setSubjects] = useState([]);
  const [childEmail, setChildEmail] = useState("");

  // Picker toggles
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Ref to track isRegister inside Google callback (avoids stale closure)
  const isRegisterRef = useRef(isRegister);

  // Keep ref in sync with state
  useEffect(() => {
    isRegisterRef.current = isRegister;
  }, [isRegister]);

  // --- Google OAuth Handler ---
  const handleGoogleResponse = useCallback(async (response) => {
    setError("");
    setSuccess("");
    setGoogleLoading(true);

    const currentIsRegister = isRegisterRef.current;
    const endpoint = currentIsRegister
      ? `${API_BASE}/auth/google/register`
      : `${API_BASE}/auth/google/login`;

    try {
      const payload = {
        credential: response.credential,
        role: role,
      };

      // Include role-specific fields for Google registration
      if (currentIsRegister) {
        if (role === "student" || role === "teacher") payload.school = school;
        if (role === "student") payload.grade = grade;
        if (role === "teacher") {
          payload.subjects = subjects;
          payload.grades = selectedGrades;
        }
        if (role === "parent") payload.child_email = childEmail;
      }

      const res = await axios.post(endpoint, payload);

      const { access_token, role: userRole, user } = res.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("role", userRole);
      if (user) {
        localStorage.setItem("userEmail", user.email || "");
        localStorage.setItem("userName", user.name || "");
        localStorage.setItem("user", JSON.stringify(user));
      }

      if (currentIsRegister) {
        setSuccess("Account created with Google! Redirecting...");
      } else {
        setSuccess("Logged in with Google! Redirecting...");
      }

      setTimeout(() => {
        navigate(`/${userRole}`);
      }, 800);
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Google authentication failed. Please try again.";
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  }, [role, navigate]);

  // --- Initialize Google Identity Services (once GSI script loads) ---
  const googleInitializedRef = useRef(false);

  useEffect(() => {
    if (step !== 2 || !role) return;

    const initGSI = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        googleInitializedRef.current = true;
      }
    };

    if (window.google) {
      initGSI();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initGSI();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step, role, handleGoogleResponse]);

  // --- Handle custom Google button click ---
  const handleGoogleClick = () => {
    if (!window.google || !googleInitializedRef.current) {
      setError("Google Sign-In is still loading. Please try again in a moment.");
      return;
    }
    // Re-initialize to pick up the latest callback ref
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap not available — fallback: open Google OAuth popup manually
        const redirectUri = window.location.origin;
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${GOOGLE_CLIENT_ID}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=id_token` +
          `&scope=openid%20email%20profile` +
          `&nonce=${Math.random().toString(36).substring(2)}`;
        window.location.href = googleAuthUrl;
      }
    });
  };

  // --- Handlers ---
  const handleContinue = () => {
    if (!role) return;
    setStep(2);
    setError("");
    setSuccess("");
  };

  const handleBack = () => {
    setStep(1);
    setError("");
    setSuccess("");
    setIsRegister(false);
    setName("");
    setEmail("");
    setPassword("");
    setSchool("");
    setGrade("");
    setSelectedGrades([]);
    setSubjects([]);
    setChildEmail("");
    setShowGradePicker(false);
    setShowSubjectPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        const registerPayload = {
          name,
          email,
          password,
          role,
        };

        // Add role-specific fields
        if (role === "student" || role === "teacher") registerPayload.school = school;
        if (role === "student") registerPayload.grade = grade;
        if (role === "teacher") {
          registerPayload.subjects = subjects;
          registerPayload.grades = selectedGrades;
        }
        if (role === "parent" && childEmail) registerPayload.child_email = childEmail;

        const registerRes = await axios.post(`${API_BASE}/auth/register`, registerPayload);

        // Store token and user data from registration too
        if (registerRes.data.access_token) {
          localStorage.setItem("access_token", registerRes.data.access_token);
          localStorage.setItem("role", registerRes.data.role);
          if (registerRes.data.user) {
            localStorage.setItem("userName", registerRes.data.user.name || "");
            localStorage.setItem("userEmail", registerRes.data.user.email || "");
            localStorage.setItem("user", JSON.stringify(registerRes.data.user));
          }
        }

        if (role === "student") {
          setSuccess("Account created! Your enrollment request has been sent to the teachers. Redirecting...");
        } else {
          setSuccess("Account created successfully! Redirecting...");
        }
        setTimeout(() => {
          navigate(`/${role}`);
        }, 1500);
      } else {
        const res = await axios.post(`${API_BASE}/auth/login`, {
          email,
          password,
        });

        const { access_token, role: userRole, user } = res.data;

        localStorage.setItem("access_token", access_token);
        localStorage.setItem("role", userRole);
        localStorage.setItem("userEmail", email);
        if (user) {
          localStorage.setItem("userName", user.name || "");
          localStorage.setItem("user", JSON.stringify(user));
        }

        navigate(`/${userRole}`);
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister((prev) => !prev);
    setError("");
    setSuccess("");
    setName("");
    setPassword("");
    setSchool("");
    setGrade("");
    setSelectedGrades([]);
    setSubjects([]);
    setChildEmail("");
    setShowGradePicker(false);
    setShowSubjectPicker(false);
  };

  const toggleSubject = (subj) => {
    setSubjects((prev) =>
      prev.includes(subj)
        ? prev.filter((s) => s !== subj)
        : [...prev, subj]
    );
  };

  const toggleGrade = (g) => {
    setSelectedGrades((prev) =>
      prev.includes(g)
        ? prev.filter((x) => x !== g)
        : [...prev, g]
    );
  };

  // --- Animations ---
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <>
      <style>{`
        .auth-page {
          position: relative;
          background: #ffffff;
          color: #13233a;
        }
        .auth-page::before,
        .auth-page::after {
          content: "";
          position: fixed;
          z-index: 0;
          pointer-events: none;
          filter: blur(1px);
        }
        .auth-page::before {
          width: 42vw;
          height: 42vw;
          left: -16vw;
          top: 12vh;
          border-radius: 38% 62% 55% 45%;
          background: rgba(244, 217, 142, 0.28);
          border: 4px solid rgba(20, 20, 138, 0.12);
        }
        .auth-page::after {
          width: 34vw;
          height: 34vw;
          right: -12vw;
          bottom: -8vw;
          border-radius: 64% 36% 44% 56%;
          background: rgba(216, 160, 196, 0.2);
          border: 4px solid rgba(139, 183, 216, 0.16);
        }
        .auth-header {
          background: #ffffff;
          border-bottom: 4px solid #273c75;
          box-shadow: 0 8px 0 #f4d98e;
        }
        .auth-logo-mark {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border-radius: 0;
          box-shadow: none;
        }
        .auth-logo-mark img {
          width: 64px;
          height: 64px;
          object-fit: contain;
        }
        .auth-page h1,
        .auth-page h2,
        .auth-page h3,
        .auth-page label {
          color: #273c75 !important;
        }
        .auth-page p,
        .auth-page .text-slate-400,
        .auth-page .text-slate-500,
        .auth-page .text-gray-400 {
          color: #42526b !important;
        }
        .auth-chunky-card,
        .auth-page .glass-panel {
          position: relative;
          background: rgba(255, 255, 255, 0.96) !important;
          border: 4px solid #273c75 !important;
          border-radius: 8px !important;
          box-shadow: 14px 14px 0 #8bb7d8, 0 24px 60px rgba(39, 60, 117, 0.1) !important;
          backdrop-filter: none !important;
        }
        .auth-chunky-card::before,
        .auth-page .glass-panel::before {
          content: "";
          position: absolute;
          width: 96px;
          height: 42px;
          right: 22px;
          top: -22px;
          border-radius: 999px;
          background: #f4d98e;
          border: 4px solid #273c75;
          transform: rotate(5deg);
          z-index: -1;
        }
        .auth-asset {
          position: absolute;
          pointer-events: none;
          user-select: none;
          z-index: 0;
          filter: drop-shadow(8px 10px 0 rgba(39,60,117,0.1));
        }
        .auth-asset.book {
          width: min(22vw, 210px);
          left: clamp(16px, 5vw, 70px);
          bottom: clamp(70px, 8vw, 120px);
          transform: rotate(-7deg);
        }
        .role-card {
          background: #ffffff !important;
          border: 4px solid #273c75 !important;
          border-radius: 8px !important;
          box-shadow: 8px 8px 0 var(--role-shadow, #d8a0c4);
          color: #13233a !important;
        }
        .role-card:nth-child(1) { --role-shadow: #8bb7d8; }
        .role-card:nth-child(2) { --role-shadow: #d8a0c4; }
        .role-card:nth-child(3) { --role-shadow: #f4d98e; }
        .role-card h3 {
          color: #273c75 !important;
        }
        .role-card:hover {
          transform: translateY(-6px) rotate(-1deg);
        }
        .auth-page input,
        .auth-page select,
        .auth-picker-button {
          background: #ffffff !important;
          color: #273c75 !important;
          border: 3px solid #273c75 !important;
          border-radius: 8px !important;
          box-shadow: 5px 5px 0 rgba(216, 160, 196, 0.42);
        }
        .auth-page input::placeholder {
          color: #77859a !important;
        }
        .auth-page .material-symbols-outlined {
          color: #273c75;
        }
        .auth-toggle {
          background: #fbefd0 !important;
          border: 3px solid #273c75;
          border-radius: 8px !important;
        }
        .auth-toggle button {
          color: #273c75 !important;
          border-radius: 6px !important;
        }
        .auth-toggle .is-active {
          background: #d8a0c4 !important;
          color: #273c75 !important;
          box-shadow: 4px 4px 0 #273c75;
        }
        .auth-primary-btn {
          background: #f4d98e !important;
          color: #273c75 !important;
          border: 4px solid #273c75 !important;
          border-radius: 8px !important;
          box-shadow: 7px 7px 0 #d8a0c4 !important;
        }
        .auth-primary-btn:disabled {
          background: #e2e8f0 !important;
          color: #64748b !important;
          border-color: #94a3b8 !important;
          box-shadow: none !important;
        }
        .auth-google-btn {
          background: #dfc2c2ff !important;
          color: #273c75 !important;
          border: 3px solid #273c75 !important;
          border-radius: 8px !important;
          box-shadow: 5px 5px 0 #8bb7d8;
        }
        .auth-page footer {
          background: #ffffff;
          border-top: 3px solid #273c75 !important;
          color: #42526b !important;
        }
        @media (max-width: 900px) {
          .auth-asset {
            display: none;
          }
          .auth-logo-mark,
          .auth-logo-mark img {
            width: 54px;
            height: 54px;
          }
          .auth-chunky-card,
          .auth-page .glass-panel {
            box-shadow: 8px 8px 0 #8bb7d8 !important;
          }
        }
      `}</style>
      <div className="auth-page relative flex min-h-screen w-full flex-col overflow-x-hidden font-display antialiased">
      <img className="auth-asset book" src="/open-book-bulb.png" alt="" aria-hidden="true" />

      {/* Header */}
      <header className="auth-header flex items-center justify-between px-6 py-4 md:px-10 lg:px-20 z-10">
        <div className="flex items-center gap-3">
          <div className="auth-logo-mark">
            <img src="/logo.png" alt="Smart Campus Logo" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Smart Campus
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {step === 2 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleBack}
              className="auth-google-btn flex items-center gap-2 px-3 py-2 transition-all text-sm font-bold"
              title="Change Role"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="hidden sm:inline">Change Role</span>
            </motion.button>
          )}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => navigate('/')}
            className="auth-google-btn flex items-center gap-2 px-3 py-2 transition-all text-sm font-bold"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            <span>Back to Home</span>
          </motion.button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* ========== STEP 1: ROLE SELECTION ========== */}
        {step === 1 && (
          <motion.main
            key="step-1"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-1 items-center justify-center p-6 md:p-12 z-10"
          >
            <div className="auth-chunky-card w-full max-w-[1024px] p-8 md:p-12">
              {/* Title */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                  Welcome to Smart Campus
                </h1>
                <p className="text-slate-400 text-lg max-w-xl mx-auto">
                  Modernizing education through seamless digital integration.
                  Please select your role to personalize your experience.
                </p>
              </div>

              {/* Role Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {roles.map((r) => {
                  const c = colorMap[r.color];
                  const isSelected = role === r.id;
                  return (
                    <motion.div
                      key={r.id}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRole(r.id)}
                      className={`
                        role-card
                        group relative flex flex-col items-center text-center p-8
                        border rounded-2xl transition-all duration-300 cursor-pointer
                        ${isSelected
                          ? `${c.selectedBg} ${c.selectedBorder} border-2`
                          : `bg-white/[0.02] border-white/5 ${c.hoverBg} ${c.hoverBorder}`
                        }
                      `}
                    >
                      {/* Icon */}
                      <div
                        className={`mb-6 w-20 h-20 rounded-2xl ${c.bg} flex items-center justify-center ${c.text} group-hover:scale-110 transition-transform duration-300 ${isSelected ? "scale-110" : ""}`}
                      >
                        <span
                          className="material-symbols-outlined text-4xl"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {r.icon}
                        </span>
                      </div>
                      {/* Text */}
                      <h3 className="text-white text-xl font-bold mb-2">
                        {r.label}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        {r.description}
                      </p>
                      <div
                        className={`mt-auto inline-flex items-center gap-2 ${c.text} font-semibold text-sm`}
                      >
                        {r.portal}{" "}
                        <span className="material-symbols-outlined text-sm">
                          arrow_forward
                        </span>
                      </div>
                      {/* Selection Indicator */}
                      <div
                        className={`absolute top-4 right-4 w-4 h-4 rounded-full border-2 ${c.border} flex items-center justify-center transition-colors duration-300 ${isSelected ? c.indicator : "group-hover:" + c.indicator.replace("bg-", "bg-")
                          }`}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-1.5 h-1.5 bg-white rounded-full"
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Continue Button */}
              <div className="flex flex-col items-center gap-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContinue}
                  disabled={!role}
                  className={`
                    auth-primary-btn w-full max-w-md font-bold py-4 px-8 transition-all flex items-center justify-center gap-3
                    ${role
                      ? "bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/20 cursor-pointer"
                      : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                    }
                  `}
                >
                  <span>Continue to Dashboard</span>
                  {role && (
                    <span className="material-symbols-outlined">login</span>
                  )}
                </motion.button>
                <div className="flex items-center gap-2">
                  <p className="text-slate-500 text-sm">
                    Having trouble logging in?
                  </p>
                  <button className="text-primary hover:text-blue-400 text-sm font-semibold underline decoration-primary/30 underline-offset-4 transition-all">
                    Request Support
                  </button>
                </div>
              </div>
            </div>
          </motion.main>
        )}

        {/* ========== STEP 2: AUTHENTICATION ========== */}
        {step === 2 && (
          <motion.main
            key="step-2"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10"
          >
            <div className="w-full max-w-[480px] space-y-8 relative z-10">
              {/* Title */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">
                  {isRegister ? "Create Account" : "Welcome Back"}
                </h1>
                <p className="text-slate-400">
                  {isRegister
                    ? "Fill in your details to get started"
                    : "Please enter your details to access your portal"}
                </p>
              </div>

              {/* Glass Panel */}
              <div className="glass-panel p-8 space-y-6">
                {/* Login / Register Toggle */}
                <div className="auth-toggle flex p-1">
                  <button
                    onClick={() => !loading && setIsRegister(false)}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-300 ${!isRegister
                      ? "is-active"
                      : ""
                      }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => !loading && setIsRegister(true)}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all duration-300 ${isRegister
                      ? "is-active"
                      : ""
                      }`}
                  >
                    Register
                  </button>
                </div>

                {/* Success / Error Messages */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm px-4 py-3 rounded-xl"
                    >
                      ✅ {success}
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-500/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl"
                    >
                      ❌ {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name (register only) */}
                  <AnimatePresence>
                    {isRegister && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2"
                      >
                        <label className="text-sm font-medium text-slate-300 ml-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                            person
                          </span>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="John Doe"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all text-white placeholder-slate-500"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                        mail
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="student@university.edu"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">
                      Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                        lock
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-800 border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all text-white placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* ══════ ROLE-SPECIFIC FIELDS (Register Only) ══════ */}
                  <AnimatePresence>
                    {isRegister && (role === "student" || role === "teacher") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 pt-1"
                      >
                        {/* Section label */}
                        <div className="flex items-center gap-2 pt-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            {role === "teacher" ? "Teacher Details" : "Student Details"}
                          </span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                        </div>

                        {/* School Name */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300 ml-1">
                            School Name
                          </label>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                              apartment
                            </span>
                            <input
                              type="text"
                              value={school}
                              onChange={(e) => setSchool(e.target.value)}
                              required
                              placeholder="e.g. ABC International School"
                              className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all text-white placeholder-slate-500"
                            />
                          </div>
                        </div>

                        {/* Grade (Student only) */}
                        {role === "student" && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">
                              Grade / Class
                            </label>
                            <div className="relative">
                              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                                class
                              </span>
                              <select
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all text-white appearance-none cursor-pointer"
                              >
                                <option value="" disabled>Select your grade</option>
                                {GRADES.map((g) => (
                                  <option key={g} value={g}>{g} Grade</option>
                                ))}
                              </select>
                              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                                expand_more
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Grades (Teacher only — multi-select) */}
                        {role === "teacher" && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">
                              Grades You Teach
                              {selectedGrades.length > 0 && (
                                <span className="ml-2 text-primary font-bold">({selectedGrades.length} selected)</span>
                              )}
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowGradePicker(!showGradePicker)}
                              className="auth-picker-button w-full flex items-center justify-between pl-12 pr-4 py-3.5 text-left transition-all relative"
                            >
                              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                                class
                              </span>
                              <span className={selectedGrades.length > 0 ? "text-white" : "text-slate-500"}>
                                {selectedGrades.length > 0
                                  ? selectedGrades.join(", ")
                                  : "Select grades..."}
                              </span>
                              <span className="material-symbols-outlined text-slate-400 text-lg">
                                {showGradePicker ? "expand_less" : "expand_more"}
                              </span>
                            </button>

                            <AnimatePresence>
                              {showGradePicker && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex flex-wrap gap-2 pt-2"
                                >
                                  {GRADES.map((g) => {
                                    const isSelected = selectedGrades.includes(g);
                                    return (
                                      <motion.button
                                        key={g}
                                        type="button"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleGrade(g)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 border ${
                                          isSelected
                                            ? "bg-mentorship-purple/20 border-mentorship-purple/50 text-mentorship-purple shadow-sm shadow-mentorship-purple/10"
                                            : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                                        }`}
                                      >
                                        {isSelected && (
                                          <span className="material-symbols-outlined text-xs mr-1 align-middle" style={{ fontSize: '14px' }}>
                                            check
                                          </span>
                                        )}
                                        {g} Grade
                                      </motion.button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Subjects (Teacher only) */}
                        {role === "teacher" && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">
                              Subjects You Teach
                              {subjects.length > 0 && (
                                <span className="ml-2 text-primary font-bold">({subjects.length} selected)</span>
                              )}
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowSubjectPicker(!showSubjectPicker)}
                              className="auth-picker-button w-full flex items-center justify-between pl-12 pr-4 py-3.5 text-left transition-all relative"
                            >
                              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                                menu_book
                              </span>
                              <span className={subjects.length > 0 ? "text-white" : "text-slate-500"}>
                                {subjects.length > 0
                                  ? subjects.join(", ")
                                  : "Select subjects..."}
                              </span>
                              <span className="material-symbols-outlined text-slate-400 text-lg">
                                {showSubjectPicker ? "expand_less" : "expand_more"}
                              </span>
                            </button>

                            <AnimatePresence>
                              {showSubjectPicker && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex flex-wrap gap-2 pt-2"
                                >
                                  {AVAILABLE_SUBJECTS.map((subj) => {
                                    const isSelected = subjects.includes(subj);
                                    return (
                                      <motion.button
                                        key={subj}
                                        type="button"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleSubject(subj)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 border ${
                                          isSelected
                                            ? "bg-primary/20 border-primary/50 text-primary shadow-sm shadow-primary/10"
                                            : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                                        }`}
                                      >
                                        {isSelected && (
                                          <span className="material-symbols-outlined text-xs mr-1 align-middle" style={{ fontSize: '14px' }}>
                                            check
                                          </span>
                                        )}
                                        {subj}
                                      </motion.button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Parent — Child's Email */}
                  <AnimatePresence>
                    {isRegister && role === "parent" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2 pt-1"
                      >
                        <div className="flex items-center gap-2 pt-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            Link Your Child
                          </span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                        </div>
                        <label className="text-sm font-medium text-slate-300 ml-1">
                          Child's Email <span className="text-slate-500">(registered as student)</span>
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                            child_care
                          </span>
                          <input
                            type="email"
                            value={childEmail}
                            onChange={(e) => setChildEmail(e.target.value)}
                            placeholder="child@school.com"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all text-white placeholder-slate-500"
                          />
                        </div>
                        <p className="text-xs text-slate-500 ml-1">
                          Optional — you can link later. Your child must be registered first.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Remember me + Forgot password (login only) */}
                  {!isRegister && (
                    <div className="flex items-center justify-between px-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary/30 transition-all"
                        />
                        <span className="text-xs text-slate-400 group-hover:text-slate-200">
                          Remember me
                        </span>
                      </label>
                      <button
                        type="button"
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || googleLoading}
                    className={`
                      auth-primary-btn w-full py-4 font-bold shadow-lg transition-all duration-300
                      ${loading
                        ? "bg-gray-700/50 text-gray-400 cursor-wait"
                        : "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-primary/20 cursor-pointer active:scale-[0.98]"
                      }
                    `}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        {isRegister ? "Creating Account..." : "Signing In..."}
                      </span>
                    ) : isRegister ? (
                      "Create Account"
                    ) : (
                      "Sign In"
                    )}
                  </motion.button>
                </form>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">
                      {isRegister ? "Or register with" : "Or login with"}
                    </span>
                  </div>
                </div>

                {/* Custom Google Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={googleLoading || loading}
                  className={`
                    w-full flex items-center justify-center gap-3 py-3.5 px-6
                    auth-google-btn
                    transition-all duration-200 group
                    ${googleLoading ? "cursor-wait opacity-70" : "cursor-pointer"}
                  `}
                >
                  {googleLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-slate-400"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-slate-400">
                        Authenticating with Google...
                      </span>
                    </>
                  ) : (
                    <>
                      <img
                        src={googleIcon}
                        alt="Google"
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {isRegister ? "Register with Google" : "Login with Google"}
                      </span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Toggle text */}
              <p className="text-center text-gray-400 text-sm">
                {isRegister
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <button
                  onClick={toggleMode}
                  disabled={loading}
                  className="text-primary hover:text-blue-400 font-semibold transition-colors underline underline-offset-2"
                >
                  {isRegister ? "Sign In" : "Register"}
                </button>
              </p>

              {/* Status Indicator */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                  Campus Systems Operational
                </span>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="p-6 text-center text-slate-500 text-xs border-t border-white/5 z-10">
        <div className="flex justify-center gap-6 mb-2">
          <span className="hover:text-slate-300 transition-colors cursor-pointer">
            Privacy Policy
          </span>
          <span className="hover:text-slate-300 transition-colors cursor-pointer">
            Terms of Service
          </span>
          <span className="hover:text-slate-300 transition-colors cursor-pointer">
            {step === 1 ? "System Status" : "Help Center"}
          </span>
        </div>
        <p>© 2024 Smart Campus Educational Systems. All rights reserved.</p>
      </footer>
    </div>
    </>
  );
}
