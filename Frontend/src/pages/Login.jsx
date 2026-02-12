import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!role) return alert("Select role");

    localStorage.setItem("role", role);

    navigate(`/${role}`);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Login</h2>

      <select
        onChange={(e) => setRole(e.target.value)}
        className="border p-2 mb-4"
      >
        <option value="">Select Role</option>
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
        <option value="parent">Parent</option>
      </select>

      <button
        onClick={handleLogin}
        className="bg-green-600 text-white px-5 py-2 rounded"
      >
        Continue
      </button>
    </div>
  );
}
