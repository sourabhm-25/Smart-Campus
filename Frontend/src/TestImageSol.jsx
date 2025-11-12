import { useState } from "react";
import axios from "axios";

export default function TestImageSol() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !question) {
      alert("Please enter a question and upload an image");
      return;
    }

    const formData = new FormData();
    formData.append("question_text", question);
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post("http://127.0.0.1:8000/evaluate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong! Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "3rem auto",
        padding: "2rem",
        borderRadius: "16px",
        background: "linear-gradient(135deg, #f3f4f6, #e0e7ff)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: "1.8rem",
          fontWeight: "700",
          textAlign: "center",
          color: "#1e40af",
          marginBottom: "1rem",
        }}
      >
        🧠 AI Answer Evaluation Test
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ marginBottom: "1.2rem" }}>
          <label
            style={{
              fontWeight: "600",
              color: "#374151",
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            Enter Question Text:
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type question exactly as in DB"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              outline: "none",
              fontSize: "15px",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
            onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
          />
        </div>

        <div style={{ marginBottom: "1.2rem" }}>
          <label
            style={{
              fontWeight: "600",
              color: "#374151",
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            Upload Student Answer Image:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px dashed #94a3b8",
              borderRadius: "8px",
              background: "#f8fafc",
              cursor: "pointer",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading
              ? "linear-gradient(90deg, #93c5fd, #3b82f6)"
              : "linear-gradient(90deg, #2563eb, #1d4ed8)",
            color: "white",
            fontWeight: "600",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "transform 0.2s, opacity 0.3s",
          }}
          onMouseOver={(e) => (e.target.style.opacity = "0.9")}
          onMouseOut={(e) => (e.target.style.opacity = "1")}
        >
          {loading ? "⏳ Evaluating..." : "🚀 Submit for Evaluation"}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            borderRadius: "12px",
            backgroundColor: "white",
            boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
          }}
        >
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: "700",
              color: "#1e3a8a",
              marginBottom: "1rem",
              borderBottom: "2px solid #e5e7eb",
              paddingBottom: "0.5rem",
            }}
          >
            📝 Evaluation Result
          </h3>

          {result.error ? (
            <p style={{ color: "red", fontWeight: "600" }}>{result.error}</p>
          ) : (
            <div style={{ lineHeight: "1.6", color: "#374151" }}>
              <p>
                <strong>Question:</strong> {result.question}
              </p>
              <p>
                <strong>OCR Extracted:</strong> {result.student_answer}
              </p>
              <p>
                <strong>Score:</strong>{" "}
                <span
                  style={{
                    color:
                      result.score > 8
                        ? "#16a34a"
                        : result.score > 5
                        ? "#f59e0b"
                        : "#dc2626",
                    fontWeight: "700",
                  }}
                >
                  {result.score}
                </span>
              </p>
              <p>
                <strong>Feedback:</strong> {result.feedback}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
