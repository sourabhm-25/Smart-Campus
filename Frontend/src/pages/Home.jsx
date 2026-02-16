import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaSchool, FaChalkboardTeacher, FaUserGraduate, FaLaptopCode, FaArrowRight } from "react-icons/fa";

export default function Home() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const features = [
    { icon: <FaChalkboardTeacher />, title: "Smart Classrooms", desc: "Interactive tools for modern teaching." },
    { icon: <FaUserGraduate />, title: "Student Success", desc: "Track progress and achieve goals." },
    { icon: <FaLaptopCode />, title: "Digital Learning", desc: "Access resources from anywhere." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-violet-900 text-white overflow-hidden relative">
      
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl opacity-60"
          />
          <motion.div 
             animate={{ 
              scale: [1, 1.5, 1],
              x: [0, 100, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl opacity-60"
          />
      </div>

      {/* Navbar Placeholder */}
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="text-2xl font-bold flex items-center gap-2"
        >
          <FaSchool className="text-blue-400" /> SmartCampus
        </motion.div>
        <motion.button
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/login")}
          className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full hover:bg-white/10 transition-all font-semibold cursor-pointer"
        >
          Login
        </motion.button>
      </nav>

      {/* Hero Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center justify-center text-center mt-20 px-4"
      >
        <motion.h1 
          variants={itemVariants}
          className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400 drop-shadow-lg"
        >
          The Future of <br className="hidden md:block" /> Education is Here
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="text-gray-300 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed"
        >
          Connect teachers, students, and parents in one seamless digital ecosystem. Experience the smart campus revolution today.
        </motion.p>

        <motion.div 
          variants={itemVariants}
          className="flex flex-col md:flex-row gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(139, 92, 246, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/login")}
            className="bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 shadow-xl cursor-pointer hover:shadow-violet-500/20"
          >
            Get Started <FaArrowRight />
          </motion.button>
          
          <motion.button
             whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
             whileTap={{ scale: 0.95 }}
             className="px-8 py-4 rounded-full font-bold text-lg border border-white/20 backdrop-blur-sm cursor-pointer hover:border-violet-400/50"
          >
            Learn More
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Feature Cards */}
      <div className="relative z-10 mt-24 max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.2 }}
            whileHover={{ y: -10 }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl hover:border-violet-500/50 transition-all hover:bg-black/60 shadow-lg"
          >
            <div className="text-4xl text-blue-400 mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-2 text-violet-100">{feature.title}</h3>
            <p className="text-gray-400">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
