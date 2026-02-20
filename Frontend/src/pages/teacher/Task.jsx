import React, { useState, useEffect } from "react";
import axios from "axios";
import Lottie from "lottie-react";
import bookLoader from "../../assets/Book_Loader.json";


export default function Task() {
  const [grade, setGrade] = useState("8");
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState("");
  const [taskType, setTaskType] = useState("homework");
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  // Default question counts (fetched per grade)
  const [defaults, setDefaults] = useState(null);

  // Custom overrides (empty string = use default)
  const [customShortAnswer, setCustomShortAnswer] = useState("");
  const [customMcq, setCustomMcq] = useState("");
  const [customFillInBlanks, setCustomFillInBlanks] = useState("");
  const [customTrueFalse, setCustomTrueFalse] = useState("");

  // Show/hide custom counts section
  const [showCustom, setShowCustom] = useState(false);

  const grades = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const subjects = ["Mathematics", "Science", "English", "History", "Geography"];

  // Fetch defaults when grade changes
  useEffect(() => {
    if (!grade) return;
    const fetchDefaults = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/question-defaults/${grade}`);
        setDefaults(response.data.defaults);
      } catch (err) {
        console.error("Failed to fetch defaults:", err);
        setDefaults(null);
      }
    };
    fetchDefaults();
  }, [grade]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!grade || !subject || !topic.trim()) return;

    setLoading(true);
    setError(null);
    setQuestions(null);
    setSaveResult(null);

    try {
      const requestBody = {
        topic: topic.trim(),
        grade: grade,
        subject: subject,
        task_type: taskType,
      };

      // Add custom counts only if provided
      if (customShortAnswer !== "") {
        requestBody.custom_short_answer = parseInt(customShortAnswer);
      }
      if (customMcq !== "") {
        requestBody.custom_mcq = parseInt(customMcq);
      }
      if (customFillInBlanks !== "") {
        requestBody.custom_fill_in_the_blanks = parseInt(customFillInBlanks);
      }
      if (customTrueFalse !== "" && customTrueFalse !== "0") {
        requestBody.custom_true_false = parseInt(customTrueFalse);
      }

      const response = await axios.post("http://127.0.0.1:8000/generate-task", requestBody);

      // Log retrieved Pinecone chunks to console for debugging
      if (response.data.retrieval_info?.chunks) {
        console.log("📄 Retrieved Pinecone Chunks:", response.data.retrieval_info.chunks);
        console.log(`📊 Total chunks: ${response.data.retrieval_info.chunks_retrieved}`);
      }

      setQuestions(response.data.questions_json);
    } catch (err) {
      console.error(err);
      setError("Failed to generate questions. Check your server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (!questions) return;

    setSaving(true);
    setSaveResult(null);

    try {
      const response = await axios.post("http://127.0.0.1:8000/save-questions", {
        topic: topic.trim(),
        questions_json: questions,
      });
      setSaveResult({ success: true, message: response.data.message });
    } catch (err) {
      console.error(err);
      setSaveResult({ success: false, message: "Failed to save questions to database." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-6">
          Teacher Task Generator
        </h1>
        <p className="text-center text-gray-600 mb-10">
          Select Grade, Subject, Topic, and Task Type to generate questions
        </p>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Topic */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic (e.g., Water Cycle, Fractions, Cube Roots)"
                required
                className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            {/* Row 2: Grade, Subject, Task Type */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                >
                  {grades.map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Task Type</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                >
                  <option value="homework">Homework</option>
                  <option value="test">Test</option>
                </select>
              </div>
            </div>

            {/* Default Counts Display */}
            {defaults && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2">
                  Grade {grade} Default Question Counts:
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-blue-700">
                  <span className="bg-blue-100 px-3 py-1 rounded-full">
                    Short Answer: {defaults.short_answer}
                  </span>
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                    MCQ: {defaults.mcq}
                  </span>
                  <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full">
                    Fill-in-Blank: {defaults.fill_in_the_blanks}
                  </span>
                  {defaults.true_false > 0 && (
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                      True/False: {defaults.true_false}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Custom Counts (Collapsible) */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCustom(!showCustom)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700 transition-all"
              >
                <span>⚙️ Customize Question Counts (Optional)</span>
                <span className="text-gray-400">{showCustom ? "▲" : "▼"}</span>
              </button>

              {showCustom && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Short Answer Questions
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={customShortAnswer}
                      onChange={(e) => setCustomShortAnswer(e.target.value)}
                      placeholder="Leave blank for default"
                      className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      MCQ Questions
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={customMcq}
                      onChange={(e) => setCustomMcq(e.target.value)}
                      placeholder="Leave blank for default"
                      className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Fill-in-the-Blank
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={customFillInBlanks}
                      onChange={(e) => setCustomFillInBlanks(e.target.value)}
                      placeholder="Leave blank for default"
                      className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      True/False (optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={customTrueFalse}
                      onChange={(e) => setCustomTrueFalse(e.target.value)}
                      placeholder="0 (not included by default)"
                      className="w-full border-2 border-gray-200 p-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? "Generating..." : "Generate Questions"}
            </button>
          </form>

          {loading && (
            <div className="mt-6 text-center flex flex-col items-center">
              <div className="w-48">
                <Lottie animationData={bookLoader} loop={true} />
              </div>
              <p className="mt-2 text-gray-600 font-medium">Generating questions...</p>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}
        </div>

        {questions && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Generated Questions</h2>

            {/* Short Answer */}
            {questions.short_answer && questions.short_answer.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-blue-600 mb-4">Short Answer</h3>
                <div className="space-y-4">
                  {questions.short_answer.map((q, i) => (
                    <div key={i} className="border-l-4 border-blue-300 pl-4 py-2 bg-blue-50 rounded-r">
                      <p className="font-semibold text-gray-800 mb-2">{q.question}</p>
                      <p className="text-gray-700 font-medium">Answer: {q.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MCQ */}
            {questions.mcq && questions.mcq.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-orange-600 mb-4">Multiple Choice Questions</h3>
                <div className="space-y-4">
                  {questions.mcq.map((q, i) => (
                    <div key={i} className="border-l-4 border-orange-300 pl-4 py-2 bg-orange-50 rounded-r">
                      <p className="font-semibold text-gray-800 mb-2">{q.question}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        {Object.entries(q.options).map(([key, val]) => (
                          <div key={key} className="bg-white px-3 py-2 rounded border border-gray-200">{key}: {val}</div>
                        ))}
                      </div>
                      <p className="text-gray-700 font-medium">Answer: {q.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fill in the Blanks */}
            {questions.fill_in_the_blanks && questions.fill_in_the_blanks.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-teal-600 mb-4">Fill in the Blanks</h3>
                <div className="space-y-4">
                  {questions.fill_in_the_blanks.map((q, i) => (
                    <div key={i} className="border-l-4 border-teal-300 pl-4 py-2 bg-teal-50 rounded-r">
                      <p className="font-semibold text-gray-800 mb-2">{q.question}</p>
                      <p className="text-gray-700 font-medium">Answer: {q.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* True/False */}
            {questions.true_false && questions.true_false.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-purple-600 mb-4">True / False</h3>
                <div className="space-y-4">
                  {questions.true_false.map((q, i) => (
                    <div key={i} className="border-l-4 border-purple-300 pl-4 py-2 bg-purple-50 rounded-r">
                      <p className="font-semibold text-gray-800 mb-2">{q.question}</p>
                      <p className="text-gray-700 font-medium">Answer: {q.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmation Button Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <div className="flex flex-col items-center space-y-4">
                <p className="text-gray-600 text-center">
                  Review the questions above. If everything looks correct, click the button below to save them to the database.
                </p>

                <button
                  onClick={handleSaveQuestions}
                  disabled={saving || saveResult?.success}
                  className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg active:scale-95 disabled:cursor-not-allowed ${saveResult?.success
                    ? "bg-green-500 text-white"
                    : "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
                    }`}
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : saveResult?.success ? (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Saved to Database
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Confirm & Save to Database
                    </>
                  )}
                </button>

                {saveResult && (
                  <div className={`p-4 rounded-lg w-full ${saveResult.success
                    ? "bg-green-50 border-l-4 border-green-500"
                    : "bg-red-50 border-l-4 border-red-500"
                    }`}>
                    <p className={`font-medium ${saveResult.success ? "text-green-700" : "text-red-700"}`}>
                      {saveResult.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
