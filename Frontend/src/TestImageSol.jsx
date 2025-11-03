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
  headers: {
    "Content-Type": "multipart/form-data",
  },
  
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
    <div style={{ maxWidth: "600px", margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2>🧠 AI Answer Evaluation Test</h2>
      <form onSubmit={handleSubmit}>
        <label>Enter Question Text:</label><br />
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type question exactly as in DB"
          style={{ width: "100%", marginBottom: "1rem", padding: "8px" }}
        />
        <label>Upload Student Answer Image:</label><br />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: "1rem" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 20px", background: "blue", color: "white", border: "none", borderRadius: "5px" }}
        >
          {loading ? "Evaluating..." : "Submit for Evaluation"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
          <h3>Result</h3>
          {result.error ? (
            <p style={{ color: "red" }}>{result.error}</p>
          ) : (
            <>
              <p><strong>Question:</strong> {result.question}</p>
              <p><strong>OCR Extracted:</strong> {result.student_answer}</p>
              <p><strong>Score:</strong> {result.score}</p>
              <p><strong>Feedback:</strong> {result.feedback}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
