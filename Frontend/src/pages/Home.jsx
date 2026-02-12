import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Smart Campus</h1>

      <button
        onClick={() => navigate("/login")}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        Login
      </button>
    </div>
  );
}
