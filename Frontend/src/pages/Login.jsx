import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaChalkboardTeacher, FaUserGraduate, FaUserTie } from "react-icons/fa";

export default function Login() {
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!role) return;
    localStorage.setItem("role", role);
    navigate(`/${role}`);
  };

  const roles = [
    { id: "student", label: "Student", icon: <FaUserGraduate className="text-4xl mb-2" /> },
    { id: "teacher", label: "Teacher", icon: <FaChalkboardTeacher className="text-4xl mb-2" /> },
    { id: "parent", label: "Parent", icon: <FaUserTie className="text-4xl mb-2" /> },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-blue-950 to-violet-900 p-4 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
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
                ${role === r.id 
                  ? "bg-blue-600/80 border-blue-400 shadow-lg shadow-blue-500/30 text-white" 
                  : "bg-white/5 text-gray-300 border-transparent hover:bg-white/10 hover:border-blue-500/30"
                }
              `}
            >
              <div className={`transition-transform duration-300 ${role === r.id ? "scale-110" : ""}`}>
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
          onClick={handleLogin}
          disabled={!role}
          className={`
            w-full md:w-1/2 py-3 rounded-full text-lg font-bold shadow-lg transition-all duration-300
            ${role 
              ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:shadow-violet-500/50 cursor-pointer" 
              : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          Access Portal
        </motion.button>

      </motion.div>
    </div>
  );
}
