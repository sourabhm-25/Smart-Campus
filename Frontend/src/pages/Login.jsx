import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUserTie,
  FaArrowLeft,
  FaUserPlus,
  FaSignInAlt,
} from "react-icons/fa";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

const roles = [
  {
    id: "student",
    label: "Student",
    icon: <FaUserGraduate className="text-4xl mb-2" />,
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    id: "teacher",
    label: "Teacher",
    icon: <FaChalkboardTeacher className="text-4xl mb-2" />,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "parent",
    label: "Parent",
    icon: <FaUserTie className="text-4xl mb-2" />,
    gradient: "from-amber-500 to-orange-600",
  },
];

export default function Login() {
  const navigate = useNavigate();

  // --- State ---
  const [step, setStep] = useState(1); // 1 = role select, 2 = auth form
  const [role, setRole] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        // --- REGISTER ---
        await axios.post(`${API_BASE}/auth/register`, {
          name,
          email,
          password,
          role,
        });

        setSuccess("Account created successfully! You can now log in.");
        // Auto-switch to login after a short delay
        setTimeout(() => {
          setIsRegister(false);
          setSuccess("");
          setName("");
          setPassword("");
        }, 1500);
      } else {
        // --- LOGIN ---
        const res = await axios.post(`${API_BASE}/auth/login`, {
          email,
          password,
        });

        const { access_token, role: userRole } = res.data;

        // Persist auth data
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("role", userRole);
        localStorage.setItem("userEmail", email);

        // Navigate to role-based dashboard
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

  // --- Currently selected role info ---
  const selectedRole = roles.find((r) => r.id === role);

  // --- Animations ---
  const pageVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-950 to-violet-900 p-4 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>

      <AnimatePresence mode="wait">
        {/* ========================================== */}
        {/* STEP 1: ROLE SELECTION                     */}
        {/* ========================================== */}
        {step === 1 && (
          <motion.div
            key="step-1"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-black/30 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col items-center text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">
              Smart Campus
            </h1>
            <p className="text-blue-200 mb-8 text-lg">
              Please select your role to continue
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
              {roles.map((r) => (
                <motion.div
                  key={r.id}
                  whileHover={{ scale: 1.05, translateY: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRole(r.id)}
                  className={`
                    cursor-pointer p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3
                    ${
                      role === r.id
                        ? "bg-blue-600/80 border-blue-400 shadow-lg shadow-blue-500/30 text-white"
                        : "bg-white/5 text-gray-300 border-transparent hover:bg-white/10 hover:border-blue-500/30"
                    }
                  `}
                >
                  <div
                    className={`transition-transform duration-300 ${
                      role === r.id ? "scale-110" : ""
                    }`}
                  >
                    {r.icon}
                  </div>
                  <span className="font-semibold text-xl tracking-wide">
                    {r.label}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContinue}
              disabled={!role}
              className={`
                w-full md:w-1/2 py-3 rounded-full text-lg font-bold shadow-lg transition-all duration-300
                ${
                  role
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:shadow-violet-500/50 cursor-pointer"
                    : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              Continue
            </motion.button>
          </motion.div>
        )}

        {/* ========================================== */}
        {/* STEP 2: LOGIN / REGISTER FORM              */}
        {/* ========================================== */}
        {step === 2 && (
          <motion.div
            key="step-2"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-black/30 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full"
          >
            {/* Header: back + role badge */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <FaArrowLeft className="text-lg" />
              </button>
              <div className="flex items-center gap-2">
                <span
                  className={`bg-gradient-to-r ${selectedRole?.gradient} text-white px-3 py-1 rounded-full text-sm font-semibold`}
                >
                  {selectedRole?.label}
                </span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-1">
              {isRegister ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-blue-200/70 text-sm mb-6">
              {isRegister
                ? "Fill in your details to get started"
                : "Sign in to access your dashboard"}
            </p>

            {/* Login / Register Toggle */}
            <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
              <button
                onClick={() => !loading && setIsRegister(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                  !isRegister
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <FaSignInAlt /> Login
              </button>
              <button
                onClick={() => !loading && setIsRegister(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                  isRegister
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <FaUserPlus /> Register
              </button>
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm px-4 py-3 rounded-xl mb-4"
                >
                  ✅ {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/20 border border-red-500/40 text-red-300 text-sm px-4 py-3 rounded-xl mb-4"
                >
                  ❌ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name (register only) */}
              <AnimatePresence>
                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-gray-300 text-sm mb-1.5 font-medium">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label className="block text-gray-300 text-sm mb-1.5 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-300 text-sm mb-1.5 font-medium">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={`
                  w-full py-3 rounded-xl text-lg font-bold shadow-lg transition-all duration-300
                  ${
                    loading
                      ? "bg-gray-700/50 text-gray-400 cursor-wait"
                      : "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:shadow-violet-500/50 cursor-pointer"
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

            {/* Toggle text */}
            <p className="text-center text-gray-400 text-sm mt-6">
              {isRegister
                ? "Already have an account? "
                : "Don't have an account? "}
              <button
                onClick={toggleMode}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors underline underline-offset-2"
              >
                {isRegister ? "Sign In" : "Register"}
              </button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
