import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

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

  // --- State ---
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        await axios.post(`${API_BASE}/auth/register`, {
          name,
          email,
          password,
          role,
        });

        setSuccess("Account created successfully! You can now log in.");
        setTimeout(() => {
          setIsRegister(false);
          setSuccess("");
          setName("");
          setPassword("");
        }, 1500);
      } else {
        const res = await axios.post(`${API_BASE}/auth/login`, {
          email,
          password,
        });

        const { access_token, role: userRole } = res.data;

        localStorage.setItem("access_token", access_token);
        localStorage.setItem("role", userRole);
        localStorage.setItem("userEmail", email);

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
  };

  // --- Animations ---
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-gradient-to-br from-background-dark via-[#1a2235] to-background-dark font-display text-slate-100 antialiased">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-mentorship-purple/10 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-10 lg:px-20 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
            <span
              className="material-symbols-outlined text-white text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              school
            </span>
          </div>
          <h2 className="text-slate-100 text-xl font-extrabold tracking-tight">
            Smart Campus
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {step === 2 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleBack}
              className="flex items-center justify-center rounded-xl h-10 w-10 bg-slate-800 hover:bg-primary/20 transition-colors text-slate-300"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </motion.button>
          )}
          {step === 1 && (
            <button className="text-slate-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
          )}
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
            <div className="w-full max-w-[1024px] bg-white/[0.03] border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-xl shadow-2xl">
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
                    w-full max-w-md font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-3
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
            {/* Background blurs */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-[480px] space-y-8 relative z-10">
              {/* Title */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  {isRegister ? "Create Account" : "Welcome Back"}
                </h1>
                <p className="text-slate-400">
                  {isRegister
                    ? "Fill in your details to get started"
                    : "Please enter your details to access your portal"}
                </p>
              </div>

              {/* Glass Panel */}
              <div className="glass-panel p-8 rounded-2xl shadow-2xl space-y-6">
                {/* Login / Register Toggle */}
                <div className="flex p-1 bg-slate-800/50 rounded-xl">
                  <button
                    onClick={() => !loading && setIsRegister(false)}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${!isRegister
                      ? "bg-slate-700 shadow-sm text-white"
                      : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => !loading && setIsRegister(true)}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${isRegister
                      ? "bg-slate-700 shadow-sm text-white"
                      : "text-slate-400 hover:text-slate-200"
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
                    disabled={loading}
                    className={`
                      w-full py-4 font-bold rounded-xl shadow-lg transition-all duration-300
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
                {!isRegister && (
                  <>
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-800"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#1b1f27] px-2 text-slate-500">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4">
                      <button className="flex items-center justify-center gap-2 py-3 px-4 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-xl">
                          g_mobiledata
                        </span>
                        <span className="text-sm font-medium text-slate-300">
                          Google
                        </span>
                      </button>
                      <button className="flex items-center justify-center gap-2 py-3 px-4 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-xl text-white">
                          ios
                        </span>
                        <span className="text-sm font-medium text-slate-300">
                          Apple
                        </span>
                      </button>
                    </div>
                  </>
                )}
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
  );
}
